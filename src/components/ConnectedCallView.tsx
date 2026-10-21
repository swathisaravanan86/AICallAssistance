import React, { useState, useEffect } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Grid,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CallScenario, AISummaryData } from '../types';

interface ConnectedCallViewProps {
  scenario: CallScenario;
  summary?: AISummaryData;
  initialDuration: number;
  onEndCall: (finalSeconds: number) => void;
}

export const ConnectedCallView: React.FC<ConnectedCallViewProps> = ({
  scenario,
  summary,
  initialDuration,
  onEndCall,
}) => {
  const [seconds, setSeconds] = useState(initialDuration);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showKeypad, setShowKeypad] = useState(false);
  const [dialedDigits, setDialedDigits] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDigit = (digit: string) => {
    setDialedDigits((prev) => prev + digit);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-gradient-to-b from-[#070b14] via-[#0b1120] to-[#070b14] text-white relative select-none">
      {/* Top Connected Status */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-semibold shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Call Attended (Simulated Audio)</span>
        </div>
        <p className="text-slate-400 text-xs font-mono flex items-center justify-center gap-1">
          <Clock className="w-3 h-3 text-purple-400" />
          {formatTimer(seconds)}
        </p>
      </div>

      {/* Caller Info */}
      <div className="flex flex-col items-center justify-center text-center my-4">
        <div
          className={`w-24 h-24 rounded-full bg-gradient-to-tr ${scenario.avatarBg} flex items-center justify-center text-white text-3xl font-bold shadow-2xl border-4 border-slate-900 mb-3`}
        >
          {scenario.name.slice(0, 2)}
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">{scenario.name}</h2>
        {scenario.company && (
          <p className="text-xs text-purple-300 font-medium">{scenario.company}</p>
        )}
        <p className="text-sm text-slate-400 font-mono mt-0.5">{scenario.number}</p>

        {/* AI Screening Summary Pill if screened */}
        {summary && summary.summary && (
          <div className="mt-4 p-3 rounded-2xl bg-purple-950/40 border border-purple-800/40 max-w-xs text-left backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-300 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Screened Purpose:
            </div>
            <p className="text-xs text-slate-200 leading-snug">{summary.summary}</p>
          </div>
        )}
      </div>

      {/* Simulated Keypad Modal if opened */}
      {showKeypad ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 mb-4">
          <div className="text-center font-mono text-xl font-bold tracking-widest text-purple-300 mb-2 h-7">
            {dialedDigits || '—'}
          </div>
          <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((d) => (
              <button
                key={d}
                onClick={() => handleDigit(d)}
                className="py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-slate-200 transition-colors"
              >
                {d}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowKeypad(false)}
            className="w-full mt-2.5 text-xs text-slate-400 hover:text-slate-200 text-center"
          >
            Hide Keypad
          </button>
        </div>
      ) : (
        /* In-call controls */
        <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto mb-6">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
              isMuted
                ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5 mb-1 text-amber-400" /> : <Mic className="w-5 h-5 mb-1" />}
            <span className="text-[10px] font-medium">{isMuted ? 'Muted' : 'Mute'}</span>
          </button>

          <button
            onClick={() => setShowKeypad(true)}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-all"
          >
            <Grid className="w-5 h-5 mb-1 text-purple-400" />
            <span className="text-[10px] font-medium">Keypad</span>
          </button>

          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
              isSpeakerOn
                ? 'bg-purple-950/80 border-purple-600 text-purple-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {isSpeakerOn ? <Volume2 className="w-5 h-5 mb-1 text-purple-300" /> : <VolumeX className="w-5 h-5 mb-1" />}
            <span className="text-[10px] font-medium">{isSpeakerOn ? 'Speaker On' : 'Speaker'}</span>
          </button>
        </div>
      )}

      {/* Large Red Cut Button to End Call */}
      <div className="w-full pt-2">
        <button
          onClick={() => onEndCall(seconds)}
          className="w-full py-4 px-4 rounded-3xl bg-gradient-to-r from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 active:from-rose-700 active:to-rose-900 text-white font-extrabold flex items-center justify-center gap-2 shadow-xl shadow-rose-950/60 border border-rose-400/40 transition-all active:scale-[0.98]"
        >
          <PhoneOff className="w-5 h-5 text-white" />
          <span>Cut Call (End)</span>
        </button>
      </div>
    </div>
  );
};
