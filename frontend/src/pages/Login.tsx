import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [loginType, setLoginType] = useState<'student' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setRoleOverride } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isLogin && password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      
      if (isLogin) {
        // Real Firebase Login
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Real Firebase Signup
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Save user role in Firestore database
        const user = userCredential.user;
        let finalRole = loginType === 'student' ? 'student' : (email.includes('admin') ? 'admin' : 'invigilator');
        
        await setDoc(doc(db, 'users', user.uid), {
          name: name,
          email: user.email,
          role: finalRole,
          createdAt: new Date().toISOString()
        });
      }
      
      // The onAuthStateChanged in AuthContext will trigger and fetch the role from Firestore.
      // But for immediate redirection we use a fallback override
      if (loginType === 'student') {
        setRoleOverride('student');
        navigate('/student');
      } else {
        // Here we could check the email to decide if admin or invigilator, or rely on Firestore.
        // For simplicity in the UI redirect:
        if (email.includes('admin')) {
          setRoleOverride('admin');
          navigate('/admin');
        } else {
          setRoleOverride('invigilator');
          navigate('/invigilator');
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-api-key') {
        setError('Firebase Error: Please add your actual Firebase Config in src/config/firebase.ts!');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid Email or Password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else {
        setError(err.message || 'Failed to authenticate.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        
        {/* Graphic Side */}
        <div className="hidden md:flex flex-col justify-center space-y-6 pr-8 border-r border-slate-200 dark:border-slate-800">
          <div className="inline-flex items-center space-x-2 bg-primary-500/10 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-full w-max font-medium">
            <KeyRound size={20} />
            <span>Firebase Secured Access</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Welcome to SAMADHAN X</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Log in to your respective portal to continue. Our strict role-based Firebase authentication ensures maximum security and data integrity.
          </p>
          <div className="space-y-4 mt-4">
            <div className={`p-4 rounded-xl border transition-colors ${loginType === 'student' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-slate-200 dark:border-slate-800'}`}>
              <h3 className="font-semibold flex items-center"><User className="mr-2 text-primary-500" size={18} /> Student Portal</h3>
              <p className="text-sm text-slate-500 mt-1">Access your upcoming exams and admit cards.</p>
            </div>
            <div className={`p-4 rounded-xl border transition-colors ${loginType === 'admin' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10' : 'border-slate-200 dark:border-slate-800'}`}>
              <h3 className="font-semibold flex items-center"><ShieldAlert className="mr-2 text-purple-500" size={18} /> Staff Portal</h3>
              <p className="text-sm text-slate-500 mt-1">Global command center and live proctoring.</p>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="glass-card p-8 shadow-2xl relative overflow-hidden">
          {/* Animated Background Blob */}
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -z-10 transition-colors duration-500 ${loginType === 'student' ? 'bg-primary-500/20' : 'bg-purple-500/20'}`}></div>

          <div className="flex space-x-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg mb-8">
            <button
              onClick={() => setLoginType('student')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                loginType === 'student' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Student
            </button>
            <button
              onClick={() => setLoginType('admin')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                loginType === 'admin' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Admin / Invigilator
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <h2 className="text-2xl font-bold mb-6 text-center">
              {isLogin ? (loginType === 'student' ? 'Student Login' : 'Staff Access') : (loginType === 'student' ? 'Student Registration' : 'Staff Registration')}
            </h2>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm font-medium text-center">
                {error}
              </motion.div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required={!isLogin}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={loginType === 'student' ? 'student@example.com' : 'admin@example.com'}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required={!isLogin}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}

            <button disabled={loading} type="submit" className={`w-full py-3 rounded-lg text-white font-medium flex items-center justify-center transition-colors ${loginType === 'student' ? 'bg-primary-600 hover:bg-primary-700' : 'bg-purple-600 hover:bg-purple-700'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {loading ? 'Processing...' : <span className="flex items-center">{isLogin ? 'Login' : 'Create Account'} via Firebase <ArrowRight size={18} className="ml-2" /></span>}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className={`font-medium ${loginType === 'student' ? 'text-primary-600 hover:text-primary-700' : 'text-purple-600 hover:text-purple-700'}`}
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
