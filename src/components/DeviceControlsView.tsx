import React, { useState } from 'react';
import { 
  Zap, 
  ZapOff, 
  AlarmClock, 
  Timer, 
  FileText, 
  Phone, 
  MessageSquare, 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  Battery, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { AlarmItem, TimerItem, NoteItem, DeviceState } from '../types';

interface DeviceControlsViewProps {
  deviceState: DeviceState;
  onToggleFlashlight: () => void;
  onUpdateBrightness: (level: number) => void;
  onToggleDarkMode: () => void;
  onUpdateVolume: (level: number) => void;
  onToggleMute: () => void;
  alarms: AlarmItem[];
  onToggleAlarm: (id: string) => void;
  onDeleteAlarm: (id: string) => void;
  onAddAlarm: (timeString: string, label: string) => void;
  timers: TimerItem[];
  onToggleTimer: (id: string) => void;
  onResetTimer: (id: string) => void;
  onDeleteTimer: (id: string) => void;
  onAddTimer: (seconds: number, label: string) => void;
  notes: NoteItem[];
  onDeleteNote: (id: string) => void;
  onAddNote: (title: string, content: string) => void;
}

export const DeviceControlsView: React.FC<DeviceControlsViewProps> = ({
  deviceState,
  onToggleFlashlight,
  onUpdateBrightness,
  onToggleDarkMode,
  onUpdateVolume,
  onToggleMute,
  alarms,
  onToggleAlarm,
  onDeleteAlarm,
  onAddAlarm,
  timers,
  onToggleTimer,
  onResetTimer,
  onDeleteTimer,
  onAddTimer,
  notes,
  onDeleteNote,
  onAddNote,
}) => {
  // New alarm modal state
  const [showAddAlarm, setShowAddAlarm] = useState(false);
  const [alarmTime, setAlarmTime] = useState('07:00');
  const [alarmLabel, setAlarmLabel] = useState('सकाळचा अलार्म');

  // New timer modal state
  const [showAddTimer, setShowAddTimer] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState('5');
  const [timerLabel, setTimerLabel] = useState('चहाचा टायमर');

  // New note modal state
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Contact quick action
  const [contactPhone, setContactPhone] = useState('');
  const [contactName, setContactName] = useState('आई');
  const [whatsappMessage, setWhatsappMessage] = useState('नमस्कार! मी थोड्याच वेळात कॉल करतो.');

  const handleCreateAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alarmTime) return;
    onAddAlarm(alarmTime, alarmLabel || 'अलार्म');
    setShowAddAlarm(false);
    setAlarmLabel('सकाळचा अलार्म');
  };

  const handleCreateTimer = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseFloat(timerMinutes) || 1;
    onAddTimer(Math.round(mins * 60), timerLabel || 'टायमर');
    setShowAddTimer(false);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    onAddNote(noteTitle.trim() || 'नवीन नोंद', noteContent.trim());
    setShowAddNote(false);
    setNoteTitle('');
    setNoteContent('');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Header Info */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-5 rounded-3xl shadow-md">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span>📱</span>
          <span>मोबाईल डिव्हाइस कंट्रोल्स (Device Tasks)</span>
        </h2>
        <p className="text-xs text-purple-200 mt-1">
          हे सर्व टास्क तुमचा AI कंपॅनियन तुमच्या आवाजी आदेशाने (Voice Command) थेट नियंत्रित करू शकतो.
        </p>
      </div>

      {/* 1. Hardware Toggles: Flashlight, Brightness, Volume */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span>⚡</span>
          <span>जलद डिव्हाइस स्विचेस (Quick Settings)</span>
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Flashlight Card */}
          <button
            type="button"
            onClick={onToggleFlashlight}
            className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
              deviceState.flashlight
                ? 'bg-amber-500 text-white border-amber-600 shadow-lg ring-4 ring-amber-200'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            {deviceState.flashlight ? (
              <Zap className="w-7 h-7 fill-current animate-pulse text-yellow-100" />
            ) : (
              <ZapOff className="w-7 h-7 text-slate-500" />
            )}
            <div className="text-center">
              <span className="text-xs font-bold block">टॉर्च (Flashlight)</span>
              <span className="text-[10px] opacity-90">
                {deviceState.flashlight ? 'चालू आहे (ON)' : 'बंद आहे (OFF)'}
              </span>
            </div>
          </button>

          {/* Dark / Light Mode */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
              deviceState.darkMode
                ? 'bg-slate-900 text-white border-slate-800 shadow-md ring-2 ring-purple-400'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
            }`}
          >
            {deviceState.darkMode ? (
              <Moon className="w-7 h-7 text-purple-300" />
            ) : (
              <Sun className="w-7 h-7 text-amber-600" />
            )}
            <div className="text-center">
              <span className="text-xs font-bold block">स्क्रीन थीम (Theme)</span>
              <span className="text-[10px] opacity-90">
                {deviceState.darkMode ? 'डार्क मोड' : 'लाईट मोड'}
              </span>
            </div>
          </button>
        </div>

        {/* Sliders for Brightness & Volume */}
        <div className="space-y-3 pt-2">
          {/* Brightness */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-700 font-medium mb-1.5">
              <span className="flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>स्क्रीन ब्राईटनेस</span>
              </span>
              <span className="font-mono font-bold">{deviceState.screenBrightness}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={deviceState.screenBrightness}
              onChange={(e) => onUpdateBrightness(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-700"
            />
          </div>

          {/* Volume */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-700 font-medium mb-1.5">
              <span className="flex items-center gap-1.5">
                {deviceState.isMuted || deviceState.volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-indigo-600" />
                )}
                <span>आवाज व्हॉल्यूम (Volume)</span>
              </span>
              <button
                type="button"
                onClick={onToggleMute}
                className="text-[11px] text-purple-700 underline font-semibold cursor-pointer"
              >
                {deviceState.isMuted ? 'अनम्यूट करा' : 'म्यूट करा'}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={deviceState.isMuted ? 0 : deviceState.volume}
              onChange={(e) => onUpdateVolume(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-700"
            />
          </div>
        </div>
      </section>

      {/* 2. Alarms Section */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlarmClock className="w-5 h-5 text-purple-700" />
            <h3 className="text-sm font-bold text-slate-900">सक्रिय अलार्म्स (Alarms)</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowAddAlarm(true)}
            className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            अलार्म जोडा
          </button>
        </div>

        {alarms.length === 0 ? (
          <div className="p-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
            कोणताही अलार्म सेट केलेला नाही. बोला: <span className="font-semibold text-purple-700">"उद्या सकाळी 7 चा अलार्म लाव"</span>
          </div>
        ) : (
          <div className="space-y-2">
            {alarms.map((alarm) => (
              <div
                key={alarm.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  alarm.enabled
                    ? 'bg-purple-50/60 border-purple-200'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div>
                  <div className="text-lg font-bold font-mono text-purple-950">
                    {alarm.timeString}
                  </div>
                  <div className="text-xs text-slate-600">{alarm.label}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleAlarm(alarm.id)}
                    className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer ${
                      alarm.enabled ? 'bg-purple-700' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        alarm.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteAlarm(alarm.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Timers Section */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-indigo-700" />
            <h3 className="text-sm font-bold text-slate-900">काउंटडाउन टायमर्स (Timers)</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowAddTimer(true)}
            className="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            टायमर जोडा
          </button>
        </div>

        {timers.length === 0 ? (
          <div className="p-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
            कोणताही टायमर चालू नाही. बोला: <span className="font-semibold text-indigo-700">"5 मिनिटांचा टायमर लाव"</span>
          </div>
        ) : (
          <div className="space-y-2">
            {timers.map((t) => {
              const minutes = Math.floor(t.remainingSeconds / 60);
              const seconds = t.remainingSeconds % 60;
              const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
              const progress = Math.max(0, Math.min(100, 100 - (t.remainingSeconds / t.totalSeconds) * 100));

              return (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    t.completed
                      ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
                      : t.isRunning
                      ? 'bg-indigo-50/70 border-indigo-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-700">{t.label}</span>
                      <div className="text-2xl font-bold font-mono tracking-wider text-indigo-950">
                        {formattedTime}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!t.completed && (
                        <button
                          type="button"
                          onClick={() => onToggleTimer(t.id)}
                          className={`p-2 rounded-full cursor-pointer text-white shadow-xs ${
                            t.isRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                        >
                          {t.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onResetTimer(t.id)}
                        className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full cursor-pointer"
                        title="रीसेट"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTimer(t.id)}
                        className="p-2 text-slate-400 hover:text-red-500 cursor-pointer"
                        title="हटवा"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${t.completed ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Notes & Reminders Section */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-pink-700" />
            <h3 className="text-sm font-bold text-slate-900">नोंदी आणि रिमाइंडर्स (Notes & Reminders)</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowAddNote(true)}
            className="px-3 py-1 bg-pink-100 hover:bg-pink-200 text-pink-800 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            नोंद लिहा
          </button>
        </div>

        {notes.length === 0 ? (
          <div className="p-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
            कोणतीही नोंद लिहिलेली नाही. बोला: <span className="font-semibold text-pink-700">"नोट्स मध्ये लिहा की औषध घेणे आहे"</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl shadow-xs relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h4 className="font-bold text-xs text-amber-950 line-clamp-1">{note.title}</h4>
                    <button
                      type="button"
                      onClick={() => onDeleteNote(note.id)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded-md opacity-70 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap">{note.content}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-2 block font-mono">
                  {note.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Phone & WhatsApp Launcher */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>📞</span>
          <span>कॉल व मेसेजिंग (Phone & WhatsApp Action)</span>
        </h3>

        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">नाव (Contact)</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white rounded-xl border border-slate-300 focus:outline-purple-600"
                placeholder="उदा. आई, मित्र"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">मोबाईल नंबर (Phone)</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white rounded-xl border border-slate-300 focus:outline-purple-600"
                placeholder="उदा. 9876543210"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">मेसेज (Message)</label>
            <input
              type="text"
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white rounded-xl border border-slate-300 focus:outline-purple-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={contactPhone ? `tel:${contactPhone}` : '#'}
              onClick={(e) => {
                if (!contactPhone) {
                  e.preventDefault();
                  alert(`${contactName} यांना फोन लावण्यासाठी कृपया फोन नंबर टाका किंवा व्हॉईस असिस्टंटला सांगा.`);
                }
              }}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>कॉल करा (Call)</span>
            </a>

            <a
              href={`https://wa.me/${contactPhone ? contactPhone.replace(/\D/g, '') : ''}?text=${encodeURIComponent(whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp मेसेज</span>
            </a>
          </div>
        </div>
      </section>

      {/* Modal: Add Alarm */}
      {showAddAlarm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateAlarm} className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl space-y-4">
            <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <AlarmClock className="w-5 h-5 text-purple-700" />
              <span>नवीन अलार्म सेट करा</span>
            </h4>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">वेळ निवडा</label>
              <input
                type="time"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                className="w-full text-xl font-bold font-mono px-3 py-2 border rounded-xl bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">अलार्म लेबल (उद्देश)</label>
              <input
                type="text"
                value={alarmLabel}
                onChange={(e) => setAlarmLabel(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-xl bg-slate-50"
                placeholder="उदा. सकाळी फिरणे, औषध"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddAlarm(false)}
                className="flex-1 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-bold text-white bg-purple-700 rounded-xl shadow-md"
              >
                अलार्म सेव्ह करा
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Timer */}
      {showAddTimer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateTimer} className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl space-y-4">
            <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Timer className="w-5 h-5 text-indigo-700" />
              <span>नवीन टायमर लावा</span>
            </h4>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">कालावधी (मिनिटे)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(e.target.value)}
                className="w-full text-xl font-bold font-mono px-3 py-2 border rounded-xl bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">कशासाठी (Label)</label>
              <input
                type="text"
                value={timerLabel}
                onChange={(e) => setTimerLabel(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-xl bg-slate-50"
                placeholder="उदा. दूध उकळणे, व्यायाम"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddTimer(false)}
                className="flex-1 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-bold text-white bg-indigo-700 rounded-xl shadow-md"
              >
                टायमर सुरू करा
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Note */}
      {showAddNote && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateNote} className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-pink-700" />
              <span>नवीन नोंद लिहा</span>
            </h4>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">शीर्षक (Title)</label>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-xl bg-slate-50"
                placeholder="उदा. किराणा सामान, आवश्यक कामे"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">तपशील (Content)</label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={3}
                className="w-full text-xs px-3 py-2 border rounded-xl bg-slate-50"
                placeholder="येथे माहिती लिहा..."
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddNote(false)}
                className="flex-1 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-xs font-bold text-white bg-pink-700 rounded-xl shadow-md"
              >
                नोंद सेव्ह करा
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
