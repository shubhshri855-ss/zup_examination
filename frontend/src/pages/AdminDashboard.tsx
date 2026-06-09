
import { motion } from 'framer-motion';
import { BarChart3, Users, Activity, ShieldAlert, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    { label: 'Total Centers', value: '14', icon: <Activity size={24} />, trend: '+2 this year' },
    { label: 'Total Students', value: '12,450', icon: <Users size={24} />, trend: '98% expected' },
    { label: 'Verified', value: '11,920', icon: <TrendingUp size={24} />, trend: '95.7% success' },
    { label: 'Anomalies', value: '24', icon: <ShieldAlert size={24} />, trend: 'Requires action', alert: true },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Global Command Center</h1>
        <p className="text-slate-600 dark:text-slate-400">High-level overview of SAMADHAN X operations.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`glass-card p-6 border-l-4 ${stat.alert ? 'border-l-red-500' : 'border-l-primary-500'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.alert ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-primary-100 text-primary-600 dark:bg-primary-900/30'}`}>
                {stat.icon}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{stat.label}</div>
              <div className={`text-xs mt-2 ${stat.alert ? 'text-red-500' : 'text-slate-500'}`}>{stat.trend}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Crowd Monitoring Mock */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <Activity className="mr-2 text-primary-500" size={20} />
              Live Crowd Density
            </h2>
            <select className="bg-slate-100 dark:bg-slate-800 border-none text-sm rounded-lg px-3 py-1">
              <option>Center A</option>
              <option>Center B</option>
            </select>
          </div>
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 relative overflow-hidden">
             {/* Heatmap mock */}
            <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-emerald-400 via-yellow-400 to-red-500 blur-2xl rounded-full scale-150 transform translate-x-1/4 -translate-y-1/4"></div>
            <div className="z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-lg shadow-lg text-center">
              <div className="text-sm font-semibold mb-1">Gate 1 Entry</div>
              <div className="text-2xl font-bold text-red-500">High Density</div>
              <div className="text-xs text-slate-500 mt-1">Recommend opening Gate 2</div>
            </div>
          </div>
        </div>

        {/* Verification Analytics Mock */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold flex items-center mb-6">
            <BarChart3 className="mr-2 text-primary-500" size={20} />
            Verification Flow Rate
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Facial Recognition</span>
                <span className="font-semibold text-emerald-500">92%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>OCR Admit Card</span>
                <span className="font-semibold text-primary-500">88%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-primary-500 h-2 rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Manual Override</span>
                <span className="font-semibold text-yellow-500">5%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '5%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold mb-2 text-sm">System Status</h3>
            <div className="flex space-x-2 text-xs">
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1 animate-pulse"></span> OCR Engine Online</span>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1 animate-pulse"></span> Face Match Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
