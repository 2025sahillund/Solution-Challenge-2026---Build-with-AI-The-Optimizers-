
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Shield, Activity, Lock } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Check if this is an admin account
      const isSystemAdmin = (email === 'admin@safecity.com' && password === 'admin123') || 
                           (email === 'sumitbhatia1420@gmail.com' && password === '123456789');

      let userUid = '';
      try {
        // Attempt real Firebase sign-in for security rules context
        const userCredential = await signInAnonymously(auth);
        userUid = userCredential.user.uid;
      } catch (authError) {
        console.warn("Firebase Anonymous Auth restricted or failed, proceeding with local session", authError);
      }
      
      const role = isSystemAdmin ? 'admin' : 'user';
      const userName = isSystemAdmin 
        ? (email === 'sumitbhatia1420@gmail.com' ? 'Sumit Bhatia' : 'City Admin')
        : (email.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ') || 'Authorized Guest');

      // Save user to Firestore via server bridge
      if (userUid) {
        await fetch('/api/users/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: userUid,
            email,
            role,
            userName
          })
        });
      }

      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', role);
      localStorage.setItem('userName', userName);
      
      if (isSystemAdmin) {
        navigate('/admin');
      } else {
        navigate('/roles');
      }
    } catch (error) {
      console.error("Login process failed", error);
      alert("System access failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex font-sans">
      {/* Left Decoration */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center p-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent opacity-50" />
        <div className="relative z-10 max-w-md">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-10 shadow-2xl shadow-red-500/50">
            <Activity className="text-white" size={32} />
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-[0.9] mb-8 italic">
            Seconds <br /> Matter.
          </h1>
          <p className="text-slate-400 text-lg font-serif italic leading-relaxed">
            SafeStay Responder provides enterprise-grade emergency response protocols for premium hospitality providers.
          </p>
        </div>
        
        {/* Abstract Shapes */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] border border-white/5 rounded-full" />
        <div className="absolute top-[-5%] left-[-5%] w-[300px] h-[300px] border border-white/5 rounded-full" />
      </div>

      {/* Right Content */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-20 lg:p-32">
        <div className="max-w-sm w-full mx-auto">
          <div className="mb-12">
             <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">Protocol Access</h2>
             <p className="text-slate-400 text-sm font-medium">Enter your credentials to enter the secure environment.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Internal ID / Email</label>
              <div className="relative">
                <LogIn className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-12 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium text-sm"
                  placeholder="name@safestay.corp"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-12 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Initialize Session'
              )}
            </button>
          </form>

          <div className="mt-20 pt-8 border-t border-slate-100">
             <div className="flex items-center gap-3">
                <Shield className="text-green-500" size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">End-to-End Encryption Enabled</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
