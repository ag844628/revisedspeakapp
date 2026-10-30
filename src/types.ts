export type Gender = 'Male' | 'Female';

export interface ClonedVoiceData {
  isCloned: boolean;
  baseAudioUri?: string | null;
  fundamentalPitch: number; // in Hz or relative pitch multiplier
  formantRatio: number;
  speechRate: number;
  sampleName: string;
  detectedGender: Gender;
  detectedTone: string;
}

export interface Profile {
  id: string;
  name: string;
  relationship: string;
  age: string;
  gender: Gender;
  personality: string;
  avatarUrl: string;
  voicePitch: number; // 0.5 to 1.5
  voiceRate: number; // 0.8 to 1.3
  geminiVoice: 'Kore' | 'Puck' | 'Zephyr' | 'Fenrir' | 'Charon';
  audioUri?: string | null;
  audioName?: string | null;
  clonedVoice?: ClonedVoiceData | null;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  profileId?: string;
  functionCalls?: Array<{
    name: string;
    args: any;
  }>;
  groundingSources?: Array<{
    title: string;
    url: string;
  }>;
}

export interface AlarmItem {
  id: string;
  timeString: string; // e.g. "07:30 AM"
  label: string;
  enabled: boolean;
  createdAt: number;
}

export interface TimerItem {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  completed: boolean;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  timestamp: string;
}

export interface DeviceState {
  flashlight: boolean;
  screenBrightness: number; // 10 to 100
  darkMode: boolean;
  volume: number; // 0 to 100
  isMuted: boolean;
  batteryLevel: number; // 0 to 100
  isCharging: boolean;
  locationInfo?: string | null;
}

export interface AppPermissionsState {
  microphone: 'granted' | 'denied' | 'prompt';
  camera: 'granted' | 'denied' | 'prompt';
  notifications: 'granted' | 'denied' | 'prompt';
  location: 'granted' | 'denied' | 'prompt';
  audio: 'granted' | 'denied' | 'prompt';
}

export interface SearchResultItem {
  query: string;
  summary: string;
  sources: Array<{ title: string; url: string }>;
  timestamp: string;
}
