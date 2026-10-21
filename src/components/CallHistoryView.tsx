import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  RotateCcw,
  Trash2,
  Filter,
  PhoneIncoming,
  Bot,
  User,
} from 'lucide-react';
import { CallHistoryItem, CallScenario } from '../types';

interface CallHistoryViewProps {
  history: CallHistoryItem[];
  onBack: () => void;
  onReplayCaller: (callerItem: CallHistoryItem) => void;
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
}

export const CallHistoryView: React.FC<CallHistoryViewProps> = ({
  history,
  onBack,
  onReplayCaller,
  onClearHistory,
  onDeleteHistoryItem,
}) => {
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected' | 'spam'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(history[0]?.id || null);

  const filteredHistory = history.filter((item) => {
    // Filter by tab
    if (filter === 'approved' && item.outcome !== 'approved') return false;
    if (filter === 'rejected' && item.outcome !== 'rejected') return false;
    if (filter === 'spam' && item.spamRisk < 50) return false;

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.callerName.toLowerCase().includes(q);
      const matchNumber = item.callerNumber.toLowerCase().includes(q);
      const matchSummary = item.aiSummary.toLowerCase().includes(q);
      const matchTag = item.callerTag.toLowerCase().includes(q);
      return matchName || matchNumber || matchSummary || matchTag;
    }

    return true;
  });

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dialer</span>
        </button>

        <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
          <PhoneIncoming className="w-4 h-4 text-purple-400" />
          Screened Call Logs
        </h2>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search by caller, number, or summary..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-thin">
        {[
          { key: 'all', label: `All (${history.length})` },
          {
            key: 'approved',
            label: `Approved (${history.filter((h) => h.outcome === 'approved').length})`,
          },
          {
            key: 'rejected',
            label: `Rejected (${history.filter((h) => h.outcome === 'rejected').length})`,
          },
          {
            key: 'spam',
            label: `Spam (${history.filter((h) => h.spamRisk >= 50).length})`,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors border ${
              filter === tab.key
                ? 'bg-purple-600/30 text-purple-200 border-purple-500 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Call Logs List */}
      <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/50 border border-slate-800">
            <Filter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">No calls found</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Try adjusting your search query or simulate new incoming calls.
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isExpanded = expandedId === item.id;
            const isApproved = item.outcome === 'approved';
            const isSpam = item.spamRisk >= 50;

            return (
              <div
                key={item.id}
                className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden transition-all shadow-md"
              >
                {/* Main Row / Summary Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-3 cursor-pointer hover:bg-slate-800/50 transition-colors flex items-start justify-between gap-2"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isApproved
                          ? 'bg-emerald-950 border border-emerald-700/80 text-emerald-300'
                          : 'bg-rose-950 border border-rose-700/80 text-rose-300'
                      }`}
                    >
                      {isApproved ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-xs truncate">
                          {item.callerName}
                        </span>
                        <span
                          className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${
                            isApproved
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {item.outcome}
                        </span>
                        {isSpam && (
                          <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                            Spam Risk {item.spamRisk}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                        <span>{item.callerNumber}</span>
                        <span>•</span>
                        <span>{item.date}</span>
                        <span>•</span>
                        <span>{formatDuration(item.durationSeconds)}</span>
                      </div>

                      {/* AI Summary Preview */}
                      <p className="text-xs text-slate-300 line-clamp-2 mt-1.5 leading-snug">
                        {item.aiSummary}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-slate-400 pt-1">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-purple-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Expanded Details: Full Transcript & Actions */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-800/80 space-y-3 bg-slate-950/60">
                    {/* Structured AI Analysis */}
                    <div className="bg-slate-900/90 rounded-xl p-2.5 border border-purple-900/40">
                      <div className="flex items-center justify-between text-[11px] font-bold text-purple-300 mb-1">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          Screening Analysis
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">
                          Category: {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200">{item.aiSummary}</p>
                    </div>

                    {/* Transcript Details */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                        Full Simulated Transcript
                      </span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {item.transcript.map((t) => (
                          <div
                            key={t.id}
                            className={`p-2 rounded-xl text-xs ${
                              t.role === 'assistant'
                                ? 'bg-purple-950/40 border border-purple-800/30 text-purple-200'
                                : 'bg-slate-800/70 border border-slate-700/50 text-slate-200'
                            }`}
                          >
                            <span className="font-semibold text-[10px] block text-slate-400 mb-0.5">
                              {t.role === 'assistant' ? 'AI Assistant' : item.callerName} ({t.timestamp}):
                            </span>
                            {t.text}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <button
                        onClick={() => onDeleteHistoryItem(item.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete Record
                      </button>

                      <button
                        onClick={() => onReplayCaller(item)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Re-test This Caller</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
