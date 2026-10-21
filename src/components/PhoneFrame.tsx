import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Smartphone, Maximize2, ShieldCheck, Sparkles } from 'lucide-react';

interface PhoneFrameProps {
  children: React.ReactNode;
  isFramed: boolean;
  onToggleFrame: () => void;
  headerTitle?: string;
  isAiActive?: boolean;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  isFramed,
  onToggleFrame,
  headerTitle = 'AI Assistance',
  isAiActive = false,
}) => {
  const [time, setTime] = useState<string>('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start py-4 px-2 sm:px-6 relative overflow-x-hidden selection:bg-purple-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-900/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-900/20 rounded-full blur-[128px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-900/15 rounded-full blur-[128px]" />
      </div>

      {/* Top Web App Control Header */}
      <header className="w-full max-w-5xl flex items-center justify-between pb-4 mb-2 border-b border-slate-800/80 px-2 sm:px-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-purple-600/20">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Swathi's Assistance
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700/50">
                  Call Screening
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Interactive voice assistant screening prototype
            </p>
          </div>
        </div>

        {/* View toggle & prototype indicator */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300 font-medium">Safe Simulation</span>
          </div>

          <button
            onClick={onToggleFrame}
            title={isFramed ? 'Switch to Full Width Mode' : 'Switch to Phone Mockup'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors shadow-sm"
          >
            {isFramed ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden md:inline">Full Width</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden md:inline">Phone Frame</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container: either smartphone frame or wide responsive card */}
      <main
        className={`w-full transition-all duration-300 ${
          isFramed
            ? 'max-w-[420px] rounded-[48px] p-3 sm:p-3.5 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-[6px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(124,58,237,0.15)] relative'
            : 'max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-2xl p-4 sm:p-6'
        }`}
      >
        {isFramed ? (
          /* Phone Shell Inner Bezel */
          <div className="w-full bg-slate-950 rounded-[40px] overflow-hidden border border-slate-800/80 flex flex-col min-h-[760px] max-h-[860px] relative shadow-inner">
            {/* Dynamic Island / Notch */}
            <div className="w-full pt-3 px-6 pb-2 bg-slate-950/95 flex items-center justify-between text-xs font-medium text-slate-300 select-none z-30">
              <span className="font-semibold tracking-tight text-white">{time}</span>
              
              {/* Dynamic Island Pill */}
              <div
                className={`transition-all duration-300 flex items-center justify-center gap-2 rounded-full px-3 py-1 bg-black border border-slate-800/80 ${
                  isAiActive ? 'w-32 shadow-[0_0_12px_rgba(168,85,247,0.5)]' : 'w-24'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-indigo-500/80" />
                </div>
                {isAiActive ? (
                  <span className="text-[10px] text-purple-300 font-medium flex items-center gap-1 animate-pulse">
                    <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                    AI Active
                  </span>
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                )}
              </div>

              {/* Status Icons */}
              <div className="flex items-center gap-1.5 text-slate-300">
                <Wifi className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">5G</span>
                <Battery className="w-4 h-4 text-emerald-400 fill-emerald-400/30" />
              </div>
            </div>

            {/* Scrollable Phone Screen Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
              {children}
            </div>

            {/* Bottom Home Indicator Bar */}
            <div className="w-full py-2 bg-slate-950 flex justify-center items-center select-none pointer-events-none z-30">
              <div className="w-32 h-1 bg-slate-700/80 rounded-full" />
            </div>
          </div>
        ) : (
          /* Wide View Content */
          <div className="w-full flex flex-col">{children}</div>
        )}
      </main>

      {/* Safety & Telephony Notice */}
      <footer className="w-full max-w-md text-center mt-3 text-[11px] text-slate-500 px-4">
        <p className="flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Simulated Call Assistant: No actual cellular/SIM network access. Uses browser speech and Gemini AI services.
        </p>
      </footer>
    </div>
  );
};
