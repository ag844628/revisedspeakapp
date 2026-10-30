import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  Mic, 
  Square, 
  Play, 
  CheckCircle2, 
  Sliders, 
  Volume2, 
  Activity,
  Layers
} from 'lucide-react';
import { Profile, ClonedVoiceData } from '../types';
import { analyzeVoiceClip } from '../utils/voiceCloner';

interface VoiceCloningStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: Profile[];
  activeProfileId: string;
  onApplyClonedVoice: (profileId: string, clonedData: ClonedVoiceData) => void;
  onTestVoice: (text: string, pitch: number, rate: number, gender: 'Male' | 'Female', audioUri?: string | null) => void;
}

export const VoiceCloningStudioModal: React.FC<VoiceCloningStudioModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  onApplyClonedVoice,
  onTestVoice,
}) => {
  const [selectedTargetProfileId, setSelectedTargetProfileId] = useState<string>(activeProfileId);
  const [analyzedData, setAnalyzedData] = useState<ClonedVoiceData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioSourceUrl, setAudioSourceUrl] = useState<string | null>(null);
  const [testText, setTestText] = useState('नमस्कार, मी या क्लोन केलेल्या आवाजात बोलत आहे. मी तुम्हाला काय मदत करू?');

  // Live recording in studio
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const targetProfile = profiles.find(p => p.id === selectedTargetProfileId) || profiles[0];

  // Handle audio file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        setAudioSourceUrl(dataUrl);

        try {
          const result = await analyzeVoiceClip(dataUrl, file.name);
          setAnalyzedData(result);
        } catch (err) {
          console.error('Audio analysis error:', err);
        } finally {
          setIsAnalyzing(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Start Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        setIsAnalyzing(true);
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          if (typeof reader.result === 'string') {
            const dataUrl = reader.result;
            setAudioSourceUrl(dataUrl);
            const result = await analyzeVoiceClip(blob, 'लाईव्ह रेकॉर्ड केलेला आवाज');
            setAnalyzedData(result);
            setIsAnalyzing(false);
          }
        };
        reader.readAsDataURL(blob);

        stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);
        setDuration(0);
      };

      mr.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = window.setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch {
      alert('मायक्रोफोन ॲक्सेस उपलब्ध नाही.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Apply Cloned Voice to Profile
  const handleSaveToProfile = () => {
    if (!analyzedData) return;
    onApplyClonedVoice(selectedTargetProfileId, analyzedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-in fade-in">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-purple-700 to-pink-600 rounded-xl text-white shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">व्हॉईस क्लोनिंग स्टुडिओ (Voice Cloning)</h3>
              <p className="text-[11px] text-slate-500">कोणतीही ऑडिओ क्लिप टाकून त्या व्यक्तीचा आवाज क्लोन करा</p>
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

        {/* Step 1: Select Profile */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            1. कोणाचा आवाज क्लोन करायचा आहे? (Select Profile)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedTargetProfileId(p.id)}
                className={`p-2 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  selectedTargetProfileId === p.id
                    ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-200'
                    : 'bg-slate-50 border-slate-200 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={p.avatarUrl} alt={p.name} className="w-10 h-10 rounded-xl object-cover" />
                <span className="text-[11px] font-bold text-slate-800 line-clamp-1">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Upload Audio Clip or Record */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            2. ऑडिओ क्लिप टाका किंवा बोला (Provide Voice Sample)
          </label>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Upload file */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-4 bg-purple-50 hover:bg-purple-100/80 border border-purple-200 rounded-2xl flex flex-col items-center justify-center gap-1 text-purple-900 transition-colors cursor-pointer"
            >
              <Upload className="w-6 h-6 text-purple-700" />
              <span className="text-xs font-bold">ऑडिओ फाईल निवडा</span>
              <span className="text-[10px] text-purple-600">MP3, WAV, M4A, WEBM</span>
            </button>

            {/* Live Record */}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-4 border rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs ${
                isRecording
                  ? 'bg-red-600 text-white border-red-700 animate-pulse'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-6 h-6 fill-current" />
                  <span className="text-xs font-bold">थांबवा (00:{duration < 10 ? `0${duration}` : duration})</span>
                  <span className="text-[10px] opacity-90">रेकॉर्ड होत आहे...</span>
                </>
              ) : (
                <>
                  <Mic className="w-6 h-6 text-indigo-600" />
                  <span className="text-xs font-bold">थेट आवाज रेकॉर्ड करा</span>
                  <span className="text-[10px] text-slate-500">मायक्रोफोनने 5 सेकंद बोला</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Analyzing Spinner */}
        {isAnalyzing && (
          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 flex items-center justify-center gap-2 text-xs font-semibold text-purple-900 animate-pulse">
            <Activity className="w-4 h-4 text-purple-700 animate-spin" />
            <span>ऑडिओचे फ्रिक्वेन्सी व पिच विश्लेषण केले जात आहे...</span>
          </div>
        )}

        {/* Step 3: Analysis Results */}
        {analyzedData && !isAnalyzing && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>आवाज विश्लेषण यशस्वी! (Voice Signature Extracted)</span>
              </span>
              <span className="text-[10px] bg-purple-200/60 text-purple-900 px-2 py-0.5 rounded-full font-mono font-bold">
                {analyzedData.fundamentalPitch} Hz
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
                <span className="text-[10px] text-slate-500 block">ओळखलेले लिंग (Gender)</span>
                <span className="font-bold text-slate-800">
                  {analyzedData.detectedGender === 'Female' ? 'स्त्री (Female)' : 'पुरुष (Male)'}
                </span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
                <span className="text-[10px] text-slate-500 block">पिच व फॉर्मंट (Formant Ratio)</span>
                <span className="font-bold text-purple-800">{analyzedData.formantRatio}x (बारीक/जाड)</span>
              </div>
            </div>

            <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100 text-xs">
              <span className="text-[10px] text-slate-500 block">आवाजाचा पोत (Voice Timbre Tone)</span>
              <span className="font-semibold text-purple-950">{analyzedData.detectedTone}</span>
            </div>

            {/* Test Voice Section */}
            <div className="pt-2 border-t border-purple-200/60 space-y-2">
              <label className="block text-[11px] font-bold text-purple-900">
                क्लोन केलेल्या आवाजात चाचणी घ्या (Test Speech):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="flex-1 text-xs px-3 py-1.5 bg-white rounded-xl border border-purple-200 focus:outline-purple-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    onTestVoice(
                      testText,
                      analyzedData.formantRatio,
                      analyzedData.speechRate,
                      analyzedData.detectedGender,
                      audioSourceUrl
                    );
                  }}
                  className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>ऐका</span>
                </button>
              </div>
            </div>

            {/* Apply Button */}
            <button
              type="button"
              onClick={handleSaveToProfile}
              className="w-full py-3 bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>हा क्लोन केलेला आवाज {targetProfile.name} साठी लागू करा</span>
            </button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="audio/*"
          className="hidden"
        />

      </div>
    </div>
  );
};
