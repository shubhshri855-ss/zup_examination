const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

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

let nextId = 1;

// REST API Endpoints
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
