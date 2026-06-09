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
let students = [
  { id: 1, name: 'John Doe', roll: 'CS-442', status: 'verified', seat: 'A-12', match: 98 },
  { id: 2, name: 'Jane Smith', roll: 'CS-443', status: 'pending', seat: 'A-13', match: null },
];

let nextId = 3;

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

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`SAMADHAN X Backend Server running on port ${PORT}`);
});
