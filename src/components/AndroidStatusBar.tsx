import React, { useState, useEffect } from 'react';
import { Wifi, Battery, BatteryCharging, Zap, Mic } from 'lucide-react';

interface AndroidStatusBarProps {
  serviceRunning: boolean;
  isListening: boolean;
  flashlightOn: boolean;
  batteryLevel: number;
  isCharging: boolean;
  activePersonaName: string;
}

export const AndroidStatusBar: React.FC<AndroidStatusBarProps> = ({
  serviceRunning,
  isListening,
  flashlightOn,
  batteryLevel,
  isCharging,
  activePersonaName,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-slate-900 text-slate-100 px-4 py-2 flex items-center justify-between text-xs select-none border-b border-slate-800 tracking-tight z-30">
      {/* Left: Time and active companion indicator */}
      <div className="flex items-center space-x-2">
        <span className="font-semibold text-slate-200">{currentTime || '10:30 AM'}</span>
        {serviceRunning && (
          <span className="flex items-center gap-1 bg-purple-900/60 text-purple-200 border border-purple-700/50 px-2 py-0.5 rounded-full text-[10px] animate-pulse">
            <Mic className="w-2.5 h-2.5 text-purple-300" />
            <span>बॅकग्राउंड सक्रिय</span>
          </span>
        )}
      </div>

      {/* Center: Flashlight badge if active */}
      {flashlightOn && (
        <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full text-[10px] font-medium">
          <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
          <span>टॉर्च चालू</span>
        </div>
      )}

      {/* Right: Phone network and battery status */}
      <div className="flex items-center space-x-2 text-slate-300">
        <span className="text-[10px] font-bold text-slate-400">5G</span>
        <Wifi className="w-3.5 h-3.5" />
        <div className="flex items-center space-x-1">
          <span className="text-[11px] font-medium">{batteryLevel}%</span>
          {isCharging ? (
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Battery className="w-3.5 h-3.5 text-slate-300" />
          )}
        </div>
      </div>
    </div>
  );
};
