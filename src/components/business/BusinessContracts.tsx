import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DealContract, ConnectionLog } from '../../types';
import {
  FileText,
  Lock,
  CheckCircle,
  ExternalLink,
  MessageSquare,
  Send,
  Download,
  Clock,
  ShieldCheck,
  ChevronRight,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { DigitalContractModal } from '../contracts/DigitalContractModal';

export const BusinessContracts: React.FC = () => {
  const {
    currentDealer,
    contracts,
    connections,
    approveAndReleaseEscrow,
    sendMessage,
  } = useApp();

  const [activeSection, setActiveSection] = useState<'contracts' | 'contacts'>('contracts');
  const [selectedContract, setSelectedContract] = useState<DealContract | null>(null);
  const [selectedConnId, setSelectedConnId] = useState<string>(() => connections[0]?.id || '');
  const [chatInput, setChatInput] = useState('');

  // Filter contracts for this dealer
  const dealerContracts = contracts.filter(c => c.dealerId === currentDealer.id);
  const dealerConnections = connections.filter(c => c.dealerId === currentDealer.id);
  const activeConnection = dealerConnections.find(c => c.id === selectedConnId) || dealerConnections[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeConnection) return;
    sendMessage(activeConnection.id, chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-600" />
              Escrow & Communication Vault
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Contract Repository & Previous Connection Logs
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Audit locked milestone payments, review submitted creator proofs, release payouts, and review past brand communication histories.
          </p>
        </div>

        {/* Segmented Sub-Nav */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveSection('contracts')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'contracts'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Digital Contracts ({dealerContracts.length})</span>
          </button>
          <button
            onClick={() => setActiveSection('contacts')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'contacts'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Message Logs ({dealerConnections.length})</span>
          </button>
        </div>
      </div>

      {activeSection === 'contracts' && (
        <div className="space-y-4">
          {dealerContracts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800">No active contracts drafted yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Navigate to the Creator Recommendations tab to select a verified creator and launch your first digital escrow agreement.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dealerContracts.map(contract => {
                const isSubmitted = contract.escrowStatus === 'DELIVERABLE_SUBMITTED';
                const isReleased = contract.escrowStatus === 'APPROVED_PAYOUT_RELEASED';
                const isLocked = contract.escrowStatus === 'ESCROW_FUNDED_ACTIVE';

                return (
                  <div
                    key={contract.id}
                    className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-4"
                  >
                    {/* Top Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {contract.id}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs font-medium text-slate-600">
                            {contract.campaignTitle}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Creator: <strong className="text-slate-900">{contract.creatorName}</strong> ({contract.creatorHandle})
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Escrow Fee</span>
                          <span className="font-mono text-base font-bold text-slate-900 tabular-nums">
                            ₹{contract.feeAmount.toLocaleString()} INR
                          </span>
                        </div>

                        <div>
                          {isReleased ? (
                            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Released
                            </span>
                          ) : isSubmitted ? (
                            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-indigo-600" />
                              Proof Submitted
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5 text-amber-600" />
                              Funds Locked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Deliverable</span>
                        <span className="font-semibold text-slate-800 mt-0.5 block">{contract.deliverable}</span>
                        <p className="text-slate-500 text-[11px] mt-1 line-clamp-2">
                          {contract.terms.deliverableDescription}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Cryptographic Hash</span>
                        <span className="font-mono text-[11px] text-slate-700 break-all mt-0.5 block">
                          {contract.dealerSignature?.digitalHash}
                        </span>
                        <span className="text-emerald-700 text-[10px] flex items-center gap-1 mt-1">
                          <ShieldCheck className="w-3 h-3" />
                          Authorized on {contract.dealerSignature?.signedAt}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Milestones</span>
                        <div className="space-y-1 mt-1 text-[11px]">
                          {contract.milestones.map((m, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="truncate max-w-[140px] text-slate-600">{m.title}</span>
                              <span className={`font-mono text-[10px] ${m.status === 'Completed' ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                                {m.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Deliverable Proof Alert */}
                    {contract.submissionProof && (
                      <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-semibold text-indigo-950 flex items-center gap-1.5">
                            <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                            Submitted Deliverable Link for Verification
                          </div>
                          <a
                            href={contract.submissionProof.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-700 underline font-mono text-xs block mt-0.5"
                          >
                            {contract.submissionProof.url}
                          </a>
                          {contract.submissionProof.notes && (
                            <p className="text-slate-600 text-[11px] mt-0.5">
                              Note: &quot;{contract.submissionProof.notes}&quot;
                            </p>
                          )}
                        </div>

                        {!isReleased && (
                          <button
                            onClick={() => approveAndReleaseEscrow(contract.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer shrink-0 transition-colors"
                          >
                            Verify & Release ₹{contract.feeAmount.toLocaleString()} Escrow
                          </button>
                        )}
                      </div>
                    )}

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Created on {contract.createdAt} · Updated {contract.updatedAt}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedContract(contract)}
                          className="px-3 py-1.5 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-md bg-white hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Full Legal Contract</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Messaging Logs & Contacts Section */}
      {activeSection === 'contacts' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 min-h-[500px]">
          {/* Contacts Sidebar */}
          <div className="border-r border-slate-200 p-4 space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Connected Creators
            </span>
            {dealerConnections.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No past message connections.</p>
            ) : (
              dealerConnections.map(conn => {
                const isSelected = activeConnection?.id === conn.id;
                return (
                  <button
                    key={conn.id}
                    onClick={() => setSelectedConnId(conn.id)}
                    className={`w-full p-2.5 rounded-lg text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs truncate max-w-[140px]">
                        {conn.creatorName}
                      </span>
                      <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        {conn.lastMessageTime}
                      </span>
                    </div>
                    <div className={`text-[11px] font-mono ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {conn.creatorHandle}
                    </div>
                    <p className={`text-[11px] truncate mt-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {conn.lastMessage}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {/* Active Chat Area */}
          <div className="md:col-span-2 flex flex-col justify-between p-4 bg-slate-50">
            {activeConnection ? (
              <>
                <div className="border-b border-slate-200 pb-3 mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {activeConnection.creatorName}
                    </h3>
                    <div className="text-xs text-slate-500 font-mono">
                      {activeConnection.creatorHandle} · Campaign: {activeConnection.campaignTitle || 'General Inquiry'}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {activeConnection.status}
                  </span>
                </div>

                {/* Message Stream */}
                <div className="flex-1 overflow-y-auto space-y-3 p-2 text-xs">
                  {activeConnection.messages.map(msg => {
                    const isDealer = msg.senderRole === 'business';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isDealer ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md p-3 rounded-lg shadow-2xs ${
                            isDealer
                              ? 'bg-slate-900 text-white rounded-br-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                          }`}
                        >
                          <p>{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {msg.timestamp}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-200 flex gap-2">
                  <input
                    type="text"
                    placeholder="Type message, terms clarification, or feedback..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                Select a creator on the left to review communication logs.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contract Detail Modal */}
      {selectedContract && (
        <DigitalContractModal
          isOpen={true}
          onClose={() => setSelectedContract(null)}
          contract={selectedContract}
          mode="view"
        />
      )}
    </div>
  );
};
