import React, { useState, useEffect, useRef } from 'react';
import { 
  UserPlus, 
  Trash2, 
  Volume2, 
  Upload, 
  Mic, 
  Square, 
  Check, 
  Sparkles,
  Sliders,
  Image as ImageIcon,
  Pencil
} from 'lucide-react';
import { Profile, Gender } from '../types';
import { AVATAR_PRESETS } from '../data/initialProfiles';

interface ProfilesManagerProps {
  profiles: Profile[];
  activeProfileId: string;
  onSelectActiveProfile: (id: string) => void;
  onAddProfile: (profile: Profile) => void;
  onUpdateProfile: (updatedProfile: Profile) => void;
  onDeleteProfile: (id: string) => void;
  onSpeakGreeting: (profile: Profile) => void;
  speakingProfileId: string | null;
  onOpenVoiceCloning: (profileId: string) => void;
  editingProfileTarget?: Profile | null;
  onClearEditingTarget?: () => void;
}

export const ProfilesManager: React.FC<ProfilesManagerProps> = ({
  profiles,
  activeProfileId,
  onSelectActiveProfile,
  onAddProfile,
  onUpdateProfile,
  onDeleteProfile,
  onSpeakGreeting,
  speakingProfileId,
  onOpenVoiceCloning,
  editingProfileTarget,
  onClearEditingTarget,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('आई');
  const [age, setAge] = useState('48');
  const [gender, setGender] = useState<Gender>('Female');
  const [personality, setPersonality] = useState('प्रेमळ, काळजीवाहू, आपुलकीने चौकशी करणारी आणि सल्ला देणारी.');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(AVATAR_PRESETS[0].url);
  const [voicePitch, setVoicePitch] = useState<number>(1.2);
  const [voiceRate, setVoiceRate] = useState<number>(1.0);
  const [geminiVoice, setGeminiVoice] = useState<'Kore' | 'Puck' | 'Zephyr' | 'Fenrir' | 'Charon'>('Kore');
  const [customAudioUri, setCustomAudioUri] = useState<string | null>(null);

  // Live recording in modal
  const [isRecordingSample, setIsRecordingSample] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen to external edit target (e.g. when user clicks Edit in AssistantView)
  useEffect(() => {
    if (editingProfileTarget) {
      openEditModal(editingProfileTarget);
      onClearEditingTarget?.();
    }
  }, [editingProfileTarget]);

  const openCreateModal = () => {
    setEditingProfileId(null);
    setName('');
    setRelationship('आई');
    setAge('48');
    setGender('Female');
    setPersonality('प्रेमळ, काळजीवाहू, आपुलकीने चौकशी करणारी आणि सल्ला देणारी.');
    setSelectedAvatarUrl(AVATAR_PRESETS[0].url);
    setVoicePitch(1.2);
    setVoiceRate(1.0);
    setGeminiVoice('Kore');
    setCustomAudioUri(null);
    setShowModal(true);
  };

  const openEditModal = (profile: Profile) => {
    setEditingProfileId(profile.id);
    setName(profile.name);
    setRelationship(profile.relationship);
    setAge(profile.age);
    setGender(profile.gender);
    setPersonality(profile.personality);
    setSelectedAvatarUrl(profile.avatarUrl);
    setVoicePitch(profile.voicePitch);
    setVoiceRate(profile.voiceRate);
    setGeminiVoice(profile.geminiVoice);
    setCustomAudioUri(profile.audioUri || null);
    setShowModal(true);
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Start voice recording for profile
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setCustomAudioUri(reader.result);
          }
        };
        reader.readAsDataURL(blob);

        stream.getTracks().forEach((t) => t.stop());
        setIsRecordingSample(false);
        setRecordDuration(0);
      };

      mr.start();
      setIsRecordingSample(true);
      setRecordDuration(0);

      timerRef.current = window.setInterval(() => {
        setRecordDuration((d) => d + 1);
      }, 1000);
    } catch {
      alert('मायक्रोफोन ॲक्सेस उपलब्ध नाही.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecordingSample) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('कृपया प्रोफाइलचे नाव प्रविष्ट करा');
      return;
    }

    if (editingProfileId) {
      const existing = profiles.find(p => p.id === editingProfileId);
      const updated: Profile = {
        id: editingProfileId,
        name: name.trim(),
        relationship: relationship.trim() || 'मित्र',
        age: age.trim() || '30',
        gender,
        personality: personality.trim() || 'मदतीस तत्पर आणि प्रेमळ',
        avatarUrl: selectedAvatarUrl,
        voicePitch,
        voiceRate,
        geminiVoice,
        audioUri: customAudioUri,
        audioName: customAudioUri ? 'कस्टम व्हॉईस सॅम्पल' : existing?.audioName,
        clonedVoice: existing?.clonedVoice,
      };
      onUpdateProfile(updated);
    } else {
      const newProfile: Profile = {
        id: `profile-${Date.now()}`,
        name: name.trim(),
        relationship: relationship.trim() || 'मित्र',
        age: age.trim() || '30',
        gender,
        personality: personality.trim() || 'मदतीस तत्पर आणि प्रेमळ',
        avatarUrl: selectedAvatarUrl,
        voicePitch,
        voiceRate,
        geminiVoice,
        audioUri: customAudioUri,
        audioName: customAudioUri ? 'कस्टम व्हॉईस सॅम्पल' : null,
      };
      onAddProfile(newProfile);
    }

    setShowModal(false);
    setEditingProfileId(null);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Header Info */}
      <div className="bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-700 text-white p-5 rounded-3xl shadow-md flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span>👥</span>
            <span>कंपॅनियन प्रोफाइल्स (AI Personas)</span>
          </h2>
          <p className="text-xs text-purple-200 mt-1">
            प्रत्येक व्यक्तीचा चेहरा, वय, नातेसंबंध, स्वभाव आणि आवाज एडिट व कस्टमाइझ करा.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-white text-purple-800 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-purple-50 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4 text-purple-700" />
          <span>नवीन जोडा</span>
        </button>
      </div>

      {/* Profiles Grid */}
      <div className="space-y-4">
        {profiles.map((profile) => {
          const isActive = profile.id === activeProfileId;
          const isSpeaking = speakingProfileId === profile.id;

          return (
            <div
              key={profile.id}
              className={`bg-white rounded-3xl p-5 border transition-all shadow-xs relative overflow-hidden ${
                isActive
                  ? 'border-purple-500 ring-4 ring-purple-200/80 shadow-md'
                  : 'border-slate-200 hover:border-purple-300'
              }`}
            >
              {/* Active Badge */}
              {isActive && (
                <div className="absolute top-0 right-0 bg-purple-700 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>सध्या सक्रिय (Active)</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Avatar and Info */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-100 shadow-sm"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        profile.gender === 'Female'
                          ? 'bg-pink-100 text-pink-700 border border-pink-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {profile.gender === 'Female' ? 'स्त्री' : 'पुरुष'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>{profile.name}</span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        {profile.relationship}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      वय: <span className="font-semibold text-slate-700">{profile.age} वर्षे</span> • आवाज: <span className="font-semibold text-purple-700">{profile.geminiVoice}</span>
                    </p>
                    {profile.clonedVoice?.isCloned && (
                      <span className="inline-flex items-center gap-1 bg-pink-100 text-pink-800 border border-pink-200 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">
                        <Sparkles className="w-3 h-3 text-pink-600" />
                        <span>🎙️ व्हॉईस क्लोन सक्रिय ({profile.clonedVoice.fundamentalPitch} Hz)</span>
                      </span>
                    )}
                    <p className="text-xs text-slate-600 mt-1 italic line-clamp-2 max-w-md">
                      "{profile.personality}"
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Edit Profile Button */}
                  <button
                    type="button"
                    onClick={() => openEditModal(profile)}
                    className="px-3 py-2 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                    title="या प्रोफाइलचा तपशील एडिट करा (Edit Profile)"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-600" />
                    <span>एडिट</span>
                  </button>

                  {/* Voice Clone Button */}
                  <button
                    type="button"
                    onClick={() => onOpenVoiceCloning(profile.id)}
                    className="px-3 py-2 rounded-full text-xs font-semibold bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                    title="या प्रोफाइलचा आवाज क्लोन करा"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                    <span>व्हॉईस क्लोन</span>
                  </button>

                  {/* Speak Greeting */}
                  <button
                    type="button"
                    onClick={() => onSpeakGreeting(profile)}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                      isSpeaking
                        ? 'bg-purple-700 text-white animate-pulse'
                        : 'bg-purple-100 hover:bg-purple-200 text-purple-800'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isSpeaking ? 'बोलत आहे...' : 'ऐका'}</span>
                  </button>

                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => onSelectActiveProfile(profile.id)}
                      className="px-3.5 py-2 rounded-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer shadow-xs"
                    >
                      सक्रिय करा
                    </button>
                  )}

                  {profiles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteProfile(profile.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                      title="हटवा"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create OR Edit Profile */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                {editingProfileId ? <Pencil className="w-5 h-5 text-purple-700" /> : <UserPlus className="w-5 h-5 text-purple-700" />}
                <span>{editingProfileId ? 'प्रोफाइल एडिट करा (Edit Profile)' : 'नवीन कंपॅनियन प्रोफाइल तयार करा'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingProfileId(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Profile Avatar Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                अवतार / फोटो निवडा (Avatar Image)
              </label>

              {/* Current Preview */}
              <div className="flex items-center space-x-4 mb-3">
                <img
                  src={selectedAvatarUrl}
                  alt="Selected"
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-600 shadow-md"
                />
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    गॅलरीतून फोटो अपलोड करा
                  </button>
                  <p className="text-[10px] text-slate-400 mt-1">तुमच्या आवडत्या व्यक्तीचा प्रत्यक्ष फोटो लावा.</p>
                </div>
              </div>

              {/* Preset Avatars */}
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedAvatarUrl(preset.url);
                      setGender(preset.gender);
                    }}
                    className={`rounded-xl overflow-hidden aspect-square border-2 transition-transform cursor-pointer relative ${
                      selectedAvatarUrl === preset.url
                        ? 'border-purple-600 scale-105 shadow-md ring-2 ring-purple-300'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Name & Relationship */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  नाव (Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="उदा. आई, राहुल, प्रिती"
                  className="w-full text-xs px-3 py-2 border rounded-xl bg-slate-50 focus:outline-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  नातेसंबंध (Relationship)
                </label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="उदा. आई, मित्र, आजी, बहीण"
                  className="w-full text-xs px-3 py-2 border rounded-xl bg-slate-50 focus:outline-purple-600"
                  required
                />
              </div>
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  वय (Age)
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-xl bg-slate-50 focus:outline-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  लिंग (Gender)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setGender('Female');
                      setGeminiVoice('Kore');
                    }}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      gender === 'Female'
                        ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    स्त्री (Female)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGender('Male');
                      setGeminiVoice('Puck');
                    }}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      gender === 'Male'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    पुरुष (Male)
                  </button>
                </div>
              </div>
            </div>

            {/* Personality / Speaking Tone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                स्वभाव व बोलण्याची पद्धत (Personality & Persona)
              </label>
              <textarea
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                rows={2}
                className="w-full text-xs px-3 py-2 border rounded-xl bg-slate-50 focus:outline-purple-600"
                placeholder="उदा. अतिशय मायाळू, कौतुक करणारी, प्रेमळ किंवा बिनधास्त बोलणारा मित्र..."
              />
            </div>

            {/* Voice Pitch & Speed Configuration */}
            <div className="bg-purple-50/70 p-3 rounded-2xl border border-purple-100 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-700" />
                  आवाज ट्यूनिंग (Voice Settings)
                </span>
                <span className="text-[11px] font-mono text-purple-700">
                  Pitch: {voicePitch}x | Rate: {voiceRate}x
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-600 block mb-1">
                    आवाजाचा स्तर (Pitch - बारीक / जाड)
                  </span>
                  <input
                    type="range"
                    min="0.6"
                    max="1.5"
                    step="0.05"
                    value={voicePitch}
                    onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                    className="w-full accent-purple-700 cursor-pointer"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-600 block mb-1">
                    बोलण्याची गती (Speech Rate)
                  </span>
                  <input
                    type="range"
                    min="0.8"
                    max="1.3"
                    step="0.05"
                    value={voiceRate}
                    onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                    className="w-full accent-purple-700 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Custom Voice Sample Recording */}
            <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  प्रत्यक्ष आवाज सॅम्पल (Custom Voice Audio)
                </span>
                <span className="text-[10px] text-slate-500">
                  {customAudioUri ? '✅ ऑडिओ जोडलेला आहे' : 'स्वतःचा किंवा नातेवाईकाचा आवाज जोडा'}
                </span>
              </div>

              <button
                type="button"
                onClick={isRecordingSample ? stopRecording : startRecording}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ${
                  isRecordingSample
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-purple-100 hover:bg-purple-200 text-purple-800'
                }`}
              >
                {isRecordingSample ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>थांबवा (00:{recordDuration < 10 ? `0${recordDuration}` : recordDuration})</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>रेकॉर्ड करा</span>
                  </>
                )}
              </button>
            </div>

            {/* Submit & Cancel */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingProfileId(null);
                }}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
              >
                रद्द करा
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md transition-all cursor-pointer"
              >
                {editingProfileId ? 'बदल सेव्ह करा (Save Changes)' : 'नवीन प्रोफाइल जोडा'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};
