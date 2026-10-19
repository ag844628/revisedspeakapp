import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  Upload, 
  Mic, 
  MicOff, 
  UserPlus, 
  Trash2, 
  Radio, 
  Check, 
  Play, 
  Square,
  Sparkles,
  Info,
  Smartphone,
  Download
} from 'lucide-react';
import { Profile } from './types';

// Pre-seeded initial profiles in Marathi to allow immediate testing
const INITIAL_PROFILES: Profile[] = [
  {
    id: 1,
    name: 'अमित जोशी',
    gender: 'Male',
    age: '28',
    profession: 'सॉफ्टवेअर इंजिनिअर',
    relationship: 'मित्र',
    audioUri: null
  },
  {
    id: 2,
    name: 'प्रिया कुलकर्णी',
    gender: 'Female',
    age: '26',
    profession: 'डॉक्टर',
    relationship: 'बहीण',
    audioUri: null
  }
];

export default function App() {
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('newspeakapp_profiles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_PROFILES;
      }
    }
    return INITIAL_PROFILES;
  });

  // Form states
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [age, setAge] = useState('');
  const [profession, setProfession] = useState('');
  const [relationship, setRelationship] = useState('');

  // Background listening service state
  const [serviceRunning, setServiceRunning] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [heardText, setHeardText] = useState<string>('');

  // Active playing audio state
  const [speakingProfileId, setSpeakingProfileId] = useState<number | null>(null);

  // Audio picker / record modal state
  const [selectedProfileForAudio, setSelectedProfileForAudio] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);

  // Toast message state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refs
  const audioInputRef = useRef<HTMLInputElement>(null);
  const currentAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  // Save profiles to localStorage
  useEffect(() => {
    localStorage.setItem('newspeakapp_profiles', JSON.stringify(profiles));
  }, [profiles]);

  // PWA install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          showToast('ॲप इन्स्टॉल केले जात आहे!');
          setDeferredPrompt(null);
        }
      } catch {
        setShowInstallGuide(true);
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  // Toast helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(prev => (prev === message ? null : prev));
    }, 3200);
  };

  // Web Speech API / Audio playback
  const playResponse = (profile: Profile) => {
    const greeting = `नमस्कार, मी ${profile.name} बोलत आहे.`;

    // Stop currently playing audio or speech
    if (currentAudioElementRef.current) {
      currentAudioElementRef.current.pause();
      currentAudioElementRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setSpeakingProfileId(profile.id);

    // If custom audio was uploaded/recorded
    if (profile.audioUri) {
      try {
        const audio = new Audio(profile.audioUri);
        currentAudioElementRef.current = audio;
        audio.onended = () => {
          setSpeakingProfileId(null);
        };
        audio.onerror = () => {
          showToast('ऑडिओ चालवण्यात अडचण आली. टेक्स्ट-टू-स्पीच वापरत आहे.');
          fallbackTTS(greeting, profile.gender, () => setSpeakingProfileId(null));
        };
        audio.play().catch(e => {
          console.error(e);
          fallbackTTS(greeting, profile.gender, () => setSpeakingProfileId(null));
        });
        return;
      } catch (e) {
        console.error('Audio playback error', e);
      }
    }

    // Default Marathi Text-to-Speech
    fallbackTTS(greeting, profile.gender, () => setSpeakingProfileId(null));
  };

  const fallbackTTS = (text: string, voiceGender: 'Male' | 'Female', onEnd: () => void) => {
    if (!('speechSynthesis' in window)) {
      showToast('आपल्या ब्राउझरमध्ये Text-to-Speech सपोर्ट नाही.');
      onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    // Find Marathi voice or fallback to Hindi / Indian voice
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

    // Female: pitch 1.3, rate 1.0; Male: pitch 0.8, rate 1.0
    if (voiceGender === 'Female') {
      utterance.pitch = 1.3;
      utterance.rate = 1.0;
    } else {
      utterance.pitch = 0.8;
      utterance.rate = 1.0;
    }

    utterance.onend = () => onEnd();
    utterance.onerror = () => onEnd();

    window.speechSynthesis.speak(utterance);
  };

  // Toggle Background Listening Service
  const toggleListeningService = async () => {
    if (serviceRunning) {
      // Stop service
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setServiceRunning(false);
      setAudioLevel(0);
      showToast('बॅकग्राउंड लिसनिंग सर्व्हिस थांबवली आहे.');
    } else {
      // Start service
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        setServiceRunning(true);
        showToast('बॅकग्राउंड लिसनिंग सर्व्हिस सुरू झाली!');

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
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
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
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'mr-IN';

          recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            setHeardText(transcript);
          };

          recognition.onerror = () => {};
          recognition.onend = () => {
            if (serviceRunning) {
              try { recognition.start(); } catch {}
            }
          };

          try {
            recognition.start();
            recognitionRef.current = recognition;
          } catch {}
        }
      } catch (err) {
        console.error('Microphone permission error', err);
        showToast('मायक्रोफोन परवानगी आवश्यक आहे. कृपया सेटिंग्जमधून परवानगी द्या.');
      }
    }
  };

  // Handle adding new profile
  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('कृपया नाव प्रविष्ट करा');
      return;
    }

    const newProfile: Profile = {
      id: Date.now(),
      name: name.trim(),
      gender,
      age: age.trim(),
      profession: profession.trim(),
      relationship: relationship.trim(),
      audioUri: null
    };

    setProfiles(prev => [...prev, newProfile]);
    setName('');
    setAge('');
    setProfession('');
    setRelationship('');
    showToast('प्रोफाइल तयार झाली!');
  };

  // Handle delete profile
  const handleDeleteProfile = (id: number) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    showToast('प्रोफाइल हटवली गेली.');
  };

  // Handle file selection for audio
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || selectedProfileForAudio === null) return;

    const url = URL.createObjectURL(file);
    setProfiles(prev => prev.map(p => {
      if (p.id === selectedProfileForAudio) {
        return { ...p, audioUri: url, audioName: file.name };
      }
      return p;
    }));

    showToast('आवाज यशस्वीरीत्या अपलोड झाला!');
    setSelectedProfileForAudio(null);
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
  };

  // Start Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        if (selectedProfileForAudio !== null) {
          setProfiles(prev => prev.map(p => {
            if (p.id === selectedProfileForAudio) {
              return { ...p, audioUri: audioUrl, audioName: 'कस्टम रेकॉर्डिंग.webm' };
            }
            return p;
          }));
          showToast('आवाज यशस्वीरीत्या अपलोड झाला!');
        }

        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setRecordDuration(0);
        setSelectedProfileForAudio(null);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordDuration(sec => sec + 1);
      }, 1000);
    } catch (err) {
      console.error('Recording error', err);
      showToast('मायक्रोफोन ॲक्सेस उपलब्ध नाही.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF7FF] text-[#1D1B20] flex flex-col items-center py-6 px-3 sm:px-6">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-3xl border border-purple-100 overflow-hidden flex flex-col">
        
        {/* Top App Bar */}
        <header className="bg-[#6750A4] text-white px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-lg">
                🎙️
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">व्हॉईस असिस्टंट डॅशबोर्ड</h1>
                <p className="text-xs text-purple-200">Companion Voice Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-xs bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <span className={`w-2 h-2 rounded-full ${serviceRunning ? 'bg-green-400 animate-ping' : 'bg-gray-300'}`}></span>
              <span>{serviceRunning ? 'सक्रिय' : 'शांत'}</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 sm:p-6 space-y-6">

          {/* Mobile App Install / Guide Banner */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6750A4] text-white flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-purple-950 flex items-center gap-1.5">
                  मोबाईलवर ॲप म्हणून वापरा (Android Install)
                </h2>
                <p className="text-xs text-purple-700">
                  हे वेब ॲप डाऊनलोड न करता थेट मोबाईलच्या होम स्क्रीनवर ॲपप्रमाणे इन्स्टॉल करता येते.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-4 py-2 bg-[#6750A4] hover:bg-[#594392] active:scale-95 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap self-stretch sm:self-center justify-center transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              {deferredPrompt ? 'ॲप इन्स्टॉल करा' : 'मोबाईलवर कसे चालवावे?'}
            </button>
          </div>

          {/* 1. Background Listening Service Card */}
          <section className="bg-[#F3EDF7] rounded-2xl p-4 sm:p-5 border border-purple-200/60 transition-all shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className={`p-3 rounded-2xl mt-0.5 ${serviceRunning ? 'bg-[#6750A4] text-white shadow-md' : 'bg-purple-100 text-[#6750A4]'}`}>
                  {serviceRunning ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#1D1B20]">बॅकग्राउंड लिसनिंग सर्व्हिस</h2>
                  <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-0.5">
                    {serviceRunning ? (
                      <span className="text-emerald-700 font-medium">🟢 चालू आहे</span>
                    ) : (
                      <span className="text-slate-500 font-medium">⚪ बंद आहे</span>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleListeningService}
                className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                  serviceRunning
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-[#6750A4] hover:bg-[#594392] text-white'
                }`}
              >
                {serviceRunning ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    थांबवा
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    सुरू करा
                  </>
                )}
              </button>
            </div>

            {/* Active Listening Audio Level Meter */}
            {serviceRunning && (
              <div className="mt-4 pt-3 border-t border-purple-200/80">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                  <span className="flex items-center gap-1 font-medium text-purple-900">
                    <Radio className="w-3.5 h-3.5 text-purple-700 animate-pulse" />
                    मायक्रोफोन आवाज संवेदनशीलता
                  </span>
                  <span>{audioLevel}%</span>
                </div>
                <div className="w-full bg-purple-200/60 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-[#6750A4] h-2 rounded-full transition-all duration-75"
                    style={{ width: `${Math.max(5, audioLevel)}%` }}
                  ></div>
                </div>
                {heardText && (
                  <p className="mt-2.5 text-xs text-purple-950 bg-white/80 p-2 rounded-lg border border-purple-100">
                    <span className="font-semibold text-purple-800">ऐकलेला आवाज:</span> &quot;{heardText}&quot;
                  </p>
                )}
              </div>
            )}
          </section>

          {/* 2. Profile Creation Form */}
          <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#6750A4]" />
              <h2 className="text-base font-semibold text-slate-900">नवीन प्रोफाइल तयार करा</h2>
            </div>

            <form onSubmit={handleAddProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  प्रोफाइलचे नाव <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="उदा. राहुल किंवा स्नेहा"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6750A4] focus:border-transparent text-sm bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  लिंग (Gender)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('Male')}
                    className={`py-2.5 px-4 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      gender === 'Male'
                        ? 'bg-[#6750A4] text-white border-[#6750A4] shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {gender === 'Male' && <Check className="w-4 h-4 stroke-[3]" />}
                    {gender === 'Male' ? '✔ Male' : 'Male'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setGender('Female')}
                    className={`py-2.5 px-4 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      gender === 'Female'
                        ? 'bg-[#6750A4] text-white border-[#6750A4] shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {gender === 'Female' && <Check className="w-4 h-4 stroke-[3]" />}
                    {gender === 'Female' ? '✔ Female' : 'Female'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  वय (Age)
                </label>
                <input
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="उदा. 28"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6750A4] focus:border-transparent text-sm bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  प्रोफेशन (Profession)
                </label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="उदा. शिक्षक, इंजिनिअर, डॉक्टर"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6750A4] focus:border-transparent text-sm bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  नातेसंबंध (Relationship)
                </label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="उदा. मित्र, भाऊ, सहकारी"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6750A4] focus:border-transparent text-sm bg-slate-50/50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#6750A4] hover:bg-[#594392] active:scale-[0.99] text-white rounded-full font-medium text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                नवीन प्रोफाइल जोडा
              </button>
            </form>
          </section>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-500 font-semibold">तयार केलेल्या प्रोफाइल्स</span>
            </div>
          </div>

          {/* 3. Profiles List */}
          <section className="space-y-3">
            {profiles.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">कोणतीही प्रोफाइल उपलब्ध नाही.</p>
                <p className="text-xs text-slate-400 mt-1">नवीन प्रोफाइल जोडण्यासाठी वरील फॉर्म भरा.</p>
              </div>
            ) : (
              profiles.map((profile) => {
                const isSpeaking = speakingProfileId === profile.id;
                return (
                  <div
                    key={profile.id}
                    className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-sm hover:shadow-md ${
                      isSpeaking ? 'border-purple-400 ring-2 ring-purple-200' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                          <span>नाव: {profile.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-normal ${
                            profile.gender === 'Female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {profile.gender}
                          </span>
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          वय: {profile.age || '-'} | प्रोफेशन: {profile.profession || '-'}
                        </p>
                        <p className="text-sm text-slate-600">
                          नातेसंबंध: {profile.relationship || '-'}
                        </p>
                        <p className="text-xs font-medium text-slate-500 mt-1.5 flex items-center gap-1.5">
                          {profile.audioUri ? (
                            <span className="text-purple-700 flex items-center gap-1">
                              🎙️ कस्टम ऑडिओ जोडलेला आहे
                              {profile.audioName && (
                                <span className="text-[11px] text-slate-400">({profile.audioName})</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-500 flex items-center gap-1">
                              🔊 डीफॉल्ट व्हॉईस वापरत आहे
                            </span>
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteProfile(profile.id)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="हटवा"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                      <button
                        type="button"
                        onClick={() => playResponse(profile)}
                        className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                          isSpeaking
                            ? 'bg-purple-700 text-white animate-pulse'
                            : 'bg-[#6750A4] hover:bg-[#594392] text-white'
                        }`}
                      >
                        <Volume2 className="w-4 h-4" />
                        {isSpeaking ? 'बोलत आहे...' : 'ऐका (Speak)'}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProfileForAudio(profile.id);
                            if (audioInputRef.current) {
                              audioInputRef.current.click();
                            }
                          }}
                          className="px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium border border-[#6750A4] text-[#6750A4] hover:bg-purple-50 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          आवाज अपलोड करा
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProfileForAudio(profile.id);
                            startRecording();
                          }}
                          className="px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium bg-purple-100 hover:bg-purple-200 text-[#6750A4] transition-all flex items-center gap-1.5 cursor-pointer"
                          title="थेट आवाज रेकॉर्ड करा"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          रेकॉर्ड करा
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </main>

        <input
          type="file"
          ref={audioInputRef}
          onChange={handleFileUpload}
          accept="audio/*"
          className="hidden"
        />

        {isRecording && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto animate-pulse">
                <Mic className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">आवाज रेकॉर्ड होत आहे...</h3>
              <p className="text-3xl font-mono font-semibold text-red-600">
                00:{recordDuration < 10 ? `0${recordDuration}` : recordDuration}
              </p>
              <p className="text-xs text-slate-500">
                मायक्रोफोनमध्ये स्पष्ट बोला. रेकॉर्डिंग पूर्ण झाल्यावर खालील बटणावर दाबा.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-current" />
                  रेकॉर्डिंग सेव्ह करा
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Install Guide Modal */}
        {showInstallGuide && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-[#6750A4] font-bold text-base">
                  <Smartphone className="w-5 h-5" />
                  <span>मोबाईलवर ॲप कसे इन्स्टॉल करावे?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInstallGuide(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-purple-900">
                  <p className="font-semibold mb-1">💡 महत्त्वाची माहिती:</p>
                  <p>हे एक <strong>Live Cloud App</strong> आहे. म्हणूनच लिंकवर क्लिक केल्यावर कोणतीही फाईल डाऊनलोड न होता थेट ॲप ब्राउझरमध्ये सुरू होते.</p>
                </div>

                <p className="font-semibold text-slate-800">हे ॲप तुमच्या फोनच्या स्क्रीनवर ॲपप्रमाणे सेव्ह करण्यासाठी:</p>
                
                <ol className="space-y-2 list-decimal list-inside bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <li>तुमच्या Android फोनमध्ये <strong>Google Chrome</strong> ओपन करा.</li>
                  <li>वरच्या उजव्या बाजूला असलेल्या <strong>३ ठिपक्यांवर (⋮)</strong> टॅप करा.</li>
                  <li>खालीलपैकी एक पर्याय निवडा:
                    <div className="mt-1 ml-4 font-semibold text-[#6750A4]">
                      • "Install app" (ॲप इन्स्टॉल करा)<br/>
                      • किंवा "Add to Home screen" (होम स्क्रीनवर जोडा)
                    </div>
                  </li>
                  <li><strong>'Install' / 'Add'</strong> वर क्लिक करा.</li>
                </ol>

                <p className="text-slate-500 text-[11px]">
                  ✅ आता तुमच्या फोनच्या ॲप लिस्टमध्ये 'Companion' चे ॲप दिसेल आणि ते कोणत्याही APK शिवाय थेट फोनवर चालेल!
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowInstallGuide(false)}
                  className="w-full py-2.5 bg-[#6750A4] hover:bg-[#594392] text-white rounded-full font-medium text-xs sm:text-sm shadow-md cursor-pointer"
                >
                  समजले, बंद करा
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="bg-slate-50 px-6 py-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Companion Voice Assistant Profile System • Marathi Speech & Voice Cloning
        </footer>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-[#313033] text-[#F4EFF4] px-5 py-3 rounded-full text-sm font-medium shadow-2xl flex items-center gap-2 border border-slate-700">
            <Sparkles className="w-4 h-4 text-purple-300" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
