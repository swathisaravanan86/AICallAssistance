import React, { useState } from 'react';
import {
  Phone,
  PhoneOff,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Building,
  User,
  SlidersHorizontal,
  PlusCircle,
  UserCheck,
  UserX,
  Globe,
} from 'lucide-react';
import { CallScenario } from '../types';
import { DEFAULT_SCENARIOS } from '../data/mockScenarios';

interface IncomingCallViewProps {
  scenario: CallScenario;
  onSelectScenario: (scenario: CallScenario) => void;
  onStartScreening: () => void;
  onAttend: () => void;
  onCut: () => void;
}

export const IncomingCallView: React.FC<IncomingCallViewProps> = ({
  scenario,
  onSelectScenario,
  onStartScreening,
  onAttend,
  onCut,
}) => {
  const [showScenarioDrawer, setShowScenarioDrawer] = useState<boolean>(false);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);

  // Custom scenario form state
  const [customName, setCustomName] = useState<string>('');
  const [customCompany, setCustomCompany] = useState<string>('');
  const [customNumber, setCustomNumber] = useState<string>('');
  const [customUtterance, setCustomUtterance] = useState<string>('');
  const [customIsSaved, setCustomIsSaved] = useState<boolean>(true);
  const [customGender, setCustomGender] = useState<'male' | 'female'>('male');
  const [customTag, setCustomTag] = useState<string>('Custom Caller');

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newScenario: CallScenario = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      company: customCompany.trim() || undefined,
      number: customNumber.trim() || '+1 (555) 789-0123',
      tag: customTag.trim() || (customIsSaved ? 'Saved Contact' : 'Incoming Call'),
      location: 'Local Region',
      initialCallerUtterance:
        customUtterance.trim() || `Hi, this is ${customName.trim()} calling for Swathi.`,
      suggestedReplies: [
        customUtterance.trim() || `Hi, this is ${customName.trim()}.`,
        'Can you update Swathi about this call?',
        'Please let Swathi know I reached out.',
      ],
      avatarBg: 'from-purple-600 to-pink-600',
      initialRisk: customIsSaved ? 2 : 15,
      isSavedContact: customIsSaved,
      callerGender: customGender,
    };

    onSelectScenario(newScenario);
    setShowCustomModal(false);
  };

  const fillMadhuTemplate = () => {
    setCustomName('Madhu');
    setCustomCompany('Express Product Delivery');
    setCustomNumber('+1 (555) 438-9201');
    setCustomUtterance("Hi, I'm Madhu. I'm calling regarding delivery of product.");
    setCustomIsSaved(true);
    setCustomGender('male');
    setCustomTag('Saved Contact • Delivery');
  };

  const isHighRisk = scenario.initialRisk > 50;
  const isSavedContact = scenario.isSavedContact !== false;

  return (
    <div className="flex-1 flex flex-col justify-between bg-gradient-to-b from-[#0a0f1d] via-[#0d1428] to-[#060913] text-white p-4 sm:p-6 relative select-none">
      {/* Top Header with Simulated Scenario Selector Pill */}
      <div className="flex flex-col items-center w-full z-10">
        <div className="flex items-center justify-between w-full mb-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold tracking-wider uppercase text-[10px] text-slate-300">
              Swathi's Phone Line
            </span>
          </div>

          <button
            onClick={() => setShowScenarioDrawer(!showScenarioDrawer)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-purple-500/30 text-purple-200 hover:text-white hover:border-purple-400 transition-all text-xs font-medium shadow-sm backdrop-blur-md"
          >
            <SlidersHorizontal className="w-3 h-3 text-purple-400" />
            <span>Caller: {scenario.name}</span>
            <span className="text-[10px] text-purple-400">▼</span>
          </button>
        </div>

        {/* Scenario Drawer (Accordion) */}
        {showScenarioDrawer && (
          <div className="w-full mt-2 p-2.5 rounded-2xl bg-slate-900/95 border border-purple-900/50 shadow-2xl backdrop-blur-md animate-fade-in z-20">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2 px-1">
              <span>Choose Simulated Caller:</span>
              <button
                onClick={() => {
                  setShowCustomModal(true);
                  setShowScenarioDrawer(false);
                }}
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <PlusCircle className="w-3 h-3" />
                Custom Caller
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {DEFAULT_SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onSelectScenario(s);
                    setShowScenarioDrawer(false);
                  }}
                  className={`p-2 rounded-xl text-left border transition-all text-xs ${
                    s.id === scenario.id
                      ? 'bg-purple-600/30 border-purple-500 text-white font-semibold shadow-sm'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="truncate font-medium flex items-center justify-between">
                    <span>{s.name}</span>
                    <span className="text-[9px] text-purple-300 font-mono">
                      {s.isSavedContact !== false ? 'Saved' : 'Unsaved'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{s.tag}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Caller Profile View (Android Phone UI) */}
      <div className="flex-1 flex flex-col items-center justify-center my-3 text-center">
        {/* Pulsing Avatar with Android Ripple Radiance */}
        <div className="relative mb-4">
          {/* Animated Wave Rings */}
          <div className="absolute -inset-4 rounded-full border-2 border-purple-500/30 animate-ping opacity-50" />
          <div className="absolute -inset-8 rounded-full border border-indigo-500/20 animate-pulse" />
          <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 blur-md opacity-40" />

          {/* Avatar Disc */}
          <div
            className={`w-24 h-24 rounded-full bg-gradient-to-tr ${scenario.avatarBg} flex items-center justify-center text-white text-3xl font-bold shadow-2xl relative border-4 border-slate-900`}
          >
            {scenario.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')}
          </div>
        </div>

        {/* Caller Name */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
          {scenario.name}
        </h1>

        {/* Company / Subtitle */}
        {scenario.company && (
          <p className="text-xs sm:text-sm font-medium text-purple-300 flex items-center justify-center gap-1.5 mb-1">
            <Building className="w-3.5 h-3.5 text-purple-400" />
            {scenario.company}
          </p>
        )}

        {/* Monospace Phone Number */}
        <p className="text-base sm:text-lg font-mono font-semibold text-slate-300 tracking-wider mb-2.5">
          {scenario.number}
        </p>

        {/* Badges: Saved Contact, Female AI Voice & Multilingual Auto-Mirror */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {/* Contact Saved Status Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              isSavedContact
                ? 'bg-blue-950/80 border-blue-600/70 text-blue-300'
                : 'bg-slate-900 border-slate-700 text-slate-400'
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
                <span>Unsaved Contact</span>
              </>
            )}
          </span>

          {/* AI Voice Badge */}
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-950/80 border border-purple-700/60 text-purple-300">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>AI Voice: Swathi's Assistance (Female)</span>
          </span>

          {/* Multilingual Support Badge */}
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 border border-emerald-700/60 text-emerald-300">
            <Globe className="w-3 h-3 text-emerald-400" />
            <span>Auto-Mirror: Thanglish &bull; English &bull; Tamil &bull; Hindi</span>
          </span>

          {/* Security / Verification Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              isHighRisk
                ? 'bg-rose-950/80 border-rose-700/80 text-rose-300'
                : 'bg-emerald-950/80 border-emerald-700/80 text-emerald-300'
            }`}
          >
            {isHighRisk ? (
              <ShieldAlert className="w-3 h-3 text-rose-400" />
            ) : (
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
            )}
            {scenario.tag}
          </span>
        </div>

        {/* Incoming Call Banner */}
        <div className="mt-4 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
          <span>Incoming call ringing...</span>
        </div>
      </div>

      {/* THREE CORE CALL ACTION BUTTONS (Attend, Cut, Ask AI) */}
      <div className="w-full space-y-3 z-10">
        {/* Ask AI (Call Screening by Swathi's Assistance) */}
        <button
          onClick={onStartScreening}
          className="w-full relative group overflow-hidden py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-purple-950/80 border border-purple-400/40 transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2.5"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          <span>Ask AI (Screen Call on Behalf of Swathi)</span>
        </button>

        {/* Attend (Green) & Cut (Red) Action Buttons */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Cut / Reject Button (Red) */}
          <button
            onClick={onCut}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-700 to-rose-900 hover:from-rose-600 hover:to-rose-800 text-white font-bold text-sm shadow-lg shadow-rose-950/60 border border-rose-500/50 transition-all duration-200 active:scale-[0.98]"
          >
            <PhoneOff className="w-5 h-5 text-rose-200" />
            <span>Cut Call</span>
          </button>

          {/* Attend / Accept Button (Green) */}
          <button
            onClick={onAttend}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-950/60 border border-emerald-400/50 transition-all duration-200 active:scale-[0.98]"
          >
            <Phone className="w-5 h-5 text-emerald-200" />
            <span>Attend Call</span>
          </button>
        </div>
      </div>

      {/* Custom Caller Configuration Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" />
                Configure Simulated Caller
              </h3>
              <button
                type="button"
                onClick={fillMadhuTemplate}
                className="text-[10px] bg-purple-950 text-purple-300 border border-purple-700 px-2 py-0.5 rounded-lg hover:bg-purple-900"
              >
                Fill Madhu
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Configure caller name, saved status, and initial speech statement.
            </p>

            <form onSubmit={handleCreateCustom} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Caller Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Madhu"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Contact Status
                  </label>
                  <select
                    value={customIsSaved ? 'saved' : 'unsaved'}
                    onChange={(e) => setCustomIsSaved(e.target.value === 'saved')}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="saved">Saved Contact</option>
                    <option value="unsaved">Unsaved / Unknown</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Language Ready
                  </label>
                  <div className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <span>Auto-Mirror</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Initial Caller Statement (Any language)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Vanakkam, naan Madhu. Delivery pathi call pannen..."
                  value={customUtterance}
                  onChange={(e) => setCustomUtterance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-md shadow-purple-600/30"
                >
                  Save & Simulate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
