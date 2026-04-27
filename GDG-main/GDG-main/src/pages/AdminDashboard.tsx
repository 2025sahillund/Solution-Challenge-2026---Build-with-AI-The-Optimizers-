import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Activity, Flame, Plus, Minus, RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertStatus } from '../types';

interface Resources {
  medical: number;
  fire: number;
  security: number;
}

export default function AdminDashboard() {
  const [resources, setResources] = useState<Resources>({ medical: 0, fire: 0, security: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await fetch('/api/resources');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setResources(data);
      } catch (error) {
        console.error("Fetch resources failed", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/alerts');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setAlerts(data);
      } catch (error) {
        console.error("Fetch alerts failed", error);
      }
    };

    fetchResources();
    fetchAlerts();
    const interval = setInterval(() => {
      fetchResources();
      fetchAlerts();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateAlertStatus = async (id: string, status: AlertStatus) => {
    try {
      await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (error) {
      console.error("Update alert status failed", error);
    }
  };

  const updateResource = async (type: keyof Resources, delta: number) => {
    setUpdating(type);
    try {
      const newValue = Math.max(0, resources[type] + delta);
      await fetch('/api/resources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [type]: newValue })
      });
    } catch (error) {
      console.error("Update failed", error);
    } finally {
      setUpdating(null);
    }
  };

  const replenishAll = async () => {
    setUpdating('all');
    try {
      await fetch('/api/resources/replenish', { method: 'POST' });
    } catch (error) {
      console.error("Replenish failed", error);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Command Center</h1>
            <p className="text-slate-500 font-serif italic mt-1 font-medium italic">Hospital Emergency Dispatch Control • Global View</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</span>
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                ALL SYSTEMS NOMINAL
              </span>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all text-sm font-bold shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              EXIT COMMAND
            </button>
          </div>
        </header>

        {/* TOP SECTION: ACTIVE ALERTS (Prominent) */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Active Deployments</h2>
              <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-lg shadow-lg shadow-red-200">{alerts.length}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Live Tactical Feed
            </div>
          </div>
          
          {alerts.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-20 text-center shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="text-slate-200 w-10 h-10" />
              </div>
              <p className="text-slate-400 font-serif italic text-xl max-w-sm mx-auto">No immediate threats detected. All sectors reporting clear status.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              <AnimatePresence>
                {alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white border border-slate-100 rounded-[40px] p-10 shadow-2xl shadow-slate-200/40 flex flex-col gap-10"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                      <div className="flex items-start gap-8">
                        <div className={`p-5 rounded-[24px] shadow-lg ${
                          alert.type === 'Medical' ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100' :
                          alert.type === 'Fire' ? 'bg-orange-50 text-orange-600 shadow-orange-100' : 'bg-blue-50 text-blue-600 shadow-blue-100'
                        }`}>
                          {alert.type === 'Medical' ? <Activity size={40} /> :
                           alert.type === 'Fire' ? <Flame size={40} /> : <Shield size={40} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-4 mb-3">
                            <span className="text-3xl font-black text-slate-900 leading-none tracking-tighter uppercase">Room {alert.roomNumber}</span>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                               alert.type === 'Medical' ? 'bg-emerald-600 text-white' :
                               alert.type === 'Fire' ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'
                            }`}>
                              {alert.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                            <span>Caller: {alert.guestName}</span>
                            <span className="text-slate-200">|</span>
                            <span>{new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 self-start md:self-end">Response Workflow Control</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                          {[
                            { s: AlertStatus.ALERTING, l: 'Awaiting', color: 'bg-red-50 text-red-600' },
                            { s: AlertStatus.HOSPITAL_ASSIGNED, l: 'Assigned', color: 'bg-blue-50 text-blue-600' },
                            { s: AlertStatus.AMBULANCE_EN_ROUTE, l: 'Dispatch', color: 'bg-orange-50 text-orange-600' },
                            { s: AlertStatus.RESOLVED, l: 'Resolve', color: 'bg-emerald-50 text-emerald-600' }
                          ].map(step => (
                            <button
                              key={step.s}
                              onClick={() => updateAlertStatus(alert.id, step.s)}
                              className={`flex flex-col items-center justify-center gap-2 p-5 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                                alert.status === step.s 
                                  ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-105 z-10' 
                                  : `bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50`
                              }`}
                            >
                              {step.l}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* AI INTEL & RESOURCE ALLOCATION */}
                    <div className="grid md:grid-cols-3 gap-8">
                      <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 flex flex-col justify-between">
                         <div className="flex items-center gap-2 mb-4">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tactical Strategy</span>
                         </div>
                         <p className="text-sm font-medium leading-relaxed italic text-slate-600">
                           "{alert.aiReasoning || "Optimizing response vector based on real-time traffic and hospital load balancing."}"
                         </p>
                      </div>

                      <div className="md:col-span-2 bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Shield size={120} />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between h-full gap-8">
                          <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-white/10 rounded-[28px] flex items-center justify-center font-black text-4xl shadow-inner">
                              {alert.type === 'Medical' ? '🏥' : alert.type === 'Fire' ? '🚒' : '🚓'}
                            </div>
                            <div>
                               <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mb-2">Primary Allocation</p>
                               <p className="text-2xl font-black text-white uppercase tracking-tight">
                                 {alert.assignedHospital || "Awaiting AI Designation..."}
                               </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 px-8 py-4 bg-white/5 rounded-2xl border border-white/10">
                            <div className="text-right">
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ETA</p>
                              <p className="text-xl font-black text-white">4.2m</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* FACILITY STATUS MONITOR (Synced with live resources) */}
        <div className="mb-16">
           <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Asset Deployment Status</h2>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: 'City Central', status: resources.medical > 0 ? 'Optimal' : 'Capacity', cap: resources.medical === 0 ? '100%' : '82%', color: resources.medical > 0 ? 'text-emerald-500' : 'text-red-500', resLabel: 'Beds Available', count: resources.medical + 10 },
                { name: 'Main St Fire', status: resources.fire > 0 ? 'Optimal' : 'Depleted', cap: resources.fire === 0 ? '100%' : '20%', color: resources.fire > 0 ? 'text-emerald-500' : 'text-orange-500', resLabel: 'Fire Response', count: resources.fire + 2 },
                { name: 'Sector 4 Depot', status: resources.medical > 0 ? 'Optimal' : 'Alert', cap: '45%', color: 'text-blue-500', resLabel: 'Ambulances', count: resources.medical + 1 },
                { name: 'Police H.Q.', status: resources.security > 0 ? 'Optimal' : 'Critical', cap: '12%', color: 'text-emerald-500', resLabel: 'Tactical Units', count: resources.security + 5 }
              ].map(f => (
                <div key={f.name} className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm">
                   <p className="text-xs font-black text-slate-900 mb-1">{f.name}</p>
                   <div className="flex items-center gap-2 mb-6">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${f.color}`}>{f.status}</span>
                   </div>
                   
                   <div className="mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{f.resLabel}</p>
                      <p className="text-4xl font-black text-slate-900">{f.count}</p>
                   </div>

                   <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                      <div className={`h-full bg-slate-900 rounded-full`} style={{ width: f.cap }}></div>
                   </div>
                   <div className="flex justify-between items-center mt-2">
                      <p className="text-[8px] text-slate-400 font-bold uppercase">Theater Load</p>
                      <p className="text-[8px] text-slate-900 font-black">{f.cap}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* SECOND SECTION: RESOURCE MONITORING (Bento Style) */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Resource Reserves</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
          {[
            { id: 'medical', label: 'Medical Fleet', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { id: 'fire', label: 'Response Units', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
            { id: 'security', label: 'Tactical Team', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-50' }
          ].map((item) => {
            const val = resources[item.id as keyof Resources];
            return (
              <motion.div 
                key={item.id}
                whileHover={{ y: -5 }}
                className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className={`p-4 rounded-xl ${item.bg}`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <span className="font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">{item.label}</span>
                </div>
                
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-7xl font-black text-slate-900 leading-none tracking-tighter">
                      {val}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Units Available</div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button 
                      disabled={updating !== null}
                      onClick={() => updateResource(item.id as keyof Resources, 1)}
                      className="p-3 bg-slate-900 text-white hover:bg-black disabled:opacity-30 rounded-2xl transition-all shadow-md active:scale-95"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                    <button 
                      disabled={updating !== null || val === 0}
                      onClick={() => updateResource(item.id as keyof Resources, -1)}
                      className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 disabled:opacity-30 rounded-2xl transition-all active:scale-95"
                    >
                      <Minus className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

        <div className="bg-slate-900 rounded-[48px] p-16 mt-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/5 to-transparent"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
            <div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Command Flush</h2>
              <p className="text-slate-400 max-w-xl font-medium leading-relaxed italic">
                Protocol 42-A: Replenishing resources will reset all operational units back to base deployment levels (2 per sector). 
                Initiate only after total theater resolution.
              </p>
            </div>
            <button 
              onClick={replenishAll}
              disabled={updating !== null}
              className="flex items-center justify-center gap-4 px-12 py-8 bg-white text-slate-900 rounded-[32px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all group shrink-0 shadow-2xl shadow-white/10"
            >
              <RefreshCw className={`w-7 h-7 group-hover:rotate-180 transition-transform duration-1000 ${updating === 'all' ? 'animate-spin' : ''}`} />
              RESET ARSENAL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
