import React, { useState } from 'react';
import { CallScenario, AISummaryData, TranscriptItem, AssistantSettings } from './types';
import { DEFAULT_SCENARIOS } from './data/mockScenarios';
import { PhoneFrame } from './components/PhoneFrame';
import { IncomingCallView } from './components/IncomingCallView';
import { ScreeningView } from './components/ScreeningView';
import { ConnectedCallView } from './components/ConnectedCallView';
import { PhoneOff, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';

type ActiveCallState = 'incoming' | 'screening' | 'connected' | 'call_cut';

export default function App() {
  // Active incoming caller scenario
  const [activeScenario, setActiveScenario] = useState<CallScenario>(DEFAULT_SCENARIOS[0]);

  // Main screen state
  const [callState, setCallState] = useState<ActiveCallState>('incoming');

  // Stored AI Summary
  const [activeSummary, setActiveSummary] = useState<AISummaryData>({
    summary: 'Evaluating caller purpose...',
    callerPurpose: 'Waiting for caller statement...',
    urgency: 'medium',
    category: 'general',
    spamRisk: 5,
    suggestedAction: 'gather_more_info',
    keyDetails: ['Incoming call received'],
    isRealAI: false,
  });

  const [screeningDuration, setScreeningDuration] = useState(0);

  // Settings
  const [settings, setSettings] = useState<AssistantSettings>({
    persona: 'professional',
    speechAudioEnabled: true,
    autoRejectSpam: false,
    showPhoneFrame: true,
  });

  // User feedback toast/banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3800);
  };

  // 1. ATTEND (Answer call directly)
  const handleAttend = () => {
    setActiveSummary({
      summary: 'Call attended directly by user without AI screening.',
      callerPurpose: 'Direct phone conversation answered.',
      urgency: 'medium',
      category: 'direct',
      spamRisk: activeScenario.initialRisk,
      suggestedAction: 'approve',
      keyDetails: ['Direct call attended'],
      isRealAI: false,
    });
    setScreeningDuration(0);
    setCallState('connected');
    showToast(`Call attended • Speaking with ${activeScenario.name}`);
  };

  // 2. CUT (Reject/end call directly from main screen)
  const handleCut = () => {
    setCallState('call_cut');
    showToast(`Call from ${activeScenario.name} rejected.`);
    setTimeout(() => {
      setCallState('incoming');
    }, 2200);
  };

  // 3. ASK AI (Start AI voice-assistant screening workflow)
  const handleStartAskAI = () => {
    setCallState('screening');
  };

  // Workflow: Approve & Attend from AI Screening
  const handleApproveScreening = (
    summary: AISummaryData,
    transcript: TranscriptItem[],
    durationSeconds: number
  ) => {
    setActiveSummary(summary);
    setScreeningDuration(durationSeconds);
    setCallState('connected');
    showToast(`Screening approved • Attending call with ${activeScenario.name}`);
  };

  // Workflow: Reject & Cut from AI Screening
  const handleRejectScreening = (
    summary: AISummaryData,
    transcript: TranscriptItem[],
    durationSeconds: number
  ) => {
    setCallState('call_cut');
    showToast(`AI Assistant dismissed caller and cut call.`);
    setTimeout(() => {
      setCallState('incoming');
    }, 2400);
  };

  // In-call: Cut active connected call
  const handleEndConnectedCall = (finalSeconds: number) => {
    setCallState('call_cut');
    showToast(`Call ended (${finalSeconds}s).`);
    setTimeout(() => {
      setCallState('incoming');
    }, 2000);
  };

  // Cycle to next simulated caller
  const handleNextCaller = () => {
    const currentIndex = DEFAULT_SCENARIOS.findIndex((s) => s.id === activeScenario.id);
    const nextIndex = (currentIndex + 1) % DEFAULT_SCENARIOS.length;
    setActiveScenario(DEFAULT_SCENARIOS[nextIndex]);
    setCallState('incoming');
    showToast(`Simulating new call from ${DEFAULT_SCENARIOS[nextIndex].name}`);
  };

  return (
    <PhoneFrame
      isFramed={settings.showPhoneFrame}
      onToggleFrame={() =>
        setSettings((prev) => ({ ...prev, showPhoneFrame: !prev.showPhoneFrame }))
      }
      isAiActive={callState === 'screening'}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-14 left-4 right-4 z-50 bg-gradient-to-r from-purple-700 to-indigo-800 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl border border-purple-400/40 flex items-center justify-between animate-fade-in backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-purple-200 hover:text-white font-bold ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. MAIN SCREEN: INCOMING CALL ASSISTANT (Exactly 3 Large Buttons: Attend, Cut, Ask AI) */}
      {callState === 'incoming' && (
        <IncomingCallView
          scenario={activeScenario}
          onSelectScenario={setActiveScenario}
          onStartScreening={handleStartAskAI}
          onAttend={handleAttend}
          onCut={handleCut}
        />
      )}

      {/* 2. ASK AI VOICE SCREENING WORKFLOW */}
      {callState === 'screening' && (
        <ScreeningView
          scenario={activeScenario}
          settings={settings}
          onApprove={handleApproveScreening}
          onReject={handleRejectScreening}
          onCancel={() => setCallState('incoming')}
        />
      )}

      {/* 3. CONNECTED SIMULATED CALL VIEW */}
      {callState === 'connected' && (
        <ConnectedCallView
          scenario={activeScenario}
          summary={activeSummary}
          initialDuration={screeningDuration}
          onEndCall={handleEndConnectedCall}
        />
      )}

      {/* 4. CALL CUT / REJECTED INTERMEDIATE STATE */}
      {callState === 'call_cut' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#070b14] via-[#0b1120] to-[#070b14] text-center select-none">
          <div className="w-24 h-24 rounded-full bg-rose-950/80 border-2 border-rose-600/70 flex items-center justify-center text-rose-400 mb-4 shadow-2xl animate-pulse">
            <PhoneOff className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-1">Call Ended</h2>
          <p className="text-xs text-rose-300 font-medium mb-4">
            Simulated call with {activeScenario.name} was cut.
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>Ready for next incoming call</span>
          </div>

          <div className="mt-8">
            <button
              onClick={handleNextCaller}
              className="px-4 py-2 rounded-2xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-200 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
              <span>Simulate Another Caller</span>
            </button>
          </div>
        </div>
      )}
    </PhoneFrame>
  );
}
