
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin } from 'lucide-react';
import { EmergencyType, AlertStatus, Alert } from '../types';
import { matchHospital } from '../services/geminiService';

export default function GuestPanic() {
  const [stage, setStage] = useState<'idle' | 'choosing' | 'active'>('idle');
  const [currentAlert, setCurrentAlert] = useState<Alert | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [etaSeconds, setEtaSeconds] = useState(252); // ~4 minutes

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (stage === 'active' && currentAlert && currentAlert.status !== AlertStatus.RESOLVED) {
      timer = setInterval(() => {
        setEtaSeconds(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stage, currentAlert]);

  const formatEta = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  useEffect(() => {
    if (stage === 'choosing' || stage === 'active') {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Geolocation error", err)
      );
    }
  }, [stage]);

  // Polling for status updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentAlert?.id && stage === 'active') {
      const pollAlert = async () => {
        try {
          const res = await fetch(`/api/alerts`);
          if (!res.ok) {
            console.error(`Poll failed with status: ${res.status}`);
            return;
          }
          const alerts: Alert[] = await res.json();
          const updated = alerts.find(a => a.id === currentAlert.id);
          if (updated && updated.status !== currentAlert.status) {
            console.log("Status updated to:", updated.status);
            setCurrentAlert(updated);
          }
        } catch (error) {
          console.error("Alert poll failed", error);
        }
      };
      
      interval = setInterval(pollAlert, 2000); // More frequent polling for better experience
    }
    return () => clearInterval(interval);
  }, [currentAlert?.id, currentAlert?.status, stage]);

  const triggerPanic = () => setStage('choosing');

  const selectEmergency = async (type: EmergencyType) => {
    const alertData = {
      guestName: localStorage.getItem('userName') || "Authorized Guest",
      roomNumber: "402", // Mock
      type,
      location,
      status: AlertStatus.ALERTING // Initial status
    };

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const newAlert: Alert = await res.json();
      setCurrentAlert(newAlert);
      setStage('active');

      // Trigger Gemini matching automatically for ALL types now
      try {
        const { hospitalId, reasoning } = await matchHospital(type, location?.lat, location?.lng);
        
        if (hospitalId) {
          const updateRes = await fetch(`/api/alerts/${newAlert.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              status: AlertStatus.HOSPITAL_ASSIGNED,
              assignedHospital: hospitalId,
              aiReasoning: reasoning
            })
          });
          if (updateRes.ok) {
            const updatedAlert = await updateRes.json();
            setCurrentAlert(updatedAlert);
          }
        }
      } catch (error) {
        console.error("Manual AI Match step failed", error);
      }
    } catch (e) {
      console.error("Failed to create alert", e);
    }
  };

  const getStatusIndex = (status: AlertStatus) => {
    const stages = [
      AlertStatus.ALERTING,
      AlertStatus.HOSPITAL_ASSIGNED,
      AlertStatus.AMBULANCE_EN_ROUTE,
      AlertStatus.RESOLVED
    ];
    return stages.indexOf(status);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center font-sans overflow-hidden">
      <div className="w-[360px] h-[720px] bg-white rounded-[48px] border-[10px] border-slate-900 shadow-2xl relative flex flex-col overflow-hidden">
        {/* Mobile Status Bar */}
        <div className="h-14 flex justify-between items-center px-10 text-[11px] font-bold text-slate-400">
          <span>9:41</span>
          <div className="flex gap-1.5 items-center">
            <div className="w-4 h-2 bg-slate-200 rounded-sm"></div>
            <div className="w-5 h-2.5 bg-slate-900 rounded-sm"></div>
          </div>
        </div>

        <div className="flex-1 px-8 flex flex-col pt-4">
          <div className="mb-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Help Required?</h2>
            <p className="text-slate-500 text-sm font-medium">Room {currentAlert?.roomNumber || '402'} • New York Central</p>
          </div>

          <AnimatePresence mode="wait">
            {stage === 'idle' && (
              <motion.div
                key="idle-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col justify-end pb-12"
              >
                <div className="mb-8 text-center">
                  <p className="text-slate-400 text-xs uppercase tracking-[0.2em] font-bold mb-2">Emergency System</p>
                  <p className="text-slate-500 text-sm italic">Press and hold for 1 second</p>
                </div>
                <button
                  onClick={triggerPanic}
                  className="w-full h-32 bg-red-600 rounded-3xl shadow-2xl shadow-red-200 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform group"
                >
                  <span className="text-white font-black text-4xl tracking-tighter italic">PANIC</span>
                  <span className="text-red-200 text-[10px] font-bold uppercase tracking-[0.3em]">Trigger Alert</span>
                </button>
              </motion.div>
            )}

            {stage === 'choosing' && (
              <motion.div
                key="selection"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex-1 overflow-y-auto"
              >
                {/* NEARBY CENTERS PREVIEW */}
                <div className="mb-8">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Nearby Facilities</h3>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      { name: 'City Central', type: 'Hosp', dist: '0.8km' },
                      { name: 'Sector 4', type: 'Prec', dist: '1.2km' },
                      { name: 'Red Metro', type: 'Fire', dist: '2.4km' },
                      { name: 'State Med', type: 'Hosp', dist: '3.1km' }
                    ].map(center => (
                      <div key={center.name} className="p-3 bg-white border border-slate-100 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-900">{center.name}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[8px] text-slate-400 uppercase font-black">{center.type}</span>
                          <span className="text-[8px] font-black text-blue-500">{center.dist}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <EmergencyButton 
                      icon="🏥" 
                      label="Medical" 
                      color="bg-red-50" 
                      textColor="text-red-600"
                      borderColor="border-red-100"
                      onClick={() => selectEmergency(EmergencyType.MEDICAL)} 
                    />
                    <EmergencyButton 
                      icon="🔥" 
                      label="Fire" 
                      color="bg-orange-50" 
                      textColor="text-orange-600"
                      borderColor="border-orange-100"
                      onClick={() => selectEmergency(EmergencyType.FIRE)} 
                    />
                    <EmergencyButton 
                      icon="🛡️" 
                      label="Security" 
                      color="bg-slate-50" 
                      textColor="text-slate-600"
                      borderColor="border-slate-200"
                      onClick={() => selectEmergency(EmergencyType.SECURITY)} 
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {stage === 'active' && currentAlert && (
              <motion.div
                key="tracker"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1"
              >
                <div className="mb-8 p-5 bg-slate-50 border border-slate-100 rounded-[24px]">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${currentAlert.status === AlertStatus.RESOLVED ? 'bg-emerald-500' : 'bg-blue-600 animate-pulse'}`}></span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${currentAlert.status === AlertStatus.RESOLVED ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {currentAlert.status === AlertStatus.RESOLVED ? 'Emergency Resolved' : 'Active Deployment'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                      {currentAlert.status === AlertStatus.RESOLVED ? 'SUCCESS' : 'TRACKING'}
                    </span>
                  </div>
                  
                  <div className="space-y-6">
                    <MinimalStep 
                      label="Station Alerted" 
                      completed={getStatusIndex(currentAlert.status) > 0} 
                      active={getStatusIndex(currentAlert.status) === 0} 
                    />
                    <MinimalStep 
                      label="Facility Assigned" 
                      completed={getStatusIndex(currentAlert.status) > 1} 
                      active={getStatusIndex(currentAlert.status) === 1} 
                      subtext={currentAlert.assignedHospital || "Allocating closest unit..."}
                    />
                    <MinimalStep 
                      label="Unit Dispatch" 
                      completed={getStatusIndex(currentAlert.status) > 2} 
                      active={getStatusIndex(currentAlert.status) === 2} 
                      subtext={currentAlert.status === AlertStatus.RESOLVED ? "Arrived" : `Responder ETA: ${formatEta(etaSeconds)}`}
                    />
                    <MinimalStep 
                      label="Case Resolved" 
                      completed={false} 
                      active={getStatusIndex(currentAlert.status) === 3} 
                      isResolved={currentAlert.status === AlertStatus.RESOLVED}
                    />
                  </div>
                </div>

                {currentAlert.status === AlertStatus.RESOLVED ? (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setStage('idle')}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-colors"
                  >
                    Return to Home
                  </motion.button>
                ) : (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setStage('choosing')}
                    className="w-full py-3 bg-white border border-slate-200 text-slate-400 rounded-2xl font-bold uppercase tracking-widest text-[9px] hover:bg-slate-50 transition-colors"
                  >
                    + Add Secondary Crisis
                  </motion.button>
                )}

                {/* GEMINI BRANDING REMOVED AS REQUESTED */}

                <div className="mt-auto pt-8 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin size={12} />
                    <span className="text-[10px] font-mono">{location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "GPS ACTIVE"}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">SafeStay v4.2 Protocol</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Home Bar */}
        <div className="h-1.5 w-32 bg-slate-200 rounded-full mb-3 mx-auto flex-shrink-0"></div>
      </div>
    </div>
  );
}

function EmergencyButton({ icon, label, color, textColor, borderColor, onClick }: { icon: string, label: string, color: string, textColor: string, borderColor: string, onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full py-5 rounded-2xl border ${borderColor} ${color} flex items-center px-6 gap-4 shadow-sm hover:shadow-md transition-shadow`}
    >
      <span className="text-2xl">{icon}</span>
      <span className={`text-sm font-black uppercase tracking-wider ${textColor}`}>{label}</span>
      <span className="ml-auto text-slate-300">→</span>
    </motion.button>
  );
}

function MinimalStep({ label, active, completed, subtext, isResolved }: { label: string, active: boolean, completed: boolean, subtext?: string, isResolved?: boolean }) {
  const colorClass = isResolved ? 'text-emerald-600' : 
                    completed ? 'text-slate-300 line-through' : 
                    active ? 'text-slate-900' : 
                    'text-slate-400';
  
  const dotClass = isResolved ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' :
                  completed ? 'bg-blue-200' : 
                  active ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 
                  'border-2 border-slate-200';

  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full transition-all duration-500 ${dotClass}`} />
      </div>
      <div>
        <p className={`text-xs font-bold uppercase tracking-tight leading-none ${colorClass}`}>
          {label}
        </p>
        {subtext && active && (
          <p className="text-[10px] text-blue-500 font-bold mt-1 uppercase tracking-wide">{subtext}</p>
        )}
      </div>
    </div>
  );
}
