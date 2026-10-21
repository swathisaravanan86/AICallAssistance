export interface CallScenario {
  id: string;
  name: string;
  number: string;
  company?: string;
  tag: string;
  location: string;
  initialCallerUtterance: string;
  suggestedReplies: string[];
  avatarBg: string;
  initialRisk: number;
  isSavedContact?: boolean;
  callerGender?: 'male' | 'female';
}

export interface TranscriptItem {
  id: string;
  role: 'assistant' | 'caller' | 'system';
  text: string;
  timestamp: string;
}

export interface AISummaryData {
  summary: string;
  callerPurpose?: string;
  urgency: 'low' | 'medium' | 'high';
  category: string;
  spamRisk: number;
  suggestedAction: 'approve' | 'reject' | 'gather_more_info';
  keyDetails: string[];
  isRealAI: boolean;
}

export interface CallHistoryItem {
  id: string;
  callerName: string;
  callerNumber: string;
  callerTag: string;
  company?: string;
  date: string;
  durationSeconds: number;
  outcome: 'approved' | 'rejected' | 'missed';
  aiSummary: string;
  spamRisk: number;
  transcript: TranscriptItem[];
  category: string;
  isRealAI: boolean;
  urgency: 'low' | 'medium' | 'high';
}

export interface AssistantSettings {
  persona: 'professional' | 'friendly' | 'strict';
  speechAudioEnabled: boolean;
  autoRejectSpam: boolean;
  showPhoneFrame: boolean;
}
