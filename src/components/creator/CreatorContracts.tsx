import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DealContract, ConnectionLog } from '../../types';
import {
  FileText,
  Lock,
  CheckCircle,
  Clock,
  Send,
  ExternalLink,
  ShieldCheck,
  Building2,
  DollarSign,
  UploadCloud,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { DigitalContractModal } from '../contracts/DigitalContractModal';

export const CreatorContracts: React.FC = () => {
  const {
    currentCreator,
    contracts,
    connections,
    submitDeliverableProof,
    sendMessage,
  } = useApp();

  const [activeSection, setActiveSection] = useState<'contracts' | 'connected_brands'>('contracts');
  const [selectedContractForSign, setSelectedContractForSign] = useState<DealContract | null>(null);
  const [submittingContractId, setSubmittingContractId] = useState<string | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [selectedConnId, setSelectedConnId] = useState<string>(() => connections[0]?.id || '');
  const [chatInput, setChatInput] = useState('');

  // Filter contracts and connections for this creator
  const creatorContracts = contracts.filter(c => c.creatorId === currentCreator.id);
  const creatorConnections = connections.filter(c => c.creatorId === currentCreator.id);
  const activeConnection = creatorConnections.find(c => c.id === selectedConnId) || creatorConnections[0];

  const handleDeliverableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingContractId || !submissionUrl.trim()) return;

    submitDeliverableProof(submittingContractId, submissionUrl.trim(), submissionNotes.trim());
    setSubmittingContractId(null);
    setSubmissionUrl('');
    setSubmissionNotes('');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeConnection) return;
    sendMessage(activeConnection.id, chatInput.trim());
    setChatInput('');
  };

  const totalEarned = creatorContracts
    .filter(c => c.escrowStatus === 'APPROVED_PAYOUT_RELEASED')
    .reduce((acc, c) => acc + c.feeAmount, 0);

  const totalInEscrow = creatorContracts
    .filter(c => c.escrowStatus === 'ESCROW_FUNDED_ACTIVE' || c.escrowStatus === 'DELIVERABLE_SUBMITTED')
    .reduce((acc, c) => acc + c.feeAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Escrow Wallet */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Creator Payout & Brand Escrow Desk
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Inbound Sponsorship Deals & Connected Business Owners
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Counter-sign legal agreements, submit YouTube video proof links, and track funds securely locked in platform escrow.
          </p>
        </div>

        {/* Escrow Balance Indicators */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Currently in Escrow</span>
            <span className="font-mono text-sm font-bold text-emerald-600 tabular-nums">
              ₹{totalInEscrow.toLocaleString()} INR
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Released Payouts</span>
            <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
              ₹{totalEarned.toLocaleString()} INR
            </span>
          </div>
        </div>
      </div>

      {/* Segmented Sub-Bar */}
      <div className="flex items-center justify-between">
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
            <span>Sponsorship Contracts ({creatorContracts.length})</span>
          </button>
          <button
            onClick={() => setActiveSection('connected_brands')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'connected_brands'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Connected Brands ({creatorConnections.length})</span>
          </button>
        </div>
      </div>

      {activeSection === 'contracts' && (
        <div className="space-y-4">
          {creatorContracts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800">No deals received yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Switch to the Business Dealer portal to launch a campaign and send a sponsorship offer to {currentCreator.name}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {creatorContracts.map(contract => {
                const needsSignature = !contract.creatorSignature?.signed;
                const isSubmitted = contract.escrowStatus === 'DELIVERABLE_SUBMITTED';
                const isReleased = contract.escrowStatus === 'APPROVED_PAYOUT_RELEASED';

                return (
                  <div
                    key={contract.id}
                    className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition-all"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {contract.id}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs font-medium text-slate-700">
                            Brand: <strong className="text-slate-900">{contract.dealerName}</strong>
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                          {contract.campaignTitle}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase">Guaranteed Payout</span>
                          <span className="font-mono text-base font-bold text-emerald-600 tabular-nums">
                            ₹{contract.feeAmount.toLocaleString()} INR
                          </span>
                        </div>

                        <div>
                          {needsSignature ? (
                            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Action Required: Sign Contract
                            </span>
                          ) : isReleased ? (
                            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Payout Released
                            </span>
                          ) : isSubmitted ? (
                            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-indigo-600" />
                              Under Brand Verification
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5 text-emerald-600" />
                              Escrow Locked: Ready to Produce
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Terms & Scope */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Required Format</span>
                        <span className="font-semibold text-slate-800 block mt-0.5">{contract.deliverable}</span>
                        <p className="text-slate-600 text-[11px] mt-1">
                          {contract.terms.deliverableDescription}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Compliance & Legal</span>
                        <div className="text-[11px] text-slate-700">
                          <strong>Exclusivity:</strong> {contract.terms.exclusivityDays} days
                        </div>
                        <div className="text-[11px] text-slate-700">
                          <strong>Disclosure:</strong> {contract.terms.disclosureRequirement}
                        </div>
                        <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-mono pt-1">
                          <Lock className="w-3 h-3" />
                          Escrow Security: {contract.escrowStatus}
                        </div>
                      </div>
                    </div>

                    {/* Deliverable Proof Submission Form / Status */}
                    {!needsSignature && !isReleased && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <UploadCloud className="w-4 h-4 text-indigo-600" />
                            Deliverable Submission & Escrow Release Request
                          </div>
                          {isSubmitted && (
                            <span className="text-indigo-600 font-semibold text-[11px]">
                              Waiting for {contract.dealerName} approval
                            </span>
                          )}
                        </div>

                        {isSubmitted ? (
                          <div className="p-2.5 bg-white rounded border border-slate-200">
                            <span className="text-slate-500 block text-[11px]">Submitted Proof URL:</span>
                            <a
                              href={contract.submissionProof?.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 underline font-mono text-xs block"
                            >
                              {contract.submissionProof?.url}
                            </a>
                            {contract.submissionProof?.notes && (
                              <p className="text-slate-600 text-[11px] italic mt-1">
                                &quot;{contract.submissionProof.notes}&quot;
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-slate-600 text-[11px]">
                              Once your video or integration is filmed and uploaded (unlisted preview or public link), paste the URL here to trigger brand verification.
                            </p>
                            {submittingContractId === contract.id ? (
                              <form onSubmit={handleDeliverableSubmit} className="space-y-2 pt-1">
                                <input
                                  type="url"
                                  required
                                  placeholder="https://youtube.com/watch?v=..."
                                  value={submissionUrl}
                                  onChange={e => setSubmissionUrl(e.target.value)}
                                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                />
                                <input
                                  type="text"
                                  placeholder="Optional note: Timestamp of integration, special tracking link used, etc."
                                  value={submissionNotes}
                                  onChange={e => setSubmissionNotes(e.target.value)}
                                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSubmittingContractId(null)}
                                    className="px-3 py-1 text-slate-500 hover:text-slate-700 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded cursor-pointer"
                                  >
                                    Submit Video & Request Escrow
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <button
                                onClick={() => setSubmittingContractId(contract.id)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded text-xs cursor-pointer flex items-center gap-1.5"
                              >
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>Submit Video Proof Link</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Contract Hash: {contract.dealerSignature?.digitalHash?.substring(0, 20)}...
                      </span>

                      <div className="flex items-center gap-2">
                        {needsSignature ? (
                          <button
                            onClick={() => setSelectedContractForSign(contract)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Review & Counter-Sign Deal</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedContractForSign(contract)}
                            className="px-3 py-1.5 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-md bg-white hover:bg-slate-50 cursor-pointer flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            <span>View Signed Legal Agreement</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Connected Brands & Chat Log */}
      {activeSection === 'connected_brands' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 min-h-[480px]">
          {/* Brands Sidebar */}
          <div className="border-r border-slate-200 p-4 space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Connected Business Owners
            </span>
            {creatorConnections.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No connected brands yet.</p>
            ) : (
              creatorConnections.map(conn => {
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
                        {conn.dealerName}
                      </span>
                      <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        {conn.lastMessageTime}
                      </span>
                    </div>
                    <div className={`text-[11px] truncate mt-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {conn.lastMessage}
                    </div>
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
                      {activeConnection.dealerName}
                    </h3>
                    <div className="text-xs text-slate-500">
                      Product Campaign: {activeConnection.campaignTitle || 'Direct Brand Deal'}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {activeConnection.status}
                  </span>
                </div>

                {/* Message Stream */}
                <div className="flex-1 overflow-y-auto space-y-3 p-2 text-xs">
                  {activeConnection.messages.map(msg => {
                    const isCreator = msg.senderRole === 'creator';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isCreator ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md p-3 rounded-lg shadow-2xs ${
                            isCreator
                              ? 'bg-emerald-700 text-white rounded-br-none'
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
                    placeholder="Reply to brand dealer, ask talking points, or schedule filming..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                Select a connected brand dealer on the left to review communication logs.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Counter-Signing Modal */}
      {selectedContractForSign && (
        <DigitalContractModal
          isOpen={true}
          onClose={() => setSelectedContractForSign(null)}
          contract={selectedContractForSign}
          mode={selectedContractForSign.creatorSignature?.signed ? 'view' : 'sign_creator'}
        />
      )}
    </div>
  );
};
