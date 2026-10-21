import React from 'react';
import { X, Bot, Volume2, ShieldCheck, UserCheck, Sparkles, Sliders } from 'lucide-react';
import { AssistantSettings } from '../types';

interface SettingsModalProps {
  settings: AssistantSettings;
  onUpdateSettings: (newSettings: Partial<AssistantSettings>) => void;
  onClose: () => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  onResetData,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Assistant Preferences</h3>
            <p className="text-[11px] text-slate-400">Customize AI screening behavior</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Persona Style */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              Voice Persona Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'professional', label: 'Executive', desc: 'Direct & polite' },
                { id: 'friendly', label: 'Friendly', desc: 'Warm & casual' },
                { id: 'strict', label: 'Gatekeeper', desc: 'Firm & cautious' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => onUpdateSettings({ persona: p.id as any })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    settings.persona === p.id
                      ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold">{p.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Audio Read-Aloud Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-300">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Speech Voice Output</div>
                <div className="text-[10px] text-slate-400">Read AI responses aloud in browser</div>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ speechAudioEnabled: !settings.speechAudioEnabled })}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.speechAudioEnabled ? 'bg-purple-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.speechAudioEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto Reject High Risk Spam */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-950 border border-rose-700/60 flex items-center justify-center text-rose-300">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Auto-Block Severe Spam</div>
                <div className="text-[10px] text-slate-400">Auto-reject if scam risk &gt; 80%</div>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ autoRejectSpam: !settings.autoRejectSpam })}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.autoRejectSpam ? 'bg-purple-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.autoRejectSpam ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-2">
            <button
              onClick={() => {
                onResetData();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 transition-colors"
            >
              Reset to Sample Scenarios & Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
