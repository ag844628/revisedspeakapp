import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  Users, 
  Smartphone, 
  Radio, 
  Download, 
  Volume2, 
  Bell, 
  Sparkles, 
  Zap, 
  Info, 
  Globe, 
  ShieldCheck, 
  LogOut,
  ExternalLink,
  Phone
} from 'lucide-react';
import { 
  Profile, 
  ChatMessage, 
  AlarmItem, 
  TimerItem, 
  NoteItem, 
  DeviceState, 
  AppPermissionsState,
  ClonedVoiceData
} from './types';
import { INITIAL_PROFILES } from './data/initialProfiles';
import { AndroidStatusBar } from './components/AndroidStatusBar';
import { AssistantView } from './components/AssistantView';
import { ProfilesManager } from './components/ProfilesManager';
import { DeviceControlsView } from './components/DeviceControlsView';
import { BackgroundServiceCard } from './components/BackgroundServiceCard';
import { PermissionsManagerModal } from './components/PermissionsManagerModal';
import { VoiceCloningStudioModal } from './components/VoiceCloningStudioModal';
import { WebSearchReaderView } from './components/WebSearchReaderView';
import { PrivacyAndAboutView } from './components/PrivacyAndAboutView';
import { PhoneCallModal } from './components/PhoneCallModal';
import { 
  setHardwareFlashlight, 
  playWakeChime, 
  playSuccessChime, 
  playAlarmBuzzer, 
  fetchBatteryInfo 
} from './utils/deviceControls';

const GUEST_PROFILE: Profile = {
  id: 'guest',
  name: 'कंपॅनियन (General)',
  relationship: 'वैयक्तिक असिस्टंट',
  age: '24',
  gender: 'Female',
  personality: 'हुशार, विनम्र, मदतीस तत्पर आणि सर्व डिव्हाइस टास्क त्वरित पूर्ण करणारा AI साथीदार.',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  voicePitch: 1.1,
  voiceRate: 1.0,
  geminiVoice: 'Kore',
};

export default function App() {
  // Navigation Tabs: assistant, profiles, controls, websearch, privacy, background
  const [activeTab, setActiveTab] = useState<'assistant' | 'profiles' | 'controls' | 'websearch' | 'privacy' | 'background'>('assistant');

  // Modals state
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showVoiceCloningModal, setShowVoiceCloningModal] = useState(false);
  const [voiceCloningTargetProfileId, setVoiceCloningTargetProfileId] = useState<string>('profile-1');
  const [isPhoneCallOpen, setIsPhoneCallOpen] = useState(false);
  const [phoneCallMode, setPhoneCallMode] = useState<'incoming' | 'outgoing'>('incoming');
  const [editingProfileTarget, setEditingProfileTarget] = useState<Profile | null>(null);

  // Permissions State
  const [permissions, setPermissions] = useState<AppPermissionsState>(() => {
    const saved = localStorage.getItem('newspeak_v2_perms');
    return saved ? JSON.parse(saved) : {
      microphone: 'prompt',
      camera: 'prompt',
      notifications: 'prompt',
      location: 'prompt',
      audio: 'granted',
    };
  });

  // Profiles State
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('newspeak_v2_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_PROFILES;
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    const savedId = localStorage.getItem('newspeak_v2_active_profile_id');
    if (savedId === 'guest') return 'guest';
    if (savedId && profiles.some(p => p.id === savedId)) return savedId;
    return profiles[0]?.id || 'profile-1';
  });

  const activeProfile = activeProfileId === 'guest'
    ? GUEST_PROFILE
    : profiles.find(p => p.id === activeProfileId) || profiles[0] || GUEST_PROFILE;

  // Conversation Messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('newspeak_v2_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Assistant status: idle, listening, thinking, speaking
  const [assistantStatus, setAssistantStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [heardText, setHeardText] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [speakingProfileId, setSpeakingProfileId] = useState<string | null>(null);
  const [isReadingWebArticle, setIsReadingWebArticle] = useState(false);

  // Background listening service
  const [isBackgroundListening, setIsBackgroundListening] = useState<boolean>(() => {
    return localStorage.getItem('newspeak_v2_bg_listening') === 'true';
  });
  const [sensitivityThreshold, setSensitivityThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('newspeak_v2_sensitivity');
    return saved ? parseInt(saved, 10) : 28;
  });

  // Device State
  const [deviceState, setDeviceState] = useState<DeviceState>({
    flashlight: false,
    screenBrightness: 95,
    darkMode: false,
    volume: 85,
    isMuted: false,
    batteryLevel: 92,
    isCharging: false,
  });

  // Alarms, Timers, Notes
  const [alarms, setAlarms] = useState<AlarmItem[]>(() => {
    const saved = localStorage.getItem('newspeak_v2_alarms');
    return saved ? JSON.parse(saved) : [
      { id: 'alarm-1', timeString: '06:30 AM', label: 'सकाळचा व्यायाम', enabled: true, createdAt: Date.now() },
    ];
  });

  const [timers, setTimers] = useState<TimerItem[]>(() => {
    const saved = localStorage.getItem('newspeak_v2_timers');
    return saved ? JSON.parse(saved) : [];
  });

  const [notes, setNotes] = useState<NoteItem[]>(() => {
    const saved = localStorage.getItem('newspeak_v2_notes');
    return saved ? JSON.parse(saved) : [
      { id: 'note-1', title: 'किराणा यादी', content: 'दूध, तांदूळ, आणि गूळ आणणे.', timestamp: 'आज' },
    ];
  });

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [ringingAlert, setRingingAlert] = useState<{ title: string; message: string } | null>(null);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const currentAudioElemRef = useRef<HTMLAudioElement | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const alarmStopFnRef = useRef<(() => void) | null>(null);
  const wakeWordCooldownRef = useRef<number>(0);

  // Supported wake words in Marathi and English
  const wakeWords = ['कंपॅनियन', 'ऐक', 'हॅलो', 'असिस्टंट', 'आई', 'राहुल', 'मित्रा', 'companion', 'hey'];

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('newspeak_v2_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('newspeak_v2_active_profile_id', activeProfileId);
  }, [activeProfileId]);

  useEffect(() => {
    localStorage.setItem('newspeak_v2_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('newspeak_v2_alarms', JSON.stringify(alarms));
  }, [alarms]);

  useEffect(() => {
    localStorage.setItem('newspeak_v2_timers', JSON.stringify(timers));
  }, [timers]);

  useEffect(() => {
    localStorage.setItem('newspeak_v2_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('newspeak_v2_bg_listening', isBackgroundListening.toString());
  }, [isBackgroundListening]);

  useEffect(() => {
    localStorage.setItem('newspeak_v2_sensitivity', sensitivityThreshold.toString());
  }, [sensitivityThreshold]);

  useEffect(() => {
    localStorage.setItem('newspeak_v2_perms', JSON.stringify(permissions));
  }, [permissions]);

  // Show Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  // Battery status fetcher
  useEffect(() => {
    fetchBatteryInfo().then(info => {
      if (info) {
        setDeviceState(prev => ({
          ...prev,
          batteryLevel: info.level,
          isCharging: info.charging,
        }));
      }
    });
  }, []);

  // Pre-load voices for SpeechSynthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Timers countdown ticker
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimers(prevTimers => {
        let changed = false;
        const updated = prevTimers.map(t => {
          if (t.isRunning && t.remainingSeconds > 0) {
            changed = true;
            const nextSec = t.remainingSeconds - 1;
            if (nextSec === 0) {
              if (!alarmStopFnRef.current) {
                alarmStopFnRef.current = playAlarmBuzzer();
              }
              setRingingAlert({
                title: '⏰ टायमर पूर्ण झाला!',
                message: `तुमचा "${t.label}" टायमर पूर्ण झाला आहे.`,
              });
              return { ...t, remainingSeconds: 0, isRunning: false, completed: true };
            }
            return { ...t, remainingSeconds: nextSec };
          }
          return t;
        });
        return changed ? updated : prevTimers;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  // Stop ringing buzzer
  const stopRingingAlert = () => {
    if (alarmStopFnRef.current) {
      alarmStopFnRef.current();
      alarmStopFnRef.current = null;
    }
    setRingingAlert(null);
  };

  // Hardware flashlight toggle
  const handleToggleFlashlight = async () => {
    const nextState = !deviceState.flashlight;
    await setHardwareFlashlight(nextState);
    setDeviceState(prev => ({ ...prev, flashlight: nextState }));
    showToast(nextState ? '🔦 टॉर्च चालू केला!' : '🔦 टॉर्च बंद केला.');
  };

  // Speech output synthesizer
  const speakTextAsPersona = useCallback(async (text: string, persona: Profile) => {
    if (currentAudioElemRef.current) {
      currentAudioElemRef.current.pause();
      currentAudioElemRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setAssistantStatus('speaking');
    setSpeakingProfileId(persona.id);

    // If persona has a custom audio sample uploaded/recorded and text is greeting
    if (persona.audioUri && text.includes('नमस्कार, मी')) {
      try {
        const audio = new Audio(persona.audioUri);
        currentAudioElemRef.current = audio;
        audio.onended = () => {
          setAssistantStatus('idle');
          setSpeakingProfileId(null);
        };
        audio.onerror = () => {
          fallbackSpeechSynthesis(text, persona);
        };
        await audio.play();
        return;
      } catch {
        fallbackSpeechSynthesis(text, persona);
        return;
      }
    }

    // Attempt Gemini Flash Lite TTS via backend endpoint
    try {
      const res = await fetch('/api/assistant/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          gender: persona.gender,
          personaTone: persona.personality,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioData) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioData}`);
          currentAudioElemRef.current = audio;
          audio.onended = () => {
            setAssistantStatus('idle');
            setSpeakingProfileId(null);
          };
          audio.onerror = () => {
            fallbackSpeechSynthesis(text, persona);
          };
          await audio.play();
          return;
        }
      }
    } catch {
      // Fallback to client browser SpeechSynthesis
    }

    fallbackSpeechSynthesis(text, persona);
  }, []);

  // Fallback client-side speech synthesis with cloned pitch and rate
  const fallbackSpeechSynthesis = (text: string, persona: Profile) => {
    if (!('speechSynthesis' in window)) {
      setAssistantStatus('idle');
      setSpeakingProfileId(null);
      return;
    }

    const cleanText = text.replace(/[*_#`]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();

    const marathiVoice = voices.find(v => v.lang.startsWith('mr') || v.lang === 'mr-IN');
    const hindiVoice = voices.find(v => v.lang.startsWith('hi') || v.lang === 'hi-IN');
    const indianVoice = voices.find(v => v.lang.includes('IN'));

    if (marathiVoice) {
      utterance.voice = marathiVoice;
      utterance.lang = 'mr-IN';
    } else if (hindiVoice) {
      utterance.voice = hindiVoice;
      utterance.lang = 'hi-IN';
    } else if (indianVoice) {
      utterance.voice = indianVoice;
    }

    // Apply cloned voice pitch if available, else persona pitch
    const pitch = persona.clonedVoice?.isCloned
      ? persona.clonedVoice.formantRatio
      : persona.voicePitch || (persona.gender === 'Female' ? 1.25 : 0.85);

    utterance.pitch = Math.min(1.5, Math.max(0.6, pitch));
    utterance.rate = persona.voiceRate || 1.0;

    activeUtteranceRef.current = utterance;
    utterance.onend = () => {
      activeUtteranceRef.current = null;
      setAssistantStatus('idle');
      setSpeakingProfileId(null);
    };
    utterance.onerror = () => {
      activeUtteranceRef.current = null;
      setAssistantStatus('idle');
      setSpeakingProfileId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Web Read Aloud implementation
  const handleReadAloud = (text: string, rate: number = 1.0) => {
    if (!('speechSynthesis' in window)) {
      showToast('Text-to-Speech सपोर्ट उपलब्ध नाही.');
      return;
    }
    window.speechSynthesis.cancel();

    const clean = text.replace(/[*_#`]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    const voices = window.speechSynthesis.getVoices();
    const marathiVoice = voices.find(v => v.lang.startsWith('mr') || v.lang === 'mr-IN');
    const hindiVoice = voices.find(v => v.lang.startsWith('hi') || v.lang === 'hi-IN');
    if (marathiVoice) utterance.voice = marathiVoice;
    else if (hindiVoice) utterance.voice = hindiVoice;

    utterance.pitch = activeProfile.voicePitch || 1.0;
    utterance.rate = rate;

    activeUtteranceRef.current = utterance;
    setIsReadingWebArticle(true);

    utterance.onend = () => {
      setIsReadingWebArticle(false);
      activeUtteranceRef.current = null;
    };
    utterance.onerror = () => {
      setIsReadingWebArticle(false);
      activeUtteranceRef.current = null;
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopReading = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsReadingWebArticle(false);
  };

  // Apply Cloned Voice
  const handleApplyClonedVoice = (profileId: string, clonedData: ClonedVoiceData) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === profileId) {
        return {
          ...p,
          clonedVoice: clonedData,
          voicePitch: clonedData.formantRatio,
          voiceRate: clonedData.speechRate,
          gender: clonedData.detectedGender,
        };
      }
      return p;
    }));
    showToast(`🎙️ ${clonedData.sampleName} चा आवाज क्लोन करून प्रोफाइलला जोडला!`);
  };

  // Execute function calls returned by Gemini
  const executeDeviceToolCalls = async (functionCalls: Array<{ name: string; args: any }>) => {
    let triggeredAny = false;

    for (const fc of functionCalls) {
      triggeredAny = true;
      if (fc.name === 'toggleFlashlight') {
        const turnOn = Boolean(fc.args?.enabled);
        await setHardwareFlashlight(turnOn);
        setDeviceState(prev => ({ ...prev, flashlight: turnOn }));
        showToast(turnOn ? '🔦 टॉर्च चालू केला!' : '🔦 टॉर्च बंद केला.');
      } else if (fc.name === 'setAlarm') {
        const timeStr = fc.args?.timeString || '07:00 AM';
        const label = fc.args?.label || 'अलार्म';
        setAlarms(prev => [
          ...prev,
          { id: `alarm-${Date.now()}`, timeString: timeStr, label, enabled: true, createdAt: Date.now() },
        ]);
        showToast(`⏰ अलार्म सेट केला: ${timeStr}`);
      } else if (fc.name === 'setTimer') {
        const secs = parseInt(fc.args?.seconds, 10) || 300;
        const label = fc.args?.label || 'टायमर';
        setTimers(prev => [
          ...prev,
          { id: `timer-${Date.now()}`, label, totalSeconds: secs, remainingSeconds: secs, isRunning: true, completed: false },
        ]);
        showToast(`⏱️ टायमर सुरू केला: ${Math.round(secs / 60)} मिनिटे`);
      } else if (fc.name === 'takeNote') {
        const title = fc.args?.title || 'व्हॉईस नोंद';
        const content = fc.args?.content || '';
        setNotes(prev => [
          { id: `note-${Date.now()}`, title, content, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          ...prev,
        ]);
        showToast(`📝 नोंद सेव्ह केली!`);
      } else if (fc.name === 'searchWeb') {
        showToast(`🌐 वेब शोध: "${fc.args?.query}"`);
      } else if (fc.name === 'controlBrightness') {
        const level = parseInt(fc.args?.level, 10) || 80;
        setDeviceState(prev => ({ ...prev, screenBrightness: Math.max(10, Math.min(100, level)) }));
        showToast(`🔆 ब्राईटनेस ${level}% केली.`);
      } else if (fc.name === 'controlVolume') {
        const level = parseInt(fc.args?.volumeLevel, 10) || 75;
        const mute = Boolean(fc.args?.mute);
        setDeviceState(prev => ({ ...prev, volume: level, isMuted: mute }));
        showToast(mute ? '🔇 आवाज म्यूट केला.' : `🔊 व्हॉल्यूम ${level}% केला.`);
      } else if (fc.name === 'callOrMessageContact') {
        const { contactName, actionType } = fc.args || {};
        if (actionType === 'whatsapp') {
          showToast(`💬 ${contactName} यांना WhatsApp मेसेज तयार केला.`);
        } else {
          showToast(`📞 ${contactName || activeProfile.name} यांना फोन लावला जात आहे...`);
          setPhoneCallMode('outgoing');
          setIsPhoneCallOpen(true);
        }
      }
    }

    if (triggeredAny) {
      playSuccessChime();
    }
  };

  // Send message to Gemini assistant
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const lower = text.trim().toLowerCase();
    // Direct voice triggers for incoming/outgoing phone call
    if (lower.includes('मला कॉल कर') || lower.includes('इनकमिंग कॉल') || lower.includes('कॉल पाठव') || lower.includes('कॉल answer') || lower.includes('test call')) {
      showToast(`📞 ${activeProfile.name} कडून इनकमिंग कॉल येत आहे...`);
      setPhoneCallMode('incoming');
      setIsPhoneCallOpen(true);
      return;
    }
    if (lower === 'कॉल कर' || lower.startsWith('कॉल कर ') || lower.includes('फोन कर') || lower.includes('कॉल लाव') || lower.includes('फोन लाव') || lower.includes('कॉल जोड')) {
      showToast(`📞 ${activeProfile.name} यांना कॉल जोडला जात आहे...`);
      setPhoneCallMode('outgoing');
      setIsPhoneCallOpen(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setHeardText('');
    setAssistantStatus('thinking');

    try {
      const response = await fetch('/api/assistant/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text.trim(),
          profile: activeProfile,
          history: messages.slice(-6),
        }),
      });

      const data = await response.json();
      const replyText = data.text || 'होय, मी ऐकले आहे!';
      const functionCalls = data.functionCalls || [];
      const groundingSources = data.groundingSources || [];

      if (functionCalls.length > 0) {
        await executeDeviceToolCalls(functionCalls);
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        profileId: activeProfile.id,
        functionCalls,
        groundingSources,
      };

      setMessages(prev => [...prev, assistantMsg]);
      await speakTextAsPersona(replyText, activeProfile);
    } catch (err: any) {
      console.error('Assistant error:', err);
      const fallbackReply = 'माफ करा, संपर्क साधण्यात थोडी अडचण आली. मी तुमच्या सेवेत तयार आहे!';
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        profileId: activeProfile.id,
      };
      setMessages(prev => [...prev, assistantMsg]);
      speakTextAsPersona(fallbackReply, activeProfile);
    }
  };

  // Toggle Push-To-Talk Listening
  const handleToggleListening = () => {
    if (assistantStatus === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = async () => {
    try {
      playWakeChime();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setAssistantStatus('listening');

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        if (micStreamRef.current && micStreamRef.current.active) {
          requestAnimationFrame(checkVolume);
        }
      };
      requestAnimationFrame(checkVolume);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'mr-IN';

        recognition.onresult = (e: any) => {
          const current = e.resultIndex;
          const transcript = e.results[current][0].transcript;
          setHeardText(transcript);
          if (e.results[current].isFinal) {
            stopListening();
            handleSendMessage(transcript);
          }
        };

        recognition.onerror = () => stopListening();
        recognition.onend = () => {
          if (assistantStatus === 'listening') stopListening();
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch {
      showToast('मायक्रोफोन परवानगी नाकारली गेली किंवा उपलब्ध नाही.');
      stopListening();
    }
  };

  const stopListening = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setAssistantStatus('idle');
    setAudioLevel(0);
  };

  // Background Always-On Listening Listener
  useEffect(() => {
    let bgStream: MediaStream | null = null;
    let bgAudioCtx: AudioContext | null = null;
    let bgAnalyser: AnalyserNode | null = null;
    let bgRecognition: any = null;
    let animFrame: number;

    const startBackgroundService = async () => {
      try {
        bgStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        bgAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = bgAudioCtx.createMediaStreamSource(bgStream);
        bgAnalyser = bgAudioCtx.createAnalyser();
        bgAnalyser.fftSize = 64;
        source.connect(bgAnalyser);

        const dataArray = new Uint8Array(bgAnalyser.frequencyBinCount);
        const loop = () => {
          if (!bgAnalyser) return;
          bgAnalyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const level = Math.min(100, Math.round((sum / dataArray.length / 128) * 100));
          setAudioLevel(level);

          if (level >= sensitivityThreshold && assistantStatus === 'idle') {
            const now = Date.now();
            if (now - wakeWordCooldownRef.current > 4000) {
              wakeWordCooldownRef.current = now;
              playWakeChime();
              showToast('🎙️ आवाजाची जाणीव झाली! ऐकत आहे...');
            }
          }

          animFrame = requestAnimationFrame(loop);
        };
        loop();

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          bgRecognition = new SpeechRecognition();
          bgRecognition.continuous = true;
          bgRecognition.interimResults = true;
          bgRecognition.lang = 'mr-IN';

          bgRecognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript.toLowerCase();
            setHeardText(transcript);

            const matchedWake = wakeWords.some(w => transcript.includes(w.toLowerCase()));
            if (matchedWake || event.results[current].isFinal) {
              const now = Date.now();
              if (now - wakeWordCooldownRef.current > 3500) {
                wakeWordCooldownRef.current = now;
                playWakeChime();
                handleSendMessage(event.results[current][0].transcript);
              }
            }
          };

          bgRecognition.onend = () => {
            if (isBackgroundListening) {
              try { bgRecognition.start(); } catch {}
            }
          };

          try { bgRecognition.start(); } catch {}
        }
      } catch (err) {
        console.warn('Background service microphone access error:', err);
      }
    };

    if (isBackgroundListening) {
      startBackgroundService();
    } else {
      setAudioLevel(0);
    }

    return () => {
      cancelAnimationFrame(animFrame);
      if (bgStream) bgStream.getTracks().forEach(t => t.stop());
      if (bgAudioCtx && bgAudioCtx.state !== 'closed') bgAudioCtx.close().catch(() => {});
      if (bgRecognition) {
        try { bgRecognition.stop(); } catch {}
      }
    };
  }, [isBackgroundListening, sensitivityThreshold, assistantStatus]);

  // Export Data JSON
  const handleExportData = () => {
    const data = {
      profiles,
      notes,
      alarms,
      timers,
      messages,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `companion_data_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('डेटा यशस्वीरीत्या एक्सपोर्ट झाला!');
  };

  // Clear All Data
  const handleClearAllData = () => {
    localStorage.removeItem('newspeak_v2_profiles');
    localStorage.removeItem('newspeak_v2_active_profile_id');
    localStorage.removeItem('newspeak_v2_messages');
    localStorage.removeItem('newspeak_v2_alarms');
    localStorage.removeItem('newspeak_v2_timers');
    localStorage.removeItem('newspeak_v2_notes');
    setProfiles(INITIAL_PROFILES);
    setActiveProfileId(INITIAL_PROFILES[0].id);
    setMessages([]);
    setNotes([]);
    setAlarms([]);
    setTimers([]);
    showToast('सर्व डेटा पुसून टाकला गेला आहे.');
  };

  return (
    <div 
      className={`min-h-screen flex flex-col items-center transition-colors duration-300 font-sans ${
        deviceState.darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#FDF7FF] text-[#1D1B20]'
      }`}
      style={{
        filter: `brightness(${deviceState.screenBrightness}%)`,
      }}
    >
      {/* High Visibility Virtual Torch Beam when Flashlight is ON */}
      {deviceState.flashlight && (
        <div className="fixed inset-x-0 top-0 h-40 bg-gradient-to-b from-amber-300/40 via-yellow-200/20 to-transparent pointer-events-none z-40 animate-pulse" />
      )}

      {/* Android Mobile Frame Container */}
      <div className="w-full max-w-md min-h-screen flex flex-col bg-white shadow-2xl relative overflow-hidden border-x border-slate-200">
        
        {/* Android Status Bar */}
        <AndroidStatusBar
          serviceRunning={isBackgroundListening}
          isListening={assistantStatus === 'listening'}
          flashlightOn={deviceState.flashlight}
          batteryLevel={deviceState.batteryLevel}
          isCharging={deviceState.isCharging}
          activePersonaName={activeProfile.name}
        />

        {/* Top Fast Access Pill Row */}
        <div className="bg-slate-900/90 text-slate-200 px-3 py-1.5 flex items-center justify-between text-[11px] border-b border-slate-800 z-20">
          <button
            type="button"
            onClick={() => setShowPermissionsModal(true)}
            className="flex items-center gap-1 text-purple-300 hover:text-white transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>सर्व परवानग्या</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPhoneCallMode('incoming');
              setIsPhoneCallOpen(true);
            }}
            className="flex items-center gap-1 text-cyan-300 hover:text-white transition-colors cursor-pointer"
            title="इनकमिंग कॉल उत्तर द्या (Answer Incoming Call)"
          >
            <Phone className="w-3.5 h-3.5 text-cyan-400" />
            <span>कॉल उत्तर</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setVoiceCloningTargetProfileId(activeProfile.id);
              setShowVoiceCloningModal(true);
            }}
            className="flex items-center gap-1 text-pink-300 hover:text-white transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>व्हॉईस क्लोन</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('background')}
            className="flex items-center gap-1 text-emerald-300 hover:text-white transition-colors cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isBackgroundListening ? 'बॅकग्राउंड ऑन' : 'बॅकग्राउंड सेट'}</span>
          </button>
        </div>

        {/* Main Content Views */}
        <main className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'assistant' && (
            <AssistantView
              activeProfile={activeProfile}
              messages={messages}
              status={assistantStatus}
              audioLevel={audioLevel}
              heardText={heardText}
              isBackgroundListening={isBackgroundListening}
              onToggleListening={handleToggleListening}
              onToggleBackgroundListening={() => setIsBackgroundListening(v => !v)}
              onSendMessage={handleSendMessage}
              onReplaySpeech={(text) => speakTextAsPersona(text, activeProfile)}
              onSwitchPersonaClick={() => setActiveTab('profiles')}
              onClearHistory={() => {
                setMessages([]);
                showToast('इतिहास साफ केला.');
              }}
              onEditProfile={(profile) => {
                setEditingProfileTarget(profile);
                setActiveTab('profiles');
              }}
              onStartPhoneCall={() => {
                setPhoneCallMode('outgoing');
                setIsPhoneCallOpen(true);
              }}
              onOpenVoiceCloning={() => {
                setVoiceCloningTargetProfileId(activeProfile.id);
                setShowVoiceCloningModal(true);
              }}
              onOpenPermissions={() => setShowPermissionsModal(true)}
            />
          )}

          {activeTab === 'profiles' && (
            <ProfilesManager
              profiles={profiles}
              activeProfileId={activeProfileId}
              onSelectActiveProfile={(id) => {
                setActiveProfileId(id);
                const p = profiles.find(item => item.id === id);
                if (p) {
                  showToast(`${p.name} सक्रिय कंपॅनियन म्हणून निवडले!`);
                  speakTextAsPersona(`नमस्कार, मी ${p.name} बोलत आहे. मी तुम्हाला काय मदत करू?`, p);
                }
                setActiveTab('assistant');
              }}
              onAddProfile={(newP) => {
                setProfiles(prev => [...prev, newP]);
                setActiveProfileId(newP.id);
                showToast(`${newP.name} प्रोफाइल तयार झाली!`);
                speakTextAsPersona(`नमस्कार, मी ${newP.name} बोलत आहे.`, newP);
              }}
              onUpdateProfile={(updated) => {
                setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
                showToast(`${updated.name} प्रोफाइल अपडेट झाली!`);
              }}
              onDeleteProfile={(id) => {
                setProfiles(prev => prev.filter(p => p.id !== id));
                showToast('प्रोफाइल हटवली गेली.');
              }}
              onSpeakGreeting={(p) => {
                speakTextAsPersona(`नमस्कार, मी ${p.name} बोलत आहे.`, p);
              }}
              speakingProfileId={speakingProfileId}
              onOpenVoiceCloning={(pId) => {
                setVoiceCloningTargetProfileId(pId);
                setShowVoiceCloningModal(true);
              }}
              editingProfileTarget={editingProfileTarget}
              onClearEditingTarget={() => setEditingProfileTarget(null)}
            />
          )}

          {activeTab === 'controls' && (
            <DeviceControlsView
              deviceState={deviceState}
              onToggleFlashlight={handleToggleFlashlight}
              onUpdateBrightness={(lvl) => setDeviceState(prev => ({ ...prev, screenBrightness: lvl }))}
              onToggleDarkMode={() => setDeviceState(prev => ({ ...prev, darkMode: !prev.darkMode }))}
              onUpdateVolume={(vol) => setDeviceState(prev => ({ ...prev, volume: vol, isMuted: vol === 0 }))}
              onToggleMute={() => setDeviceState(prev => ({ ...prev, isMuted: !prev.isMuted }))}
              alarms={alarms}
              onToggleAlarm={(id) => {
                setAlarms(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
                showToast('अलार्म स्टेटस बदलले.');
              }}
              onDeleteAlarm={(id) => {
                setAlarms(prev => prev.filter(a => a.id !== id));
                showToast('अलार्म हटवला.');
              }}
              onAddAlarm={(timeString, label) => {
                setAlarms(prev => [...prev, { id: `alarm-${Date.now()}`, timeString, label, enabled: true, createdAt: Date.now() }]);
                playSuccessChime();
                showToast(`अलार्म सेट केला: ${timeString}`);
              }}
              timers={timers}
              onToggleTimer={(id) => {
                setTimers(prev => prev.map(t => t.id === id ? { ...t, isRunning: !t.isRunning } : t));
              }}
              onResetTimer={(id) => {
                setTimers(prev => prev.map(t => t.id === id ? { ...t, remainingSeconds: t.totalSeconds, isRunning: false, completed: false } : t));
              }}
              onDeleteTimer={(id) => {
                setTimers(prev => prev.filter(t => t.id !== id));
                showToast('टायमर हटवला.');
              }}
              onAddTimer={(secs, label) => {
                setTimers(prev => [...prev, { id: `timer-${Date.now()}`, label, totalSeconds: secs, remainingSeconds: secs, isRunning: true, completed: false }]);
                playSuccessChime();
                showToast(`टायमर सुरू केला!`);
              }}
              notes={notes}
              onDeleteNote={(id) => {
                setNotes(prev => prev.filter(n => n.id !== id));
                showToast('नोंद हटवली.');
              }}
              onAddNote={(title, content) => {
                setNotes(prev => [{ id: `note-${Date.now()}`, title, content, timestamp: 'आत्ताच' }, ...prev]);
                playSuccessChime();
                showToast('नोंद सेव्ह झाली!');
              }}
            />
          )}

          {activeTab === 'websearch' && (
            <WebSearchReaderView
              activeProfile={activeProfile}
              onReadAloud={handleReadAloud}
              onStopReading={handleStopReading}
              isReading={isReadingWebArticle}
            />
          )}

          {activeTab === 'privacy' && (
            <PrivacyAndAboutView
              onClearAllData={handleClearAllData}
              onExportData={handleExportData}
              onOpenPermissions={() => setShowPermissionsModal(true)}
            />
          )}

          {activeTab === 'background' && (
            <BackgroundServiceCard
              serviceRunning={isBackgroundListening}
              onToggleService={() => {
                setIsBackgroundListening(v => !v);
                playWakeChime();
              }}
              audioLevel={audioLevel}
              threshold={sensitivityThreshold}
              onUpdateThreshold={(v) => setSensitivityThreshold(v)}
              wakeWords={wakeWords}
            />
          )}
        </main>

        {/* Android Material Bottom Navigation Bar */}
        <nav className="bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around z-30 select-none">
          <button
            type="button"
            onClick={() => setActiveTab('assistant')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'assistant'
                ? 'text-purple-700 font-bold bg-purple-50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === 'assistant' ? 'bg-purple-700 text-white shadow-xs' : ''}`}>
              <Mic className="w-4 h-4" />
            </div>
            <span className="text-[9px] mt-0.5">असिस्टंट</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'profiles'
                ? 'text-purple-700 font-bold bg-purple-50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === 'profiles' ? 'bg-purple-700 text-white shadow-xs' : ''}`}>
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[9px] mt-0.5">प्रोफाइल्स</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('controls')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'controls'
                ? 'text-purple-700 font-bold bg-purple-50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === 'controls' ? 'bg-purple-700 text-white shadow-xs' : ''}`}>
              <Smartphone className="w-4 h-4" />
            </div>
            <span className="text-[9px] mt-0.5">कंट्रोल्स</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('websearch')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'websearch'
                ? 'text-purple-700 font-bold bg-purple-50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === 'websearch' ? 'bg-purple-700 text-white shadow-xs' : ''}`}>
              <Globe className="w-4 h-4" />
            </div>
            <span className="text-[9px] mt-0.5">वेब शोध</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'text-purple-700 font-bold bg-purple-50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === 'privacy' ? 'bg-purple-700 text-white shadow-xs' : ''}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[9px] mt-0.5">प्रायव्हसी</span>
          </button>
        </nav>

        {/* Ringing Alert Modal (When Alarm or Timer Completes) */}
        {ringingAlert && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in zoom-in-95">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4 border-2 border-red-500 animate-bounce">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Bell className="w-8 h-8 animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{ringingAlert.title}</h3>
              <p className="text-sm text-slate-600">{ringingAlert.message}</p>
              <button
                type="button"
                onClick={stopRingingAlert}
                className="w-full py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-full font-bold text-sm shadow-lg cursor-pointer"
              >
                थांबवा (Dismiss)
              </button>
            </div>
          </div>
        )}

        {/* Permissions Modal */}
        <PermissionsManagerModal
          isOpen={showPermissionsModal}
          onClose={() => setShowPermissionsModal(false)}
          permissions={permissions}
          onUpdatePermissions={(newP) => {
            setPermissions(newP);
            showToast('सर्व परवानग्या अपडेट झाल्या!');
          }}
        />

        {/* Voice Cloning Studio Modal */}
        <VoiceCloningStudioModal
          isOpen={showVoiceCloningModal}
          onClose={() => setShowVoiceCloningModal(false)}
          profiles={profiles}
          activeProfileId={voiceCloningTargetProfileId}
          onApplyClonedVoice={handleApplyClonedVoice}
          onTestVoice={(text, pitch, rate, gender, audioUri) => {
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
              const u = new SpeechSynthesisUtterance(text);
              const voices = window.speechSynthesis.getVoices();
              const marathiVoice = voices.find(v => v.lang.startsWith('mr') || v.lang === 'mr-IN');
              const hindiVoice = voices.find(v => v.lang.startsWith('hi') || v.lang === 'hi-IN');
              if (marathiVoice) u.voice = marathiVoice;
              else if (hindiVoice) u.voice = hindiVoice;
              u.pitch = pitch;
              u.rate = rate;
              window.speechSynthesis.speak(u);
            }
          }}
        />

        {/* Real-time Voice Phone Call Modal (Call Answering & Duplex Voice) */}
        <PhoneCallModal
          isOpen={isPhoneCallOpen}
          onClose={() => setIsPhoneCallOpen(false)}
          callerProfile={activeProfile}
          initialMode={phoneCallMode}
          onSendCallMessage={async (userText) => {
            try {
              const response = await fetch('/api/assistant/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prompt: `[DIRECT PHONE CALL DIALOGUE: You are talking directly on a real-time phone call with the user. You are ${activeProfile.name}, the user's ${activeProfile.relationship} (${activeProfile.age} years old). Your personality: ${activeProfile.personality}. Speak affectionately, lovingly, and conversationally in natural Marathi ("मनासारखं बोलणे"). Answer their questions directly, ask about their day, react to what they say like a genuine person on a phone call. Keep spoken answers to 1-3 sentences per turn for natural phone conversation.] ${userText}`,
                  profile: activeProfile,
                  history: messages.slice(-6),
                }),
              });
              const data = await response.json();
              return data.text || 'होय, मी ऐकतेय...';
            } catch {
              return 'हॅलो, तुझा आवाज थोडा कट झाला होता. पुन्हा बोलशील का?';
            }
          }}
          onSpeakVoice={(text, persona) => {
            speakTextAsPersona(text, persona);
          }}
          isCallerSpeaking={speakingProfileId === activeProfile.id || assistantStatus === 'speaking'}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200 pointer-events-none max-w-[90%]">
            <div className="bg-[#313033] text-[#F4EFF4] px-4 py-2.5 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 border border-slate-700">
              <Sparkles className="w-4 h-4 text-purple-300 shrink-0" />
              <span className="line-clamp-1">{toastMessage}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
