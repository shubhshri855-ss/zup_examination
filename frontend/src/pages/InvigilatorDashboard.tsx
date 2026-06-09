import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, CheckCircle, AlertCircle, Search, UserCheck, Plus } from 'lucide-react';
import { io } from 'socket.io-client';

interface Student {
  id: number;
  name: string;
  roll: string;
  status: string;
  seat: string;
  match: number | null;
}

export default function InvigilatorDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', roll: '', seat: '' });
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://127.0.0.1:3000' : `${window.location.protocol}//${window.location.hostname}:3000`);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/students`)
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(err => console.error('Failed to fetch students', err));

    const socket = io(BACKEND_URL);
    
    socket.on('student_added', (student: Student) => {
      setStudents(prev => [...prev, student]);
    });

    socket.on('student_updated', (updatedStudent: Student) => {
      setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.roll || !newStudent.seat) return;
    try {
      await fetch(`${BACKEND_URL}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });
      setShowAddModal(false);
      setNewStudent({ name: '', roll: '', seat: '' });
    } catch(err) {
      console.error(err);
    }
  };

  const toggleStatus = async (student: Student) => {
    const nextStatus = student.status === 'pending' ? 'verified' : student.status === 'verified' ? 'flagged' : 'pending';
    try {
      await fetch(`${BACKEND_URL}/api/students/${student.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
    } catch(err) {
      console.error(err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="text-emerald-500" size={20} />;
      case 'pending': return <UserCheck className="text-slate-400" size={20} />;
      case 'flagged': return <AlertCircle className="text-red-500" size={20} />;
      default: return null;
    }
  };

  const filteredStudents = students.filter(s => s.roll.toLowerCase().includes(searchTerm.toLowerCase()) || s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const presentCount = students.length;
  const verifiedCount = students.filter(s => s.status === 'verified').length;
  const flaggedCount = students.filter(s => s.status === 'flagged').length;

  return (
    <div className="space-y-8 animate-fade-in relative">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Invigilator Panel</h1>
          <p className="text-slate-600 dark:text-slate-400">Hall 3 • Advanced Algorithms (Live Backend)</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-500 mb-1">Time Remaining</div>
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">02:14:00</div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 flex items-center space-x-4">
          <div className="bg-primary-100 dark:bg-primary-900/50 p-4 rounded-full text-primary-600">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{presentCount}/50</div>
            <div className="text-sm text-slate-500">Present</div>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center space-x-4 border-emerald-500/20">
          <div className="bg-emerald-100 dark:bg-emerald-900/50 p-4 rounded-full text-emerald-600">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{verifiedCount}</div>
            <div className="text-sm text-slate-500">Verified</div>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center space-x-4 border-red-500/20">
          <div className="bg-red-100 dark:bg-red-900/50 p-4 rounded-full text-red-600">
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{flaggedCount}</div>
            <div className="text-sm text-slate-500">Flagged</div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-xl font-semibold flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            Live Verification Feed
          </h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search roll no..." 
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center py-2 text-sm">
              <Plus size={16} className="mr-1" /> Add Entry
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
              <tr>
                <th className="p-4 font-medium">Roll No</th>
                <th className="p-4 font-medium">Student Name</th>
                <th className="p-4 font-medium">Seat</th>
                <th className="p-4 font-medium">AI Match</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              <AnimatePresence>
                {filteredStudents.map((student) => (
                  <motion.tr 
                    key={student.id} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-4 font-medium">{student.roll}</td>
                    <td className="p-4">{student.name}</td>
                    <td className="p-4">{student.seat}</td>
                    <td className="p-4">
                      {student.match ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${student.match > 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {student.match}% Match
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="p-4 flex items-center space-x-2">
                      {getStatusIcon(student.status)}
                      <span className="capitalize text-sm font-medium">{student.status}</span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleStatus(student)}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium border border-primary-500/30 px-3 py-1 rounded hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                      >
                        Change Status
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No records found. Add a new entry to see it here live.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-white">Add Manual Entry</h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Student Name</label>
                <input required type="text" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Roll Number</label>
                <input required type="text" value={newStudent.roll} onChange={e => setNewStudent({...newStudent, roll: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Assigned Seat</label>
                <input required type="text" value={newStudent.seat} onChange={e => setNewStudent({...newStudent, seat: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 outline-none" />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" className="btn-primary">Save Entry</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
