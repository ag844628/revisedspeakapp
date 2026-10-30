import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Radio,
  Check
} from 'lucide-react';
import { Profile } from '../types';
import { playPhoneRingtone } from '../utils/deviceControls';

interface PhoneCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callerProfile: Profile;
  initialMode?: 'incoming' | 'outgoing';
  onSendCallMessage: (userText: string) => Promise<string>;
  onSpeakVoice: (text: string, persona: Profile) => void;
  isCallerSpeaking: boolean;
}

export const PhoneCallModal: React.FC<PhoneCallModalProps> = ({
  isOpen,
  onClose,
  callerProfile,
  initialMode = 'incoming',
  onSendCallMessage,
  onSpeakVoice,
  isCallerSpeaking,
}) => {
  const [callState, setCallState] = useState<'incoming' | 'connected' | 'ended'>('incoming');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [callerLastWords, setCallerLastWords] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs
  const ringtoneStopFnRef = useRef<(() => void) | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      if (ringtoneStopFnRef.current) {
        ringtoneStopFnRef.current();
        ringtoneStopFnRef.current = null;
      }
      stopCallAudio();
      return;
    }

    if (initialMode === 'incoming') {
      setCallState('incoming');
      ringtoneStopFnRef.current = playPhoneRingtone();
    } else {
      handleAnswerCall();
    }

    return () => {
      if (ringtoneStopFnRef.current) {
        ringtoneStopFnRef.current();
        ringtoneStopFnRef.current = null;
      }
      stopCallAudio();
    };
  }, [isOpen, initialMode]);

  // Answer call handler
  const handleAnswerCall = async () => {
    if (ringtoneStopFnRef.current) {
      ringtoneStopFnRef.current();
      ringtoneStopFnRef.current = null;
    }
    setCallState('connected');
    setCallDuration(0);

    // Start Call Timer
    timerIntervalRef.current = window.setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);

    // Profile initial greeting on answering
    const isMom = callerProfile.relationship.includes('आई') || callerProfile.name.includes('आई');
    const isFriend = callerProfile.relationship.includes('मित्र');
    const isGrandma = callerProfile.relationship.includes('आजी');

    let initialGreeting = `हॅलो, मी ${callerProfile.name} बोलतेय. कसा आहेस तू?`;
    if (isMom) {
      initialGreeting = `हॅलो बाळा! मी आई बोलतेय, कसा आहेस तू? तुझा आवाज ऐकून बरं वाटलं, जेवलास का?`;
    } else if (isFriend) {
      initialGreeting = `हॅलो दोस्ता! अरे फोन उचललास, एकदम भारी! सांग काय चाललंय?`;
    } else if (isGrandma) {
      initialGreeting = `हॅलो बाळा! सुखी राहा. मी आजी बोलतेय, कशी आहे तुझी तब्येत?`;
    }

    setCallerLastWords(initialGreeting);
    onSpeakVoice(initialGreeting, callerProfile);

    // Start continuous mic listening for live call
    startCallMicrophone();
  };

  // Start continuous mic listening during the call
  const startCallMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkVol = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        setAudioLevel(Math.min(100, Math.round((sum / dataArray.length / 128) * 100)));
        if (micStreamRef.current && micStreamRef.current.active) {
          requestAnimationFrame(checkVol);
        }
      };
      requestAnimationFrame(checkVol);

      // Web Speech Recognition for the live phone conversation
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'mr-IN';

        recognition.onresult = async (event: any) => {
          if (isMuted) return;
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setLiveTranscript(text);

          if (event.results[current].isFinal && text.trim().length > 1) {
            // Process user words and speak back in caller's voice
            const reply = await onSendCallMessage(text);
            if (reply) {
              setCallerLastWords(reply);
            }
            setLiveTranscript('');
          }
        };

        recognition.onend = () => {
          if (callState === 'connected') {
            try { recognition.start(); } catch {}
          }
        };

        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch {}
      }
    } catch (e) {
      console.warn('Call mic error:', e);
    }
  };

  const stopCallAudio = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  };

  const handleEndCall = () => {
    if (ringtoneStopFnRef.current) {
      ringtoneStopFnRef.current();
      ringtoneStopFnRef.current = null;
    }
    stopCallAudio();
    setCallState('ended');
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-3 animate-in fade-in select-none">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900 to-black rounded-3xl p-6 text-white flex flex-col items-center justify-between min-h-[580px] shadow-2xl border border-slate-800 relative overflow-hidden">
        
        {/* Animated Glow Halo */}
        <div className={`absolute top-20 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
          isCallerSpeaking
            ? 'bg-purple-600/40 animate-pulse'
            : callState === 'incoming'
            ? 'bg-emerald-500/30 animate-ping'
            : 'bg-indigo-600/20'
        }`} />

        {/* Top Caller Info */}
        <div className="flex flex-col items-center text-center mt-4 space-y-2 z-10">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>{callState === 'incoming' ? 'इनकमिंग कॉल...' : 'कॉल चालू आहे'}</span>
          </span>

          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>{callerProfile.name}</span>
          </h2>
          <span className="text-xs text-purple-300 font-semibold px-3 py-0.5 rounded-full bg-purple-900/60 border border-purple-700/60">
            {callerProfile.relationship}
          </span>

          {callState === 'connected' && (
            <span className="text-sm font-mono text-emerald-400 font-bold block pt-1">
              {formatTimer(callDuration)}
            </span>
          )}
        </div>

        {/* Center: Large Avatar with Voice Waves */}
        <div className="relative my-6 flex flex-col items-center justify-center z-10">
          {/* Concentric Audio Rings */}
          {(isCallerSpeaking || callState === 'incoming') && (
            <>
              <div className="absolute w-44 h-44 rounded-full border border-purple-400/40 animate-ping pointer-events-none" style={{ animationDuration: '2.5s' }} />
              <div className="absolute w-52 h-52 rounded-full border border-pink-400/20 animate-pulse pointer-events-none" />
            </>
          )}

          <div className="relative w-32 h-32 rounded-full p-1.5 bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-2xl ring-4 ring-purple-500/30">
            <img
              src={callerProfile.avatarUrl}
              alt={callerProfile.name}
              className="w-full h-full rounded-full object-cover"
            />
            {callerProfile.clonedVoice?.isCloned && (
              <span className="absolute -bottom-1 -right-1 bg-pink-600 text-white p-1.5 rounded-full shadow-md text-xs" title="क्लोन केलेला आवाज">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          {/* Caller voice state indicator */}
          <div className="mt-4 text-center">
            {isCallerSpeaking ? (
              <div className="flex items-center gap-1.5 bg-purple-900/60 border border-purple-600/50 px-3 py-1 rounded-full text-xs text-purple-200 animate-pulse">
                <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                <span>{callerProfile.name} बोलत आहेत...</span>
              </div>
            ) : callState === 'connected' ? (
              <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-full text-xs text-slate-300">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>तुम्ही बोला, ऐकत आहेत...</span>
              </div>
            ) : null}
          </div>

          {/* Spoken words caption box */}
          {callState === 'connected' && (callerLastWords || liveTranscript) && (
            <div className="mt-4 max-w-xs bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3 text-center shadow-lg backdrop-blur-xs">
              {callerLastWords && (
                <p className="text-xs text-purple-200 leading-relaxed italic">
                  "{callerLastWords}"
                </p>
              )}
              {liveTranscript && (
                <p className="text-[11px] text-emerald-300 mt-1.5 font-medium border-t border-slate-700 pt-1">
                  तुम्ही: "{liveTranscript}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="w-full z-10 pb-4">
          {callState === 'incoming' ? (
            <div className="flex items-center justify-around w-full px-4">
              {/* Decline Button */}
              <button
                type="button"
                onClick={handleEndCall}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl active:scale-95 transition-transform">
                  <PhoneOff className="w-7 h-7" />
                </div>
                <span className="text-xs font-semibold text-slate-300">कट करा</span>
              </button>

              {/* Answer Button */}
              <button
                type="button"
                onClick={handleAnswerCall}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xl active:scale-95 transition-transform animate-bounce">
                  <Phone className="w-7 h-7" />
                </div>
                <span className="text-xs font-semibold text-emerald-300">कॉल उचला</span>
              </button>
            </div>
          ) : callState === 'connected' ? (
            <div className="space-y-4">
              {/* Mid controls: Mute, Speaker */}
              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={() => setIsMuted(v => !v)}
                  className={`p-3.5 rounded-full border transition-all cursor-pointer ${
                    isMuted
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title={isMuted ? 'अनम्यूट करा' : 'म्यूट करा'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsSpeakerOn(v => !v)}
                  className={`p-3.5 rounded-full border transition-all cursor-pointer ${
                    isSpeakerOn
                      ? 'bg-purple-700 text-white border-purple-600'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title={isSpeakerOn ? 'स्पीकर चालू' : 'स्पीकर बंद'}
                >
                  {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
              </div>

              {/* End Call Button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center shadow-2xl transition-transform cursor-pointer"
                  title="कॉल बंद करा"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <span className="text-sm font-semibold text-slate-400">कॉल समाप्त झाला.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
