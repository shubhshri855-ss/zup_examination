require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

// In-memory mock database
let students = [];
let activeCenterId = 1;
let nextId = 1;

// In-memory OTP store (email -> { otp, expires })
const otps = new Map();

// Configure SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// REST API Endpoints

// Generate and send OTP
app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes expiration
  otps.set(email.toLowerCase(), { otp, expires });

  console.log(`[OTP] Generated for ${email}: ${otp}`);

  // Send real email if SMTP configured, otherwise send simulated
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      await transporter.sendMail({
        from: `"SAMADHAN X Support" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'SAMADHAN X - Password Reset OTP',
        text: `Your OTP for password reset is: ${otp}. It is valid for 5 minutes.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 500px;">
            <h2 style="color: #745843;">SAMADHAN X Password Reset</h2>
            <p>You requested a password reset. Use the following 6-digit One-Time Password (OTP) to complete the request:</p>
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 6px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #0f172a; margin: 20px 0;">
              ${otp}
            </div>
            <p style="font-size: 12px; color: #64748b;">This OTP is valid for 5 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `
      });
      return res.json({ success: true, message: 'OTP sent to your email.' });
    } catch (error) {
      console.error('Failed to send real email:', error);
      return res.json({ 
        success: true, 
        simulated: true, 
        otp, 
        message: 'SMTP Error: Showing simulated OTP in the browser console and UI.' 
      });
    }
  } else {
    return res.json({ 
      success: true, 
      simulated: true, 
      otp, 
      message: 'SMTP config missing in .env. Showing simulated OTP for testing.' 
    });
  }
});

// Verify OTP
app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const record = otps.get(email.toLowerCase());
  if (!record) {
    return res.status(400).json({ error: 'No OTP requested for this email' });
  }

  if (Date.now() > record.expires) {
    otps.delete(email.toLowerCase());
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
  }

  if (record.otp !== otp.trim()) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  otps.delete(email.toLowerCase());
  res.json({ success: true, message: 'OTP verified successfully' });
});

app.get('/api/active-center', (req, res) => {
  res.json({ activeCenterId });
});

app.post('/api/active-center', (req, res) => {
  const { centerId } = req.body;
  if (centerId === undefined) {
    return res.status(400).json({ error: 'centerId is required' });
  }
  activeCenterId = parseInt(centerId);
  io.emit('active_center_changed', activeCenterId);
  console.log(`Active center changed to: ${activeCenterId}`);
  res.json({ success: true, activeCenterId });
});

app.get('/api/students', (req, res) => {
  res.json(students);
});

app.post('/api/students', (req, res) => {
  const { name, roll, seat } = req.body;
  if (!name || !roll || !seat) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newStudent = {
    id: nextId++,
    name,
    roll,
    seat,
    centerId: activeCenterId,
    status: 'pending',
    match: Math.floor(Math.random() * 20) + 80 // Random match between 80-100 for mock purposes
  };

  students.push(newStudent);
  
  // Emit to all connected clients
  io.emit('student_added', newStudent);
  
  res.status(201).json(newStudent);
});

app.put('/api/students/:id/status', (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  
  const student = students.find(s => s.id === id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  student.status = status;
  
  // Emit update
  io.emit('student_updated', student);
  
  res.json(student);
});

app.put('/api/students/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const studentIndex = students.findIndex(s => s.id === id);
  if (studentIndex === -1) {
    return res.status(404).json({ error: 'Student not found' });
  }

  students[studentIndex] = { ...students[studentIndex], ...req.body };
  
  io.emit('student_updated', students[studentIndex]);
  res.json(students[studentIndex]);
});

app.delete('/api/students/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = students.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Student not found' });
  }
  const deletedStudent = students.splice(index, 1)[0];
  io.emit('student_deleted', deletedStudent);
  res.json({ success: true, deletedStudent });
});

app.post('/api/cheat', (req, res) => {
  const { name, message } = req.body;
  
  // Find roll number assigned by invigilator based on the name (case-insensitive)
  const student = students.find(s => s.name.toLowerCase() === (name || '').toLowerCase());
  const roll = student ? student.roll : 'Unassigned';

  console.log(`Cheating attempt by ${name || 'Unknown'} (${roll}): ${message}`);
  
  const alertData = {
    id: Date.now(),
    roll: roll,
    name: name || 'Unknown Student',
    message: message || 'Cheating detected',
    timestamp: new Date().toISOString()
  };
  
  io.emit('cheating_attempt', alertData);
  res.json({ success: true });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`SAMADHAN X Backend Server running on port ${PORT}`);
});
