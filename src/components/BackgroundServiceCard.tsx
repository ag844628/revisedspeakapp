import React from 'react';
import { 
  Radio, 
  Mic, 
  MicOff, 
  Sliders, 
  ShieldCheck, 
  Smartphone, 
  Volume2, 
  Info,
  CheckCircle2
} from 'lucide-react';

interface BackgroundServiceCardProps {
  serviceRunning: boolean;
  onToggleService: () => void;
  audioLevel: number;
  threshold: number;
  onUpdateThreshold: (val: number) => void;
  wakeWords: string[];
}

export const BackgroundServiceCard: React.FC<BackgroundServiceCardProps> = ({
  serviceRunning,
  onToggleService,
  audioLevel,
  threshold,
  onUpdateThreshold,
  wakeWords,
}) => {
  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-5 rounded-3xl shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-xs">
            <Radio className="w-6 h-6 text-emerald-200 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold">बॅकग्राउंड व्हॉईस सर्व्हिस (Hands-Free Reaction)</h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              स्क्रीन किंवा ऍप बॅकग्राऊंडमध्ये असताना आवाज दिल्यास आपोआप प्रतिसाद देण्याची प्रणाली.
            </p>
          </div>
        </div>
      </div>

      {/* Main Switch Card */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className={`p-3 rounded-2xl ${serviceRunning ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>
              {serviceRunning ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">सतत ऐकणे (Always-On Listener)</h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                {serviceRunning ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    🟢 बॅकग्राउंडमध्ये चालू आहे (Active)
                  </span>
                ) : (
                  <span className="text-slate-500">⚪ सध्या बंद आहे</span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleService}
            className={`px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer ${
              serviceRunning
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {serviceRunning ? 'सर्व्हिस थांबवा' : 'सर्व्हिस सुरू करा'}
          </button>
        </div>

        {/* Realtime Decibel / Volume Bar */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-600" />
              <span>मायक्रोफोन आवाज संवेदनशीलता (Realtime Sound Level)</span>
            </span>
            <span className="font-mono font-bold text-slate-800">{audioLevel}%</span>
          </div>

          <div className="relative w-full bg-slate-200 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                audioLevel >= threshold ? 'bg-emerald-500' : 'bg-purple-600'
              }`}
              style={{ width: `${Math.max(5, audioLevel)}%` }}
            />
            {/* Threshold marker */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-red-500 z-10"
              style={{ left: `${threshold}%` }}
              title={`मर्यादा: ${threshold}%`}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>शांत खोली (0%)</span>
            <span className="text-red-500 font-semibold">अ‍ॅक्टिव्हेशन मर्यादा: {threshold}%</span>
            <span>मोठा आवाज (100%)</span>
          </div>
        </div>

        {/* Sensitivity slider */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-purple-700" />
              <span>कमीत-कमी आवाजाची मर्यादा (Threshold Slider)</span>
            </span>
            <span className="font-mono text-purple-800">{threshold}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="70"
            value={threshold}
            onChange={(e) => onUpdateThreshold(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <p className="text-[11px] text-slate-500">
            आवाज {threshold}% पेक्षा जास्त झाल्यावर ऍप आपोआप जागे होऊन युजरचे बोलणे समजून घेईल.
          </p>
        </div>
      </section>

      {/* Wake Words / Trigger Phrases */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>🗣️</span>
          <span>समर्थित हाक / वेक वर्ड्स (Wake Words)</span>
        </h3>
        <p className="text-xs text-slate-600">
          बॅकग्राउंड सर्व्हिस चालू असताना तुम्ही खालीलपैकी कोणताही शब्द उच्चारल्यास किंवा थेट बोलल्यास असिस्टंट प्रतिक्रिया देईल:
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {wakeWords.map((word, idx) => (
            <span
              key={idx}
              className="px-3 py-1.5 bg-purple-50 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
              <span>"{word}"</span>
            </span>
          ))}
        </div>
      </section>

      {/* Mobile background guidance */}
      <section className="bg-purple-50/70 border border-purple-200 rounded-3xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-purple-950 font-bold text-xs sm:text-sm">
          <Smartphone className="w-4 h-4 text-purple-700" />
          <span>मोबाईलवर बॅकग्राउंड कसे कार्य करते?</span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          1. हे ऍप फोनच्या होम स्क्रीनवर इन्स्टॉल करून ओपन करा.<br/>
          2. मायक्रोफोन परवानगी कायमस्वरूपी "Allow" करा.<br/>
          3. 'Always-On Listener' चालू ठेवा. फोन लॉक असला तरीही Web Audio आणि Speech API बॅकग्राउंड आवाजाचा मागोवा घेतात.<br/>
          4. आवाज ऐकू येताच फोन हलका व्हायब्रेट होतो, चाइम वाजतो आणि स्क्रीनवर तुमचा कंपॅनियन उत्तर देतो!
        </p>
      </section>

    </div>
  );
};
