
import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, UserCog, Activity } from 'lucide-react';

export default function RoleSelection() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-200">
          <Activity size={32} className="text-white" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">SafeStay Responder</h1>
        <p className="text-slate-500 font-serif italic">Select your access profile to proceed</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <RoleCard 
          title="Guest Interface"
          description="Access emergency controls for your room. High-visibility panic buttons for immediate assistance."
          icon={<ShieldAlert size={40} />}
          color="bg-red-600"
          onClick={() => navigate('/guest')}
        />
        <RoleCard 
          title="Admin Dashboard"
          description="Monitor active alerts, manage hospital dispatch, and oversee system-wide response status."
          icon={<UserCog size={40} />}
          color="bg-slate-900"
          onClick={() => navigate('/admin')}
        />
      </div>

      <div className="mt-20 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
        SafeStay Protocol V4.2 • AI Core Connected
      </div>
    </div>
  );
}

function RoleCard({ title, description, icon, color, onClick }: { title: string, description: string, icon: React.ReactNode, color: string, onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white border border-slate-200 p-10 rounded-[40px] text-left shadow-2xl shadow-slate-100 flex flex-col gap-6 group transition-all"
    >
      <div className={`${color} w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-lg`}>
        {icon}
      </div>
      <div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3 group-hover:text-red-600 transition-colors">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed font-medium">{description}</p>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-widest">
        <span>Access Portal</span>
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </div>
    </motion.button>
  );
}
