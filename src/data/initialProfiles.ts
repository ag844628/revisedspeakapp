import { Profile } from '../types';

export const AVATAR_PRESETS = [
  {
    id: 'mom',
    label: 'आई (Mother)',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    gender: 'Female' as const,
  },
  {
    id: 'friend_male',
    label: 'मित्र (Friend - Male)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    gender: 'Male' as const,
  },
  {
    id: 'sister',
    label: 'बहीण / मैत्रीण (Sister / Female Friend)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    gender: 'Female' as const,
  },
  {
    id: 'grandma',
    label: 'आजी (Grandmother)',
    url: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=400&q=80',
    gender: 'Female' as const,
  },
  {
    id: 'brother',
    label: 'भाऊ (Brother)',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    gender: 'Male' as const,
  },
  {
    id: 'mentor',
    label: 'मार्गदर्शक / शिक्षक (Mentor)',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    gender: 'Male' as const,
  },
];

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'profile-1',
    name: 'आई (सुमित्रा)',
    relationship: 'आई (Mother)',
    age: '52',
    gender: 'Female',
    personality: 'अतिशय मायाळू, काळजीवाहू, प्रेमळ आणि घरच्यासारखा आधार देणारी. वेळोवेळी जेवणाची आणि आरोग्याची चौकशी करते.',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    voicePitch: 1.25,
    voiceRate: 1.0,
    geminiVoice: 'Kore',
    audioUri: null,
  },
  {
    id: 'profile-2',
    name: 'राहुल (मित्र)',
    relationship: 'जिगरी मित्र (Best Friend)',
    age: '25',
    gender: 'Male',
    personality: 'उत्साही, मनमोकळा, कामात तत्पर आणि हसमुख मित्र. नेहमी मदतीला तयार असतो आणि बिनधास्त बोलतो.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    voicePitch: 0.85,
    voiceRate: 1.05,
    geminiVoice: 'Puck',
    audioUri: null,
  },
  {
    id: 'profile-3',
    name: 'आजी (पार्वतीबाई)',
    relationship: 'आजी (Grandmother)',
    age: '72',
    gender: 'Female',
    personality: 'अनुभवी, मायेचा ओलावा देणारी, नेहमी आशीर्वाद देणारी आणि जुन्या आठवणी व हितगुज सांगणारी आजी.',
    avatarUrl: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=400&q=80',
    voicePitch: 1.1,
    voiceRate: 0.9,
    geminiVoice: 'Zephyr',
    audioUri: null,
  },
];

export const QUICK_VOICE_COMMANDS = [
  { label: '🔦 टॉर्च चालू करा', prompt: 'मोबाईलचा टॉर्च चालू करा' },
  { label: '⏰ अलार्म लावा', prompt: 'उद्या सकाळी 6:30 चा अलार्म लाव' },
  { label: '⏱️ 5 मिनिट टायमर', prompt: '5 मिनिटांचा टायमर लाव' },
  { label: '📝 किराणा नोट लिहा', prompt: 'नोट्स मध्ये लिहा: दूध, साखर आणि चहा पावडर आणणे' },
  { label: '🔋 बॅटरी तपासा', prompt: 'मोबाईलची बॅटरी किती टक्के आहे?' },
  { label: '📞 आईला फोन लाव', prompt: 'आईला फोन लाव' },
  { label: '💬 व्हॉट्सअ‍ॅप मेसेज', prompt: 'मित्राला व्हॉट्सअ‍ॅपवर मेसेज कर की मी 10 मिनिटात पोहोचतोय' },
  { label: '🔆 ब्राईटनेस वाढव', prompt: 'मोबाईलची ब्राईटनेस 80% कर' },
];
