import { motion } from 'framer-motion';
import { BarChart3, Users, Activity, ShieldAlert, TrendingUp, MapPin } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    { label: 'Total Centers', value: '14', icon: <MapPin size={22} />, trend: '+2 this year' },
    { label: 'Total Students', value: '12,450', icon: <Users size={22} />, trend: '98% expected' },
    { label: 'Verified', value: '11,920', icon: <TrendingUp size={22} />, trend: '95.7% success' },
    { label: 'Anomalies', value: '24', icon: <ShieldAlert size={22} />, trend: 'Requires action', alert: true },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center space-x-3 mb-2">
          <ShieldAlert className="text-primary-600 dark:text-primary-400" size={28} />
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Global Command Center</h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">High-level overview of SAMADHAN X operations and global health.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
            className={`bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm flex flex-col ${stat.alert ? 'border-red-200 dark:border-red-900/50' : 'border-slate-200 dark:border-slate-800'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-lg border ${stat.alert ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400' : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}>
                {stat.icon}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1 tracking-tight text-slate-900 dark:text-white">{stat.value}</div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</div>
              <div className={`text-xs mt-3 font-medium flex items-center ${stat.alert ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {stat.trend}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Crowd Monitoring Mock */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-semibold flex items-center text-slate-900 dark:text-white">
              <Activity className="mr-2 text-slate-400" size={18} />
              Live Crowd Density
            </h2>
            <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700 dark:text-slate-300">
              <option>Center A</option>
              <option>Center B</option>
            </select>
          </div>
          <div className="h-64 bg-slate-50 dark:bg-slate-950 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-800 relative overflow-hidden">
             {/* Clean Heatmap mock */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-100 via-slate-50 to-slate-50 dark:from-red-900/20 dark:via-slate-950 dark:to-slate-950 opacity-80"></div>
            <div className="z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-lg shadow-sm text-center max-w-[200px]">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Gate 1 Entry</div>
              <div className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">High Density</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Recommend opening Gate 2 immediately</div>
            </div>
          </div>
        </div>

        {/* Verification Analytics Mock */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-semibold flex items-center text-slate-900 dark:text-white">
              <BarChart3 className="mr-2 text-slate-400" size={18} />
              Verification Flow Rate
            </h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">Facial Recognition</span>
                <span className="font-semibold text-slate-900 dark:text-white">92%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">OCR Admit Card</span>
                <span className="font-semibold text-slate-900 dark:text-white">88%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-slate-600 dark:bg-slate-400 h-1.5 rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">Manual Override</span>
                <span className="font-semibold text-slate-900 dark:text-white">5%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-slate-300 dark:bg-slate-600 h-1.5 rounded-full" style={{ width: '5%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <h3 className="font-semibold mb-3 text-sm text-slate-900 dark:text-white">System Status</h3>
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md flex items-center font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> OCR Engine
              </span>
              <span className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md flex items-center font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> Face Match
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
