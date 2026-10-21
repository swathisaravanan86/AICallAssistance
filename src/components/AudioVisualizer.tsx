import React from 'react';

interface AudioVisualizerProps {
  state: 'speaking' | 'listening' | 'thinking' | 'idle';
  label?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ state, label }) => {
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isThinking = state === 'thinking';

  // Bar heights variation
  const bars = [14, 28, 42, 60, 48, 72, 38, 54, 30, 64, 45, 22, 16];

  return (
    <div className="flex flex-col items-center justify-center py-3">
      {/* Waveform container */}
      <div className="flex items-center justify-center gap-1.5 h-16 w-full px-4">
        {bars.map((defaultHeight, idx) => {
          let height = 6;
          let colorClass = 'bg-slate-700/60';
          let animDelay = `${(idx * 0.1).toFixed(2)}s`;

          if (isSpeaking) {
            height = defaultHeight;
            colorClass = idx % 2 === 0 
              ? 'bg-gradient-to-t from-purple-600 to-indigo-400 shadow-[0_0_12px_rgba(168,85,247,0.6)]'
              : 'bg-gradient-to-t from-violet-500 to-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.5)]';
          } else if (isListening) {
            height = Math.max(10, Math.sin(idx + 1) * 26 + 18);
            colorClass = 'bg-gradient-to-t from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
            animDelay = `${(idx * 0.08).toFixed(2)}s`;
          } else if (isThinking) {
            height = Math.max(8, (idx % 3 + 1) * 12);
            colorClass = 'bg-gradient-to-t from-amber-500 to-yellow-400 animate-pulse';
            animDelay = `${(idx * 0.15).toFixed(2)}s`;
          }

          return (
            <div
              key={idx}
              className={`w-1.5 rounded-full transition-all duration-300 ${colorClass}`}
              style={{
                height: isSpeaking || isListening ? `${height}px` : `${Math.max(6, height * 0.4)}px`,
                animation: isSpeaking || isListening ? `wave-bar 1.1s ease-in-out infinite` : undefined,
                animationDelay: animDelay,
              }}
            />
          );
        })}
      </div>

      {label && (
        <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full text-xs font-medium tracking-wide bg-slate-900/80 border border-slate-800 text-slate-300">
          <span
            className={`w-2 h-2 rounded-full ${
              isSpeaking
                ? 'bg-purple-400 animate-ping'
                : isListening
                ? 'bg-emerald-400 animate-pulse'
                : isThinking
                ? 'bg-amber-400 animate-bounce'
                : 'bg-slate-500'
            }`}
          />
          {label}
        </div>
      )}
    </div>
  );
};
