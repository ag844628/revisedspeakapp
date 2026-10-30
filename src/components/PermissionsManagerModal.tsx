import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mic, 
  Zap, 
  Bell, 
  MapPin, 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { AppPermissionsState } from '../types';

interface PermissionsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissions: AppPermissionsState;
  onUpdatePermissions: (newPerms: AppPermissionsState) => void;
}

export const PermissionsManagerModal: React.FC<PermissionsManagerModalProps> = ({
  isOpen,
  onClose,
  permissions,
  onUpdatePermissions,
}) => {
  const [isRequestingAll, setIsRequestingAll] = useState(false);

  if (!isOpen) return null;

  // Request all permissions sequentially
  const handleRequestAllPermissions = async () => {
    setIsRequestingAll(true);
    const updated: AppPermissionsState = { ...permissions };

    // 1. Microphone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      updated.microphone = 'granted';
      stream.getTracks().forEach(t => t.stop());
    } catch {
      updated.microphone = 'denied';
    }

    // 2. Camera / Torch
    try {
      const vStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      updated.camera = 'granted';
      vStream.getTracks().forEach(t => t.stop());
    } catch {
      updated.camera = 'denied';
    }

    // 3. Notifications
    try {
      if ('Notification' in window) {
        const notifStatus = await Notification.requestPermission();
        updated.notifications = notifStatus === 'granted' ? 'granted' : 'denied';
      }
    } catch {}

    // 4. Geolocation / Location
    try {
      await new Promise<void>((resolve) => {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            () => {
              updated.location = 'granted';
              resolve();
            },
            () => {
              updated.location = 'denied';
              resolve();
            },
            { timeout: 5000 }
          );
        } else {
          resolve();
        }
      });
    } catch {}

    // 5. Audio Context
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === 'suspended') await ctx.resume();
      updated.audio = 'granted';
    } catch {
      updated.audio = 'granted';
    }

    onUpdatePermissions(updated);
    setIsRequestingAll(false);
  };

  const permItems = [
    {
      id: 'mic',
      name: 'मायक्रोफोन (Microphone)',
      desc: 'तुमचा आवाज, संवाद आणि वेक-वर्ड ऐकण्यासाठी',
      icon: <Mic className="w-5 h-5 text-purple-600" />,
      status: permissions.microphone,
    },
    {
      id: 'cam',
      name: 'कॅमेरा व टॉर्च (Camera / Torch)',
      desc: 'मोबाईलचा टॉर्च फ्लॅश चालू/बंद करण्यासाठी',
      icon: <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />,
      status: permissions.camera,
    },
    {
      id: 'notif',
      name: 'नोटिफिकेशन्स व अलार्म (Notifications)',
      desc: 'अलार्म, टायमर आणि रिमाइंडर्सचा गजर वाजवण्यासाठी',
      icon: <Bell className="w-5 h-5 text-indigo-600" />,
      status: permissions.notifications,
    },
    {
      id: 'loc',
      name: 'स्थान व हवामान (Location)',
      desc: 'परिसरातील अचूक हवामान व स्थानिक वेब सर्च माहितीसाठी',
      icon: <MapPin className="w-5 h-5 text-emerald-600" />,
      status: permissions.location,
    },
    {
      id: 'audio',
      name: 'ऑडिओ व स्पीकर (Audio Playback)',
      desc: 'मराठी आवाज व संभाषण स्पष्टपणे ऐकण्यासाठी',
      icon: <Volume2 className="w-5 h-5 text-pink-600" />,
      status: permissions.audio,
    },
  ];

  const allGranted = permItems.every(p => p.status === 'granted');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-in fade-in">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 rounded-xl text-purple-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">सर्व परवानग्या केंद्र (All-in-One Settings)</h3>
              <p className="text-[11px] text-slate-500">Android मोबाईलचे सर्व फिचर्स सुरळीत चालण्यासाठी</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
          >
            ✕
          </button>
        </div>

        {/* Master One-Click Button */}
        <button
          type="button"
          onClick={handleRequestAllPermissions}
          disabled={isRequestingAll}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 active:scale-[0.99] text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>
            {isRequestingAll ? 'परवानग्या चालू केल्या जात आहेत...' : 'एकदाच सर्व परवानग्या द्या (Grant All in 1-Click)'}
          </span>
        </button>

        {/* Permission List */}
        <div className="space-y-2 pt-1">
          {permItems.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                item.status === 'granted'
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-100">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                  <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
                </div>
              </div>

              <div>
                {item.status === 'granted' ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-200 shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>मंजूर</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                    <XCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>प्रलंबित</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Notice */}
        <div className="bg-purple-50 p-3 rounded-2xl text-[11px] text-purple-900 border border-purple-100 leading-relaxed">
          💡 <strong>सुरक्षा हमी:</strong> तुमच्या आवाजाचा डेटा किंवा कॅमेरा फक्त तुम्ही आदेश दिल्यावरच डिव्हाइस टास्क करण्यासाठी वापरला जातो. कोणतीही माहिती थर्ड-पार्टीला विकली जात नाही.
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
        >
          झाले (Done)
        </button>

      </div>
    </div>
  );
};
