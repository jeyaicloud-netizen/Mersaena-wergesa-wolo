export type CallDirection = 'incoming' | 'outgoing' | 'missed';

export interface CallLog {
  id: string;
  name?: string;
  number: string;
  direction: CallDirection;
  timestamp: string;
  timeAgo: string;
  dateGroup: 'Today' | 'Yesterday' | 'Older';
  carrier: string;
  count?: number;
  hasRecording?: boolean;
  avatarLetter?: string;
  avatarColor?: string;
  durationSeconds?: number;
}

export interface Contact {
  id: string;
  name: string;
  number: string;
  avatarLetter: string;
  avatarColor: string;
  type?: 'Mobile' | 'Work' | 'Home';
}

export interface SimConfig {
  id: number;
  name: string;
  color: string;
  badgeBg: string;
}

export interface ActiveCallState {
  number: string;
  name?: string;
  carrier: string;
  status: 'calling' | 'connected' | 'ended';
  seconds: number;
  isMuted: boolean;
  isSpeaker: boolean;
  isRecording: boolean;
  recordingSavedToast: boolean;
  inCallKeypadOpen: boolean;
  simId: number;
}
