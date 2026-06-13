import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, ShieldAlert, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { toast } from 'react-hot-toast';

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
      localStorage.setItem('auth_email', email);
      
      if (!isLogin && password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const finalRole = loginType === 'student' ? 'student' : (email.includes('admin') ? 'admin' : 'invigilator');

        const userDocRef = doc(db, 'users', user.uid);
        // Do not await getDoc and setDoc to give instant access
        getDoc(userDocRef).then((userDocSnap) => {
          if (!userDocSnap.exists()) {
             const inferredName = email.split('@')[0];
             setDoc(userDocRef, {
               name: inferredName,
               email: user.email,
               role: finalRole,
               createdAt: new Date().toISOString()
             });
             localStorage.setItem('auth_name', inferredName);
          } else {
             const data = userDocSnap.data();
             if (data && data.name) {
               localStorage.setItem('auth_name', data.name);
             }
          }
        }).catch(console.error);
        toast.success("Login successful!", { duration: 2000 });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const finalRole = loginType === 'student' ? 'student' : (email.includes('admin') ? 'admin' : 'invigilator');
        
        // Do not await setDoc to give instant access
        setDoc(doc(db, 'users', user.uid), {
          name: name,
          email: user.email,
          role: finalRole,
          createdAt: new Date().toISOString()
        }).catch(console.error);
        localStorage.setItem('auth_name', name);
        toast.success("Signup successful!", { duration: 2000 });
      }
      
      if (loginType === 'student') {
        setRoleOverride('student');
        navigate('/student');
      } else {
        if (email.includes('admin')) {
          setRoleOverride('admin');
          navigate('/admin');
        } else {
          setRoleOverride('invigilator');
          navigate('/invigilator');
        }
      }
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      console.error(err);
      if (err.code === 'auth/invalid-api-key') {
        setError('Firebase Error: Please add your actual Firebase Config in src/config/firebase.ts!');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        toast.error('You have not signed up yet. Please sign up first!', { duration: 4000 });
        setIsLogin(false); // Switch to signup
      } else if (err.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered. Please login.', { duration: 4000 });
        setIsLogin(true); // Switch to login
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
    <div className="min-h-[85vh] flex items-center justify-center">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-0 shadow-soft-lg rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        
        {/* Graphic Side */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 relative">
          <div>
            <div className="inline-flex items-center space-x-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-md mb-8 text-xs font-semibold uppercase tracking-wider border border-slate-200 dark:border-slate-800 shadow-sm">
              <KeyRound size={14} className="text-primary-600 dark:text-primary-400" />
              <span>Firebase Secured</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">SAMADHAN X Portal</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">
              Access your examination environment. Our role-based infrastructure ensures strict data separation and maximum security.
            </p>
            
            <div className="space-y-4">
              <div className={`p-4 rounded-xl transition-colors border ${loginType === 'student' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
                <h3 className="font-semibold flex items-center text-sm text-slate-900 dark:text-white"><User className="mr-2 text-primary-600 dark:text-primary-400" size={16} /> Student Access</h3>
                <p className="text-xs text-slate-500 mt-1">Access upcoming exams and admit cards.</p>
              </div>
              <div className={`p-4 rounded-xl transition-colors border ${loginType === 'admin' ? 'border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
                <h3 className="font-semibold flex items-center text-sm text-slate-900 dark:text-white"><ShieldAlert className="mr-2 text-slate-600 dark:text-slate-400" size={16} /> Staff Portal</h3>
                <p className="text-xs text-slate-500 mt-1">Global command center and live proctoring.</p>
              </div>
            </div>
          </div>
          <div className="mt-12 flex items-center text-xs text-slate-500 font-medium">
            <ShieldCheck size={16} className="mr-2 text-emerald-500" />
            End-to-End Encrypted Connection
          </div>
        </div>

        {/* Form Side */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          
          <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg mb-10 w-full max-w-sm mx-auto">
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
              Staff
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 w-full max-w-sm mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isLogin ? 'Sign in to account' : 'Create new account'}
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                {loginType === 'student' ? 'Student Portal Access' : 'Administration & Proctoring'}
              </p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/10 dark:border-red-900/50 dark:text-red-400 rounded-lg text-sm font-medium">
                {error}
              </motion.div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required={!isLogin}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="input-field"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={loginType === 'student' ? 'student@example.com' : 'admin@example.com'}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="input-field"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  required={!isLogin}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="input-field"
                />
              </div>
            )}

            <button disabled={loading} type="submit" className={`w-full btn-primary py-3 mt-4 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {loading ? 'Authenticating...' : <span className="flex items-center">{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={16} className="ml-2" /></span>}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-slate-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
