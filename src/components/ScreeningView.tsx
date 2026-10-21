import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldAlert,
  ShieldCheck,
  Clock,
  User,
  Bot,
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  Play,
  Square,
  UserCheck,
  UserX,
  Globe,
} from 'lucide-react';
import { CallScenario, AISummaryData, AssistantSettings, TranscriptItem } from '../types';
import { AudioVisualizer } from './AudioVisualizer';

interface ScreeningViewProps {
  scenario: CallScenario;
  settings?: AssistantSettings;
  onApprove: (summary: AISummaryData, transcript: TranscriptItem[], duration: number) => void;
  onReject: (summary: AISummaryData, transcript: TranscriptItem[], duration: number) => void;
  onCancel: () => void;
}

export const ScreeningView: React.FC<ScreeningViewProps> = ({
  scenario,
  settings,
  onApprove,
  onReject,
  onCancel,
}) => {
  const [seconds, setSeconds] = useState<number>(0);
  const [callerInput, setCallerInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [visualizerState, setVisualizerState] = useState<'idle' | 'speaking' | 'listening' | 'thinking'>('listening');
  const [visualizerLabel, setVisualizerLabel] = useState<string>('Screening Call on Behalf of Swathi...');

  // User contact status toggle (defaults to scenario.isSavedContact, default true for saved contacts like Madhu)
  const [isSavedContact, setIsSavedContact] = useState<boolean>(
    scenario.isSavedContact !== undefined ? scenario.isSavedContact : true
  );

  // Dynamic Caller Synthetic Voice: dynamically initialized from activeScenario metadata ('male' or 'female')
  const metadataGender: 'male' | 'female' = scenario.callerGender || 'male';
  const [simulatedGender, setSimulatedGender] = useState<'male' | 'female'>(metadataGender);

  // Keep simulated caller voice in sync if activeScenario metadata changes
  useEffect(() => {
    if (scenario.callerGender) {
      setSimulatedGender(scenario.callerGender);
    }
  }, [scenario.callerGender, scenario.id]);

  // Audio Voice output settings
  const [audioVoiceEnabled, setAudioVoiceEnabled] = useState<boolean>(
    settings ? settings.speechAudioEnabled : true
  );
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Initial greeting determined by whether the contact is saved in Swathi's phone
  const initialGreeting = isSavedContact
    ? `Hello ${scenario.name}, this is Swathi's Assistance screening this call on behalf of Swathi. How can she help you today?`
    : `Hello, this is Swathi's Assistance screening this call on behalf of Swathi. May I know who is calling and the purpose of your call?`;

  const [transcript, setTranscript] = useState<TranscriptItem[]>([
    {
      id: 't-init',
      role: 'assistant',
      text: initialGreeting,
      timestamp: '00:00',
    },
  ]);

  const [summaryData, setSummaryData] = useState<AISummaryData>({
    summary: isSavedContact
      ? `Saved Contact ${scenario.name} calling Swathi. Swathi's Assistance is screening.`
      : `Incoming call from ${scenario.number}. Swathi's Assistance is gathering details.`,
    callerPurpose: isSavedContact
      ? `Saved Contact ${scenario.name} calling Swathi.`
      : `Incoming call from ${scenario.number}.`,
    urgency: 'medium',
    category: 'general',
    spamRisk: scenario.initialRisk,
    suggestedAction: 'gather_more_info',
    keyDetails: [
      isSavedContact ? `Saved contact: ${scenario.name}` : 'Unknown incoming number',
      `Caller voice: Synthetic ${simulatedGender === 'male' ? 'Male' : 'Female'}`,
      'Supports Thanglish, English, Tamil & Hindi',
    ],
    isRealAI: false,
  });

  // Speech Recognition (Microphone input from user acting as caller)
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Call timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Pre-load Web Speech API voices
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Web Speech synthesis helper for Caller:
  // Dynamically switches between synthetic male and female voices based on simulatedGender (from activeScenario metadata)
  const speakCallerVoice = (
    text: string,
    options?: {
      id?: string;
      onEnd?: () => void;
    }
  ) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      options?.onEnd?.();
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();

      if (!audioVoiceEnabled && !options?.id) {
        options?.onEnd?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;

      const voices = window.speechSynthesis.getVoices();
      const isTamilScript = /[\u0B80-\u0BFF]/.test(text);
      const isHindiScript = /[\u0900-\u097F]/.test(text);

      if (simulatedGender === 'male') {
        utterance.pitch = 0.88; // Lower, natural male pitch

        if (isTamilScript) {
          const tamilMale =
            voices.find((v) => v.lang.startsWith('ta') && /male|valluvar|mohan|google/i.test(v.name)) ||
            voices.find((v) => v.lang.startsWith('ta'));
          if (tamilMale) utterance.voice = tamilMale;
        } else if (isHindiScript) {
          const hindiMale =
            voices.find((v) => v.lang.startsWith('hi') && /male|rishi|neerja|hemant|madhav|google/i.test(v.name)) ||
            voices.find((v) => v.lang.startsWith('hi'));
          if (hindiMale) utterance.voice = hindiMale;
        } else {
          // Indian English male or standard synthetic male voice
          const indianMale = voices.find(
            (v) =>
              (v.lang === 'en-IN' || v.lang.startsWith('en_IN')) &&
              /male|rishi|ravi|prabhat|google/i.test(v.name)
          );
          const naturalMale =
            indianMale ||
            voices.find(
              (v) =>
                v.lang.startsWith('en') &&
                /male|david|alex|george|daniel|guy|mark|james|oliver|tom|fred/i.test(v.name) &&
                !/female|samantha|zira|victoria|karen|moira|fiona|tessa/i.test(v.name)
            ) ||
            voices.find((v) => v.lang.startsWith('en') && !/female|zira|samantha/i.test(v.name)) ||
            voices.find((v) => v.lang.startsWith('en'));

          if (naturalMale) utterance.voice = naturalMale;
        }
      } else {
        // Female voice for female callers (e.g. Dr. Emily Hayes, Elena Rostova)
        utterance.pitch = 1.05; // Natural synthetic female pitch

        if (isTamilScript) {
          const tamilFemale =
            voices.find((v) => v.lang.startsWith('ta') && /female|vani|priya|google/i.test(v.name)) ||
            voices.find((v) => v.lang.startsWith('ta'));
          if (tamilFemale) utterance.voice = tamilFemale;
        } else if (isHindiScript) {
          const hindiFemale =
            voices.find((v) => v.lang.startsWith('hi') && /female|swara|kalpana|google/i.test(v.name)) ||
            voices.find((v) => v.lang.startsWith('hi'));
          if (hindiFemale) utterance.voice = hindiFemale;
        } else {
          const indianFemale = voices.find(
            (v) =>
              (v.lang === 'en-IN' || v.lang.startsWith('en_IN')) &&
              /female|heera|veena|kavya|google/i.test(v.name)
          );
          const naturalFemale =
            indianFemale ||
            voices.find(
              (v) =>
                v.lang.startsWith('en') &&
                /samantha|zira|victoria|karen|moira|fiona|tessa|female/i.test(v.name)
            ) ||
            voices.find((v) => v.lang.startsWith('en') && /female/i.test(v.name)) ||
            voices.find((v) => v.lang.startsWith('en'));

          if (naturalFemale) utterance.voice = naturalFemale;
        }
      }

      const activeId = options?.id || 'caller-speaking';
      setSpeakingId(activeId);
      setVisualizerState('speaking');
      setVisualizerLabel(
        `${scenario.name} Speaking (Synthetic ${simulatedGender === 'male' ? 'Male' : 'Female'} Voice)...`
      );

      utterance.onstart = () => {
        setSpeakingId(activeId);
        setVisualizerState('speaking');
        setVisualizerLabel(
          `${scenario.name} Speaking (Synthetic ${simulatedGender === 'male' ? 'Male' : 'Female'} Voice)...`
        );
      };

      utterance.onend = () => {
        setSpeakingId(null);
        options?.onEnd?.();
      };

      utterance.onerror = () => {
        setSpeakingId(null);
        options?.onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Caller SpeechSynthesis error:', e);
      setSpeakingId(null);
      options?.onEnd?.();
    }
  };

  // Web Speech synthesis helper for Swathi's Assistance:
  // Strictly speaks in Swathi's Assistance Female Voice with multilingual pronunciation matching
  const speakAssistantVoice = (
    text: string,
    options?: {
      id?: string;
      onEnd?: () => void;
    }
  ) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      options?.onEnd?.();
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();

      if (!audioVoiceEnabled && !options?.id) {
        options?.onEnd?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;
      utterance.pitch = 1.05; // Pleasant female pitch

      const voices = window.speechSynthesis.getVoices();
      const isTamilScript = /[\u0B80-\u0BFF]/.test(text);
      const isHindiScript = /[\u0900-\u097F]/.test(text);

      if (isTamilScript) {
        const tamilVoice = voices.find((v) => v.lang.startsWith('ta'));
        if (tamilVoice) utterance.voice = tamilVoice;
      } else if (isHindiScript) {
        const hindiVoice = voices.find((v) => v.lang.startsWith('hi'));
        if (hindiVoice) utterance.voice = hindiVoice;
      } else {
        // English / Thanglish / Hinglish: Indian English female or pleasant natural female voice
        const indianFemale = voices.find(
          (v) =>
            (v.lang === 'en-IN' || v.lang.startsWith('en_IN')) &&
            /female|heera|veena|kavya|google/i.test(v.name)
        );
        const naturalFemale =
          indianFemale ||
          voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              /samantha|zira|victoria|karen|moira|fiona|tessa|female/i.test(v.name)
          ) ||
          voices.find(
            (v) => v.lang.startsWith('en') && /google\s+us\s+english/i.test(v.name)
          ) ||
          voices.find((v) => v.lang.startsWith('en'));

        if (naturalFemale) utterance.voice = naturalFemale;
      }

      const activeId = options?.id || 'ai-auto';
      setSpeakingId(activeId);
      setVisualizerState('speaking');
      setVisualizerLabel("Swathi's Assistance Speaking (Female Voice)...");

      utterance.onstart = () => {
        setSpeakingId(activeId);
        setVisualizerState('speaking');
        setVisualizerLabel("Swathi's Assistance Speaking (Female Voice)...");
      };

      utterance.onend = () => {
        setSpeakingId(null);
        setVisualizerState('listening');
        setVisualizerLabel('Listening for Caller (Microphone Ready)...');
        if (options?.onEnd) {
          options.onEnd();
        } else if (isSpeechRecognitionSupported) {
          startMicListening();
        }
      };

      utterance.onerror = () => {
        setSpeakingId(null);
        setVisualizerState('listening');
        setVisualizerLabel('Listening for Caller...');
        options?.onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
      setSpeakingId(null);
      options?.onEnd?.();
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      setVisualizerState('listening');
      setVisualizerLabel('Listening for Caller...');
    }
  };

  // Speak initial greeting once on load
  useEffect(() => {
    const timer = setTimeout(() => {
      speakAssistantVoice(initialGreeting, { id: 't-init' });
    }, 600);

    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
  }, []);

  // Web Speech Recognition Setup for microphone input
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSpeechRecognitionSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsMicActive(true);
        setVisualizerState('listening');
        setVisualizerLabel('Listening to Your Voice via Microphone...');
      };

      recognition.onresult = (event: any) => {
        let currentTranscriptText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscriptText += event.results[i][0].transcript;
        }
        if (currentTranscriptText) {
          setCallerInput(currentTranscriptText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsMicActive(false);
      };

      recognition.onend = () => {
        setIsMicActive(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startMicListening = () => {
    if (recognitionRef.current && !isMicActive) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        // Recognition might already be active
      }
    }
  };

  const stopMicListening = () => {
    if (recognitionRef.current && isMicActive) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Ignored
      }
    }
  };

  const handleToggleMic = () => {
    if (isMicActive) {
      stopMicListening();
    } else {
      stopSpeaking();
      startMicListening();
    }
  };

  const resetMicTranscript = () => {
    setCallerInput('');
  };

  // Sends the transcript to the AI server and evaluates dialogue
  const evaluateDialogue = async (currentTranscript: TranscriptItem[]) => {
    setIsProcessing(true);
    setVisualizerState('thinking');
    setVisualizerLabel("Swathi's Assistance Analyzing Caller Message...");

    try {
      const historyPayload = currentTranscript.map((t) => ({
        role: t.role,
        text: t.text,
      }));

      const latestCallerMsg =
        [...currentTranscript].reverse().find((t) => t.role === 'caller')?.text || '';

      const res = await fetch('/api/screen-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerName: scenario.name,
          callerNumber: scenario.number,
          callerTag: scenario.tag,
          isSavedContact,
          history: historyPayload,
          latestCallerMessage: latestCallerMsg,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to screen: ${res.statusText}`);
      }

      const data = await res.json();

      const newSummary: AISummaryData = {
        summary: data.summary || `Call from ${scenario.name}.`,
        callerPurpose: data.callerPurpose || `Purpose: ${latestCallerMsg || 'Inquiry'}`,
        urgency: data.urgency || 'medium',
        category: data.category || 'general',
        spamRisk: data.spamRisk !== undefined ? data.spamRisk : scenario.initialRisk,
        suggestedAction: data.suggestedAction || 'gather_more_info',
        keyDetails: data.keyDetails || [
          isSavedContact ? `Saved contact: ${scenario.name}` : 'Unknown incoming number',
          `Caller Voice: Synthetic ${simulatedGender === 'male' ? 'Male' : 'Female'}`,
          `Language: ${data.detectedLanguage || 'Auto-Detected'}`,
        ],
        isRealAI: data.isRealAI || false,
      };

      setSummaryData(newSummary);

      if (data.aiReply) {
        const replyId = `t-${Date.now()}-ai`;
        setTranscript((prev) => [
          ...prev,
          {
            id: replyId,
            role: 'assistant',
            text: data.aiReply,
            timestamp: formatTimer(seconds + 1),
          },
        ]);

        speakAssistantVoice(data.aiReply, {
          id: replyId,
          onEnd: () => {
            setVisualizerState('listening');
            setVisualizerLabel('Listening for Caller (Mic Ready)...');
            if (isSpeechRecognitionSupported) {
              startMicListening();
            }
          },
        });
      } else {
        setVisualizerState('listening');
        setVisualizerLabel('Listening for Caller...');
        if (isSpeechRecognitionSupported) {
          startMicListening();
        }
      }
    } catch (err) {
      console.error('Error evaluating dialogue:', err);
      setVisualizerState('listening');
      setVisualizerLabel('Listening for Caller...');
    } finally {
      setIsProcessing(false);
      resetMicTranscript();
    }
  };

  // Send a caller message:
  // Dynamically speaks the caller utterance using the synthetic male or female voice matching activeScenario metadata,
  // then triggers Swathi's Assistance to reply in her female voice!
  const handleSendCallerResponse = (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : callerInput).trim();
    if (!text || isProcessing) return;

    const callerItem: TranscriptItem = {
      id: `t-${Date.now()}-caller`,
      role: 'caller',
      text,
      timestamp: formatTimer(seconds),
    };

    const updated = [...transcript, callerItem];
    setTranscript(updated);
    setCallerInput('');

    // Speak caller utterance using synthetic male/female voice based on activeScenario metadata
    speakCallerVoice(text, {
      id: callerItem.id,
      onEnd: () => {
        // Once caller finishes speaking, AI assistant evaluates dialogue and replies in her female voice
        evaluateDialogue(updated);
      },
    });
  };

  const handleAskMoreInfo = () => {
    const promptId = `t-${Date.now()}-ai`;
    const promptText = isSavedContact
      ? `Could you give Swathi a bit more detail so I can inform her right away?`
      : `May I have your name and the details of your inquiry for Swathi?`;

    setTranscript((prev) => [
      ...prev,
      {
        id: promptId,
        role: 'assistant',
        text: promptText,
        timestamp: formatTimer(seconds),
      },
    ]);

    speakAssistantVoice(promptText, {
      id: promptId,
      onEnd: () => {
        setVisualizerState('listening');
        setVisualizerLabel('Listening for Caller Details...');
        if (isSpeechRecognitionSupported) {
          startMicListening();
        }
      },
    });
  };

  const latestAssistantMessage = [...transcript].reverse().find((t) => t.role === 'assistant');
  const latestCallerMessage = [...transcript].reverse().find((t) => t.role === 'caller');

  return (
    <div className="flex-1 flex flex-col justify-between bg-gradient-to-b from-[#090d1a] via-[#0d1326] to-[#060913] text-white p-3 sm:p-4 select-none relative">
      {/* Top Screening Bar: Caller Info, Timer & Voice Status Badges */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 mb-2 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Return to Incoming Call"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-xs font-bold tracking-wider uppercase text-purple-300">
                Swathi's AI Call Screening
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-800">
            <Clock className="w-3 h-3 text-purple-400" />
            <span>{formatTimer(seconds)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Voice Output Toggle */}
            <button
              onClick={() => {
                const next = !audioVoiceEnabled;
                setAudioVoiceEnabled(next);
                if (!next && typeof window !== 'undefined' && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                  setSpeakingId(null);
                }
              }}
              title={audioVoiceEnabled ? 'Voice Output Enabled (Click to Mute)' : 'Voice Output Muted (Click to Enable)'}
              className={`p-1.5 rounded-lg border transition-all text-xs flex items-center gap-1 ${
                audioVoiceEnabled
                  ? 'bg-purple-950/90 border-purple-500 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
              }`}
            >
              {audioVoiceEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Caller Info & Dynamic Voice Badges */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-2 truncate">
            <div
              className={`w-7 h-7 rounded-full bg-gradient-to-tr ${scenario.avatarBg} flex items-center justify-center text-white text-[11px] font-bold shadow`}
            >
              {scenario.name.slice(0, 1)}
            </div>
            <div className="truncate">
              <span className="font-semibold text-white mr-1.5">{scenario.name}</span>
              <span className="text-slate-400 text-[11px] font-mono">{scenario.number}</span>
            </div>
          </div>

          {/* Dynamic Badges: Saved Contact, Dynamic Caller Voice (Male/Female), Language Auto-Mirror, Female AI Voice */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Saved Contact Toggle */}
            <button
              onClick={() => setIsSavedContact(!isSavedContact)}
              title="Click to toggle Saved Contact status"
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                isSavedContact
                  ? 'bg-blue-950/90 text-blue-300 border-blue-600/80 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
            >
              {isSavedContact ? (
                <>
                  <UserCheck className="w-3 h-3 text-blue-400" />
                  <span>Saved Contact</span>
                </>
              ) : (
                <>
                  <UserX className="w-3 h-3 text-slate-400" />
                  <span>Unsaved Caller</span>
                </>
              )}
            </button>

            {/* Dynamic Synthetic Caller Voice Badge (Switches between Male and Female based on activeScenario metadata) */}
            <button
              onClick={() => setSimulatedGender((prev) => (prev === 'male' ? 'female' : 'male'))}
              title={`Simulated contact's voice: dynamically initialized from activeScenario metadata (${scenario.callerGender || 'male'}). Click to toggle.`}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                simulatedGender === 'male'
                  ? 'bg-cyan-950/90 text-cyan-300 border-cyan-600/80 hover:border-cyan-400 shadow-sm'
                  : 'bg-pink-950/90 text-pink-300 border-pink-600/80 hover:border-pink-400 shadow-sm'
              }`}
            >
              <User className="w-3 h-3" />
              <span>
                Caller Voice: Synthetic {simulatedGender === 'male' ? 'Male (♂)' : 'Female (♀)'}
              </span>
            </button>

            {/* Language Auto-Mirror Badge */}
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-600/60"
              title="AI dynamically speaks in caller's language: Thanglish, English, Tamil, Hindi"
            >
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>Language: Auto-Mirror</span>
            </div>

            {/* Female Assistant Voice Badge */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950/90 text-purple-300 border border-purple-700/60">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Swathi's AI (Female)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Waveform and AI Status */}
      <div className="bg-gradient-to-b from-[#1e1b4b]/30 via-slate-900/60 to-[#070b14] border border-purple-900/40 rounded-2xl p-2 mb-2 shadow-inner">
        <AudioVisualizer state={visualizerState} label={visualizerLabel} />

        {/* Live Audio Reader & Dynamic Voice Control Strip */}
        <div className="mt-1 flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px]">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Play Assistant Voice Button */}
            <button
              onClick={() => {
                if (speakingId) {
                  stopSpeaking();
                } else if (latestAssistantMessage) {
                  speakAssistantVoice(latestAssistantMessage.text, {
                    id: latestAssistantMessage.id,
                  });
                } else {
                  speakAssistantVoice("Swathi's Assistance is actively screening this call on behalf of Swathi.", {
                    id: 'fallback-voice',
                  });
                }
              }}
              className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all text-[10px] ${
                speakingId && speakingId.includes('ai')
                  ? 'bg-rose-900/80 text-rose-200 border border-rose-600'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm'
              }`}
            >
              {speakingId && speakingId.includes('ai') ? (
                <>
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span>Stop Assistant</span>
                </>
              ) : (
                <>
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Play Assistant Voice (Female)</span>
                </>
              )}
            </button>

            {/* Play Caller Voice Button */}
            <button
              onClick={() => {
                if (speakingId) {
                  stopSpeaking();
                } else if (latestCallerMessage) {
                  speakCallerVoice(latestCallerMessage.text, {
                    id: latestCallerMessage.id,
                  });
                } else {
                  speakCallerVoice(scenario.initialCallerUtterance, {
                    id: 'init-caller-voice',
                  });
                }
              }}
              className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all text-[10px] ${
                speakingId && speakingId.includes('caller')
                  ? 'bg-rose-900/80 text-rose-200 border border-rose-600'
                  : simulatedGender === 'male'
                  ? 'bg-cyan-700 hover:bg-cyan-600 text-white shadow-sm'
                  : 'bg-pink-700 hover:bg-pink-600 text-white shadow-sm'
              }`}
            >
              {speakingId && speakingId.includes('caller') ? (
                <>
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span>Stop Caller Voice</span>
                </>
              ) : (
                <>
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>
                    Play Caller Voice ({simulatedGender === 'male' ? 'Male ♂' : 'Female ♀'})
                  </span>
                </>
              )}
            </button>

            {/* Dynamic Voice Gender Quick Switcher */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
              <span className="text-[9px] text-slate-400 pl-1 font-medium">Caller:</span>
              <button
                onClick={() => setSimulatedGender('male')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5 transition-all ${
                  simulatedGender === 'male'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch caller synthetic voice to Male"
              >
                <span>♂ Male</span>
              </button>
              <button
                onClick={() => setSimulatedGender('female')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5 transition-all ${
                  simulatedGender === 'female'
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch caller synthetic voice to Female"
              >
                <span>♀ Female</span>
              </button>
            </div>
          </div>

          {/* Voice rate selector */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-[10px]">Speed:</span>
            {[0.9, 1.0, 1.15].map((rate) => (
              <button
                key={rate}
                onClick={() => setSpeechRate(rate)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  speechRate === rate
                    ? 'bg-purple-700 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Intelligence Summary Card */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900/90 to-indigo-950/40 rounded-2xl border border-purple-600/30 p-2.5 mb-2 shadow-md">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            <span className="text-xs font-bold text-white tracking-wide">
              Live AI Assessment for Swathi
            </span>
            {summaryData.isRealAI && (
              <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-600/80 px-1.5 py-0.2 rounded-full font-mono">
                Gemini 3.8 Flash
              </span>
            )}
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
              summaryData.urgency === 'high'
                ? 'bg-rose-950/90 text-rose-300 border-rose-600 animate-pulse'
                : summaryData.urgency === 'medium'
                ? 'bg-amber-950/90 text-amber-300 border-amber-600'
                : 'bg-emerald-950/90 text-emerald-300 border-emerald-600'
            }`}
          >
            {summaryData.urgency} Priority
          </span>
        </div>

        <p className="text-xs text-slate-200 font-medium leading-relaxed mb-2 bg-slate-950/70 p-2 rounded-xl border border-slate-800">
          {summaryData.callerPurpose}
        </p>

        {/* Spam Risk Meter */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              {summaryData.spamRisk > 50 ? (
                <ShieldAlert className="w-3 h-3 text-rose-400" />
              ) : (
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
              )}
              Spam Assessment
            </span>
            <span
              className={`font-bold font-mono ${
                summaryData.spamRisk > 50
                  ? 'text-rose-400'
                  : summaryData.spamRisk > 20
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {summaryData.spamRisk}% Risk
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                summaryData.spamRisk > 50
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : 'bg-gradient-to-r from-cyan-500 to-emerald-500'
              }`}
              style={{ width: `${Math.max(4, summaryData.spamRisk)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Conversation Transcript Stream */}
      <div className="flex-1 bg-slate-900/70 rounded-2xl border border-slate-800 p-2.5 mb-2 overflow-y-auto max-h-44 sm:max-h-52 space-y-2">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 pb-1 border-b border-slate-800/60 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-purple-400" />
            Live Screening Dialogue
          </span>
          <span className="text-purple-300">{transcript.length} turns</span>
        </div>

        {transcript.map((item) => {
          const isAI = item.role === 'assistant';
          const isItemSpeaking = speakingId === item.id;

          return (
            <div
              key={item.id}
              className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}
            >
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5 px-1">
                {isAI ? (
                  <>
                    <Bot className="w-3 h-3 text-purple-400" />
                    <span className="font-semibold text-purple-300">Swathi's Assistance</span>
                    <span className="text-[9px] text-purple-400/80 bg-purple-950 px-1 rounded border border-purple-800">
                      Female Voice
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-slate-300">{scenario.name}</span>
                    <span className={`text-[9px] px-1 rounded border font-mono ${
                      simulatedGender === 'male'
                        ? 'text-cyan-400/90 bg-cyan-950 border-cyan-800'
                        : 'text-pink-400/90 bg-pink-950 border-pink-800'
                    }`}>
                      {simulatedGender === 'male' ? 'Synthetic Male ♂' : 'Synthetic Female ♀'}
                    </span>
                    <User className="w-3 h-3 text-slate-400" />
                  </>
                )}
                <span className="text-slate-600 font-mono ml-1">{item.timestamp}</span>
              </div>

              <div
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-xs leading-relaxed transition-all ${
                  isAI
                    ? isItemSpeaking
                      ? 'bg-gradient-to-r from-purple-800 to-indigo-800 border-2 border-purple-400 text-white rounded-tl-sm shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                      : 'bg-gradient-to-r from-purple-900/80 to-indigo-900/80 border border-purple-700/50 text-purple-100 rounded-tl-sm'
                    : isItemSpeaking
                    ? simulatedGender === 'male'
                      ? 'bg-cyan-900/90 border-2 border-cyan-400 text-cyan-50 rounded-tr-sm shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                      : 'bg-pink-900/90 border-2 border-pink-400 text-pink-50 rounded-tr-sm shadow-[0_0_15px_rgba(236,72,153,0.5)]'
                    : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tr-sm'
                }`}
              >
                <div>{item.text}</div>

                {/* Per-message Read Aloud Audio Trigger */}
                <div className="mt-1.5 flex items-center justify-end gap-1">
                  {isAI ? (
                    <button
                      onClick={() => {
                        if (isItemSpeaking) {
                          stopSpeaking();
                        } else {
                          speakAssistantVoice(item.text, {
                            id: item.id,
                          });
                        }
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                        isItemSpeaking
                          ? 'bg-purple-600 text-white font-bold animate-pulse'
                          : 'bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white'
                      }`}
                      title="Read Swathi's Assistance reply aloud (Female voice)"
                    >
                      <Volume2
                        className={`w-3 h-3 ${
                          isItemSpeaking ? 'animate-bounce text-amber-300' : 'text-purple-300'
                        }`}
                      />
                      <span>{isItemSpeaking ? 'Speaking...' : 'Read Spoken Voice'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (isItemSpeaking) {
                          stopSpeaking();
                        } else {
                          speakCallerVoice(item.text, {
                            id: item.id,
                          });
                        }
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                        isItemSpeaking
                          ? simulatedGender === 'male'
                            ? 'bg-cyan-600 text-white font-bold animate-pulse'
                            : 'bg-pink-600 text-white font-bold animate-pulse'
                          : 'bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white'
                      }`}
                      title={`Play ${scenario.name}'s simulated voice (Synthetic ${simulatedGender === 'male' ? 'Male' : 'Female'})`}
                    >
                      <Volume2
                        className={`w-3 h-3 ${
                          isItemSpeaking
                            ? 'animate-bounce text-amber-300'
                            : simulatedGender === 'male'
                            ? 'text-cyan-300'
                            : 'text-pink-300'
                        }`}
                      />
                      <span>
                        {isItemSpeaking
                          ? 'Speaking...'
                          : `Play Caller Voice (${simulatedGender === 'male' ? 'Male ♂' : 'Female ♀'})`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-purple-300 italic py-1 px-2">
            <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            <span>Swathi's Assistance is formulating reply in matched language...</span>
          </div>
        )}
      </div>

      {/* CALLER SIMULATION / INTERACTIVE TEST BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 mb-2 shadow-lg space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-semibold text-slate-300">
          <span>Test Caller Utterance (Dynamic Synthetic {simulatedGender === 'male' ? 'Male' : 'Female'} Voice):</span>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <Globe className="w-3 h-3" />
            <span>Thanglish, English, Tamil & Hindi Ready</span>
          </span>
        </div>

        {/* Multilingual Quick Prompt Chips (Thanglish, English, Tamil, Hindi) */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {/* Thanglish Delivery Test Chip */}
          <button
            onClick={() => handleSendCallerResponse("Vanakkam, naan Madhu pesuren. Delivery pathi call pannen.")}
            disabled={isProcessing}
            className="px-2.5 py-1 rounded-lg text-[11px] bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/80 text-emerald-200 whitespace-nowrap transition-colors font-medium flex items-center gap-1"
            title="Test Thanglish delivery inquiry"
          >
            <span className="text-[9px] bg-emerald-800 text-white px-1 rounded font-bold">Thanglish</span>
            &ldquo;Vanakkam, naan Madhu. Delivery pathi call pannen.&rdquo;
          </button>

          {/* English Delivery Test Chip */}
          <button
            onClick={() => handleSendCallerResponse("Hi, I'm Madhu. I'm calling regarding delivery of product.")}
            disabled={isProcessing}
            className="px-2.5 py-1 rounded-lg text-[11px] bg-purple-950/80 hover:bg-purple-900 border border-purple-600/80 text-purple-200 whitespace-nowrap transition-colors font-medium flex items-center gap-1"
            title="Test English delivery inquiry"
          >
            <span className="text-[9px] bg-purple-800 text-white px-1 rounded font-bold">English</span>
            &ldquo;Hi, I'm Madhu. Calling regarding delivery of product.&rdquo;
          </button>

          {/* Thanglish Gate / Arrival Chip */}
          <button
            onClick={() => handleSendCallerResponse("Naan Madhu, main gate kitta parcel oda nikkuren.")}
            disabled={isProcessing}
            className="px-2.5 py-1 rounded-lg text-[11px] bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/80 text-cyan-200 whitespace-nowrap transition-colors flex items-center gap-1"
            title="Test Thanglish gate arrival"
          >
            <span className="text-[9px] bg-cyan-800 text-white px-1 rounded font-bold">Thanglish</span>
            &ldquo;Naan Madhu, gate kitta parcel oda nikkuren.&rdquo;
          </button>

          {/* Hindi / Hinglish Delivery Chip */}
          <button
            onClick={() => handleSendCallerResponse("Namaste, main Madhu bol raha hoon delivery ke liye.")}
            disabled={isProcessing}
            className="px-2.5 py-1 rounded-lg text-[11px] bg-amber-950/80 hover:bg-amber-900 border border-amber-600/80 text-amber-200 whitespace-nowrap transition-colors flex items-center gap-1"
            title="Test Hindi delivery message"
          >
            <span className="text-[9px] bg-amber-800 text-white px-1 rounded font-bold">Hindi</span>
            &ldquo;Namaste, main Madhu... delivery ke liye.&rdquo;
          </button>

          {/* Tamil Script Chip */}
          <button
            onClick={() => handleSendCallerResponse("வணக்கம், நான் மாது பேசுகிறேன் டெலிவரி விஷயமாக.")}
            disabled={isProcessing}
            className="px-2.5 py-1 rounded-lg text-[11px] bg-teal-950/80 hover:bg-teal-900 border border-teal-600/80 text-teal-200 whitespace-nowrap transition-colors flex items-center gap-1"
            title="Test Tamil script message"
          >
            <span className="text-[9px] bg-teal-800 text-white px-1 rounded font-bold">தமிழ்</span>
            &ldquo;வணக்கம், நான் மாது பேசுகிறேன்...&rdquo;
          </button>

          {/* English Simple Name Intro Chip */}
          <button
            onClick={() => handleSendCallerResponse("I'm Madhu.")}
            disabled={isProcessing}
            className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 whitespace-nowrap transition-colors"
          >
            &ldquo;I'm Madhu.&rdquo;
          </button>

          {/* Thanglish Intro Chip */}
          <button
            onClick={() => handleSendCallerResponse("Naan Madhu.")}
            disabled={isProcessing}
            className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 whitespace-nowrap transition-colors"
          >
            &ldquo;Naan Madhu.&rdquo;
          </button>

          {scenario.suggestedReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => handleSendCallerResponse(reply)}
              disabled={isProcessing}
              className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 whitespace-nowrap transition-colors text-left truncate max-w-[210px] disabled:opacity-50"
              title={reply}
            >
              &ldquo;{reply}&rdquo;
            </button>
          ))}
        </div>

        {/* Freeform text input & Mic */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendCallerResponse();
          }}
          className="flex items-center gap-2"
        >
          {isSpeechRecognitionSupported && (
            <button
              type="button"
              onClick={handleToggleMic}
              title={isMicActive ? 'Stop Caller Microphone' : 'Speak as Caller via Microphone'}
              className={`p-2 rounded-xl border transition-all text-xs flex items-center justify-center ${
                isMicActive
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              {isMicActive ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-purple-400" />}
            </button>
          )}

          <input
            type="text"
            value={callerInput}
            onChange={(e) => setCallerInput(e.target.value)}
            placeholder="Type in English, Thanglish (e.g. 'vanakkam madhu pesren'), Tamil, or Hindi..."
            disabled={isProcessing}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!callerInput.trim() || isProcessing}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 shadow-md transition-all active:scale-95 disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>

      {/* APPROVE & REJECT CONTROLS */}
      <div className="space-y-1.5 pt-0.5">
        <div className="grid grid-cols-2 gap-3">
          {/* Reject (Cut) */}
          <button
            onClick={() => onReject(summaryData, transcript, seconds)}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-rose-700 to-rose-900 hover:from-rose-600 hover:to-rose-800 border border-rose-500/60 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-950/60 transition-all duration-200 active:scale-[0.98]"
          >
            <XCircle className="w-4 h-4 text-rose-300" />
            <span>Cut / Reject Call</span>
          </button>

          {/* Approve (Attend) */}
          <button
            onClick={() => onApprove(summaryData, transcript, seconds)}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 border border-emerald-400/60 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/60 transition-all duration-200 active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>Attend Call</span>
          </button>
        </div>

        {/* Ask for more info button */}
        <button
          onClick={handleAskMoreInfo}
          disabled={isProcessing}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
        >
          <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
          <span>Ask Caller for More Details</span>
        </button>
      </div>
    </div>
  );
};
