
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheck, BrainCircuit, Users, Lock, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { role } = useAuth();
  const features = [
    {
      title: "AI Verification",
      desc: "Smart OCR and Face Recognition for seamless onboarding.",
      icon: <BrainCircuit size={32} className="text-primary-500" />
    },
    {
      title: "Real-time Monitoring",
      desc: "Live analytics and attendance tracking for invigilators.",
      icon: <Users size={32} className="text-purple-500" />
    },
    {
      title: "Bank-Grade Security",
      desc: "Ensuring fair play and zero cheating with advanced tech.",
      icon: <Lock size={32} className="text-emerald-500" />
    }
  ];

  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="text-center pt-20 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center space-x-2 bg-primary-500/10 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-full mb-6 font-medium">
            <ShieldCheck size={20} />
            <span>Next-Gen Examination Ecosystem</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
            SAMADHAN X
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10">
            A secure, fair, and intelligent examination platform empowering students, invigilators, and administrators globally.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {!role ? (
              <Link to="/login" className="btn-primary text-lg px-8 py-3 flex items-center justify-center">
                Get Started Securely <ChevronRight size={20} className="ml-2" />
              </Link>
            ) : role === 'student' ? (
              <Link to="/student" className="btn-primary text-lg px-8 py-3 flex items-center justify-center">
                Go to My Dashboard <ChevronRight size={20} className="ml-2" />
              </Link>
            ) : (
              <Link to={`/${role}`} className="btn-primary text-lg px-8 py-3 flex items-center justify-center">
                Access Staff Portal <ChevronRight size={20} className="ml-2" />
              </Link>
            )}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Core Capabilities</h2>
          <p className="text-slate-600 dark:text-slate-400">Powered by advanced AI and real-time data analytics.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="glass-card p-8 hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="bg-slate-50 dark:bg-slate-800/50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="text-center text-slate-500 dark:text-slate-400 pb-8 border-t border-slate-200 dark:border-slate-800 pt-8 mt-24">
        <p>© 2026 SAMADHAN X. All rights reserved.</p>
      </footer>
    </div>
  );
}
