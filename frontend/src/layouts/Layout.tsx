import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, Shield, User, Users, LogOut, LogIn } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    const links: any[] = [{ path: '/', label: 'Home' }];
    
    if (role === 'student') {
      links.push({ path: '/student', label: 'Student Dashboard', icon: <User size={18} className="mr-2 inline" /> });
    } else if (role === 'invigilator') {
      links.push({ path: '/invigilator', label: 'Invigilator Panel', icon: <Users size={18} className="mr-2 inline" /> });
    } else if (role === 'admin') {
      links.push({ path: '/admin', label: 'Admin Command', icon: <Shield size={18} className="mr-2 inline" /> });
      links.push({ path: '/invigilator', label: 'Invigilator Panel', icon: <Users size={18} className="mr-2 inline" /> });
    }
    
    return links;
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Blobs for Modern Aesthetic */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />
      </div>

      <nav className="sticky top-0 z-50 glass-card mx-4 mt-4 px-6 py-4 rounded-full border border-white/20 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Shield className="text-primary-500" size={28} />
          <span className="font-bold text-xl tracking-tight">SAMADHAN X</span>
        </div>
        <div className="hidden md:flex space-x-6 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link flex items-center ${
                location.pathname === link.path ? 'text-primary-600 dark:text-primary-400 font-bold' : ''
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          {!role ? (
            <Link to="/login" className="flex items-center nav-link text-primary-600 dark:text-primary-400 font-bold border-l border-slate-200 dark:border-slate-700 pl-4 ml-2">
              <LogIn size={18} className="mr-2" /> Login
            </Link>
          ) : (
            <button onClick={handleLogout} className="flex items-center nav-link text-red-500 hover:text-red-600 transition-colors border-l border-slate-200 dark:border-slate-700 pl-4 ml-2">
              <LogOut size={18} className="mr-2" /> Logout
            </button>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </nav>

      <main className="flex-grow pt-8 pb-16 px-4 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
