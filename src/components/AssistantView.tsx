import React, { useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  Sparkles, 
  Zap, 
  AlarmClock, 
  Timer, 
  FileText, 
  Phone, 
  Radio, 
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Pencil,
  ExternalLink,
  Search,
  VolumeX
} from 'lucide-react';
import { Profile, ChatMessage } from '../types';
import { GeminiVoiceOrb } from './GeminiVoiceOrb';
import { QUICK_VOICE_COMMANDS } from '../data/initialProfiles';

interface AssistantViewProps {
  activeProfile: Profile;
  messages: ChatMessage[];
  status: 'idle' | 'listening' | 'thinking' | 'speaking';
  audioLevel: number;
  heardText: string;
  isBackgroundListening: boolean;
  onToggleListening: () => void;
  onToggleBackgroundListening: () => void;
  onSendMessage: (text: string) => void;
  onReplaySpeech: (text: string) => void;
  onSwitchPersonaClick: () => void;
  onClearHistory: () => void;
  onEditProfile: (profile: Profile) => void;
  onStartPhoneCall: () => void;
  onOpenVoiceCloning: () => void;
  onOpenPermissions: () => void;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  activeProfile,
  messages,
  status,
  audioLevel,
  heardText,
  isBackgroundListening,
  onToggleListening,
  onToggleBackgroundListening,
  onSendMessage,
  onReplaySpeech,
  onSwitchPersonaClick,
  onClearHistory,
  onEditProfile,
  onStartPhoneCall,
  onOpenVoiceCloning,
  onOpenPermissions,
}) => {
  const [inputText, setInputText] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="space-y-4 pb-16 animate-in fade-in duration-200">
      
      {/* 1. Active Companion Persona Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white p-4 sm:p-5 rounded-3xl shadow-md border border-purple-500/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={activeProfile.avatarUrl}
                alt={activeProfile.name}
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover ring-2 ring-white/80 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-purple-900" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  {activeProfile.name}
                </h2>
                <span className="text-[10px] bg-white/20 text-purple-100 px-2 py-0.5 rounded-full backdrop-blur-xs font-semibold">
                  {activeProfile.relationship}
                </span>
              </div>
              <p className="text-xs text-purple-200 line-clamp-1 max-w-xs mt-0.5">
                वय: {activeProfile.age} • {activeProfile.personality}
              </p>
            </div>
          </div>

          {/* Profile Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Phone Call Button */}
            <button
              type="button"
              onClick={onStartPhoneCall}
              className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-full text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              title="या प्रोफाइलशी फोनवर बोला (Start Phone Call)"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>कॉल</span>
            </button>

            {/* Profile Edit Option */}
            <button
              type="button"
              onClick={() => onEditProfile(activeProfile)}
              className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 active:scale-95 text-white rounded-full text-xs font-semibold flex items-center gap-1 backdrop-blur-xs transition-all cursor-pointer"
              title="प्रोफाइल तपशील एडिट करा (Edit Profile)"
            >
              <Pencil className="w-3 h-3" />
              <span>एडिट</span>
            </button>

            {/* Switch Persona */}
            <button
              type="button"
              onClick={onSwitchPersonaClick}
              className="px-2.5 py-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-full text-xs font-semibold flex items-center gap-1 backdrop-blur-xs transition-all cursor-pointer"
              title="प्रोफाइल बदला"
            >
              <span>बदला</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Cloned Voice Indicator & Voice Studio Trigger */}
        <div className="pt-2 border-t border-purple-500/40 flex items-center justify-between text-xs">
          {activeProfile.clonedVoice?.isCloned ? (
            <span className="flex items-center gap-1.5 bg-pink-500/20 text-pink-200 border border-pink-400/30 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
              <Sparkles className="w-3 h-3 text-pink-300" />
              <span>🎙️ व्हॉईस क्लोन सक्रिय ({activeProfile.clonedVoice.fundamentalPitch} Hz)</span>
            </span>
          ) : (
            <span className="text-[11px] text-purple-200 flex items-center gap-1">
              <span>आवाज: {activeProfile.geminiVoice}</span>
            </span>
          )}

          <button
            type="button"
            onClick={onOpenVoiceCloning}
            className="text-[11px] text-amber-200 hover:text-white underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>नवीन आवाज क्लोन करा</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Gemini Voice Orb Section */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Background listening & Permission bar */}
        <div className="w-full flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={onToggleBackgroundListening}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isBackgroundListening
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isBackgroundListening ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
            <span>
              {isBackgroundListening ? 'बॅकग्राउंड सक्रिय' : 'बॅकग्राउंड लिसनिंग'}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPermissions}
              className="text-[11px] text-purple-700 hover:text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1 cursor-pointer font-medium"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>परवानग्या</span>
            </button>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                title="इतिहास साफ करा"
              >
                <RotateCcw className="w-3 h-3" />
                <span>साफ</span>
              </button>
            )}
          </div>
        </div>

        {/* Central Orb */}
        <GeminiVoiceOrb
          status={status}
          audioLevel={audioLevel}
          onClick={onToggleListening}
          avatarUrl={activeProfile.avatarUrl}
          personaName={activeProfile.name}
        />

        {/* Real-time heard speech feedback */}
        {heardText && (
          <div className="mt-3 w-full bg-purple-50 border border-purple-200 rounded-2xl p-2.5 text-center animate-in fade-in">
            <span className="text-[10px] text-purple-700 font-semibold block">ऐकलेले शब्द:</span>
            <p className="text-xs font-medium text-purple-950 italic">
              "{heardText}"
            </p>
          </div>
        )}

        {/* Hands-free callout tip */}
        <p className="text-[11px] text-slate-500 mt-2.5 text-center flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          <span>हाक द्या किंवा मायक्रोफोन बटण दाबून मराठीत काहीही बोला.</span>
        </p>
      </div>

      {/* 3. Quick Command Chips */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>जलद व्हॉईस आदेश (Try Asking):</span>
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {QUICK_VOICE_COMMANDS.map((cmd, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSendMessage(cmd.prompt)}
              className="px-3 py-1 bg-white hover:bg-purple-50 active:scale-95 text-slate-800 hover:text-purple-900 border border-slate-200 hover:border-purple-300 rounded-full text-xs font-medium whitespace-nowrap shadow-xs transition-all cursor-pointer shrink-0"
            >
              {cmd.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Conversation Feed & Action Badges */}
      <div className="space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-7 px-4 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-2 text-xl">
              💬
            </div>
            <h3 className="font-bold text-slate-800 text-sm">{activeProfile.name} शी बोला</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              "नमस्कार", "मोबाईलचा टॉर्च चालू कर", "सकाळी 7 चा अलार्म लाव", "वेबवर ताज्या बातम्या शोध" असे काहीही बोला.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-3xl p-3.5 sm:p-4 shadow-xs text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-purple-700 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-[10px] font-bold ${msg.sender === 'user' ? 'text-purple-200' : 'text-purple-800'}`}>
                    {msg.sender === 'user' ? 'तुम्ही (You)' : activeProfile.name}
                  </span>
                  <span className={`text-[9px] ${msg.sender === 'user' ? 'text-purple-300' : 'text-slate-400'}`}>
                    {msg.timestamp}
                  </span>
                </div>

                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* If Assistant executed device functions */}
                {msg.functionCalls && msg.functionCalls.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-purple-100 flex flex-col gap-1.5">
                    {msg.functionCalls.map((fc, i) => (
                      <div
                        key={i}
                        className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5"
                      >
                        {fc.name === 'toggleFlashlight' && <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                        {fc.name === 'setAlarm' && <AlarmClock className="w-3.5 h-3.5 text-purple-700" />}
                        {fc.name === 'setTimer' && <Timer className="w-3.5 h-3.5 text-indigo-700" />}
                        {fc.name === 'takeNote' && <FileText className="w-3.5 h-3.5 text-pink-700" />}
                        {fc.name === 'callOrMessageContact' && <Phone className="w-3.5 h-3.5 text-emerald-700" />}
                        {fc.name === 'searchWeb' && <Search className="w-3.5 h-3.5 text-blue-600" />}
                        <span>
                          {fc.name === 'toggleFlashlight' && (fc.args.enabled ? 'टॉर्च चालू केला (Flashlight ON)' : 'टॉर्च बंद केला (Flashlight OFF)')}
                          {fc.name === 'setAlarm' && `अलार्म सेट केला: ${fc.args.timeString} (${fc.args.label || ''})`}
                          {fc.name === 'setTimer' && `टायमर सुरू केला: ${Math.round(fc.args.seconds / 60)} मिनिटे`}
                          {fc.name === 'takeNote' && `नोंद केली: "${fc.args.content}"`}
                          {fc.name === 'searchWeb' && `वेब शोध घेतला: "${fc.args.query}"`}
                          {fc.name === 'controlBrightness' && `ब्राईटनेस बदलली: ${fc.args.level}%`}
                          {fc.name === 'controlVolume' && `व्हॉल्यूम सेट केला: ${fc.args.volumeLevel}%`}
                          {fc.name === 'callOrMessageContact' && `संपर्क: ${fc.args.contactName}`}
                          {fc.name === 'getDeviceInfo' && `डिव्हाइस माहिती तपासली`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Grounding web search sources */}
                {msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="mt-2 pt-1.5 border-t border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-500 block mb-1">वेब संदर्भ:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.groundingSources.map((src, i) => (
                        <a
                          key={i}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-purple-900 rounded-lg text-[10px] flex items-center gap-1 border border-slate-200"
                        >
                          <span className="line-clamp-1 max-w-[140px]">{src.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Replay audio button for assistant response */}
                {msg.sender === 'assistant' && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onReplaySpeech(msg.text)}
                      className="text-[11px] text-purple-700 hover:text-purple-900 flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>पुन्हा ऐका</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. Sticky Bottom Input Bar */}
      <div className="sticky bottom-2 z-20 bg-white/95 backdrop-blur-md p-2 rounded-3xl border border-slate-300 shadow-xl">
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          {/* Mic Button */}
          <button
            type="button"
            onClick={onToggleListening}
            className={`p-3 rounded-2xl transition-all cursor-pointer shadow-md ${
              status === 'listening'
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-purple-700 hover:bg-purple-800 text-white'
            }`}
            title={status === 'listening' ? 'मायक्रोफोन थांबवा' : 'मायक्रोफोनने बोला'}
          >
            {status === 'listening' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="येथे टाईप करा किंवा मायक्रोफोनने बोला..."
            className="flex-1 bg-slate-50 text-xs sm:text-sm px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 bg-purple-700 hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl transition-all cursor-pointer shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
