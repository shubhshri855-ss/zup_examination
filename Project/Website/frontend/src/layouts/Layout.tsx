import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  CheckSquare, 
  Eye, 
  BarChart2, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Plus, 
  X,
  Menu
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    title: 'Advanced Algorithm Analysis',
    code: 'CS-402',
    hall: 'Hall 3',
    duration: '120'
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/student', label: 'Dashboard', icon: <LayoutGrid size={18} /> },
    { path: '/examinations', label: 'Examinations', icon: <CheckSquare size={18} /> },
    { path: '/invigilator', label: 'Proctoring', icon: <Eye size={18} /> },
    { path: '/admin', label: 'Reports', icon: <BarChart2 size={18} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Session for ${sessionForm.title} initialized successfully!`);
    setShowNewSessionModal(false);
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-900 font-sans">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2.5 rounded-lg bg-[#0d1424] text-white shadow-lg focus:outline-none"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Left Dark Navy Sidebar */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0d1424] text-white flex flex-col justify-between py-6 px-4 transition-transform duration-300 ease-in-out border-r border-slate-800/80
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div>
          {/* Brand Logo */}
          <div className="px-3 mb-8">
            <Link to="/" className="text-xl font-bold tracking-widest text-white uppercase block">
              SAMADHAN X
            </Link>
          </div>

          {/* User Profile Card */}
          <div className="px-3 py-3 mb-6 flex items-center space-x-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <img 
              src="/avatar.jpg" 
              alt="System Controller" 
              className="w-10 h-10 rounded-full object-cover border border-white/20 shadow-sm"
              onError={(e) => {
                // Fallback placeholder if image not found
                e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
              }}
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-white truncate">System Controller</h3>
              <p className="text-[11px] text-slate-400 font-mono truncate">Admin Access</p>
            </div>
          </div>

          {/* New Session Button */}
          <div className="px-1 mb-6">
            <button
              onClick={() => setShowNewSessionModal(true)}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white rounded-lg font-medium text-sm flex items-center justify-center space-x-2 shadow-sm transition-all"
            >
              <Plus size={16} />
              <span>New Session</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path === '/student' && location.pathname === '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-[#1b263b] text-white font-semibold shadow-inner' 
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <span className={isActive ? 'text-blue-400' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-800/80 pt-4 px-2 space-y-1">
          <Link
            to="/settings"
            onClick={() => setMobileOpen(false)}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <HelpCircle size={17} />
            <span>Support</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-left"
          >
            <LogOut size={17} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <main className="flex-1 p-6 md:p-8 lg:p-10 bg-grid-pattern min-h-screen">
          <div className="max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Create New Exam Session</h3>
              <button 
                onClick={() => setShowNewSessionModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Exam Title</label>
                <input 
                  type="text"
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm({...sessionForm, title: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Course Code</label>
                  <input 
                    type="text"
                    value={sessionForm.code}
                    onChange={(e) => setSessionForm({...sessionForm, code: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Hall</label>
                  <input 
                    type="text"
                    value={sessionForm.hall}
                    onChange={(e) => setSessionForm({...sessionForm, hall: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Duration (Minutes)</label>
                <input 
                  type="number"
                  value={sessionForm.duration}
                  onChange={(e) => setSessionForm({...sessionForm, duration: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Launch Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

