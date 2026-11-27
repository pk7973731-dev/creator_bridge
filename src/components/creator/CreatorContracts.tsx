import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DealContract, DeliverableVerification } from '../../types';
import {
  FileText,
  Lock,
  CheckCircle,
  Clock,
  Send,
  ShieldCheck,
  Building2,
  UploadCloud,
  MessageSquare,
  RotateCcw,
  ShieldAlert,
  Youtube,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { DigitalContractModal } from '../contracts/DigitalContractModal';

export const CreatorContracts: React.FC = () => {
  const {
    currentCreator,
    contracts,
    connections,
    verifyYouTubeProofUrl,
    submitDeliverableProof,
    raiseEscrowDispute,
    resolveEscrowDispute,
    sendMessage,
  } = useApp();

  const [activeSection, setActiveSection] = useState<'contracts' | 'connected_brands'>('contracts');
  const [selectedContractForSign, setSelectedContractForSign] = useState<DealContract | null>(null);
  const [submittingContractId, setSubmittingContractId] = useState<string | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [preCheckLoading, setPreCheckLoading] = useState(false);
  const [preCheckError, setPreCheckError] = useState('');
  const [preCheckResult, setPreCheckResult] = useState<DeliverableVerification | null>(null);

  const [disputeOpenId, setDisputeOpenId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [expandedAudits, setExpandedAudits] = useState<Record<string, boolean>>({});

  const [selectedConnId, setSelectedConnId] = useState<string>(() => connections[0]?.id || '');
  const [chatInput, setChatInput] = useState('');

  const creatorContracts = contracts.filter(c => c.creatorId === currentCreator.id);
  const creatorConnections = connections.filter(c => c.creatorId === currentCreator.id);
  const activeConnection = creatorConnections.find(c => c.id === selectedConnId) || creatorConnections[0];

  const handlePreCheckVideo = async (contract: DealContract) => {
    if (!submissionUrl.trim()) {
      setPreCheckError('Paste a YouTube video URL first to run live compliance verification.');
      return;
    }
    setPreCheckLoading(true);
    setPreCheckError('');
    try {
      const result = await verifyYouTubeProofUrl({
        url: submissionUrl.trim(),
        expectedCreatorHandle: contract.creatorHandle,
        expectedCreatorName: contract.creatorName,
        expectedKeywords: [contract.dealerName, contract.campaignTitle],
      });
      setPreCheckResult(result);
    } catch (err: any) {
      setPreCheckError(err?.message || 'Could not verify YouTube URL.');
      setPreCheckResult(null);
    } finally {
      setPreCheckLoading(false);
    }
  };

  const handleDeliverableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingContractId || !submissionUrl.trim()) return;

    submitDeliverableProof(
      submittingContractId,
      submissionUrl.trim(),
      submissionNotes.trim(),
      preCheckResult || undefined
    );
    setSubmittingContractId(null);
    setSubmissionUrl('');
    setSubmissionNotes('');
    setPreCheckResult(null);
    setPreCheckError('');
  };

  const handleSubmitDispute = (e: React.FormEvent, contractId: string) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    raiseEscrowDispute(contractId, disputeReason.trim());
    setDisputeOpenId(null);
    setDisputeReason('');
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
    .filter(c =>
      c.escrowStatus === 'SIGNED_BY_DEALER_PENDING_CREATOR' ||
      c.escrowStatus === 'ESCROW_FUNDED_ACTIVE' ||
      c.escrowStatus === 'DELIVERABLE_SUBMITTED'
    )
    .reduce((acc, c) => acc + c.feeAmount, 0);

  const totalDisputed = creatorContracts
    .filter(c => c.escrowStatus === 'DISPUTED')
    .reduce((acc, c) => acc + c.feeAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Escrow Wallet */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Creator Payout & Protected Escrow Desk</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Inbound Sponsorship Deals & Escrow Payout Vault
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Counter-sign escrow-locked agreements, pre-audit your YouTube deliverable for #ad compliance, and track protected INR payouts.
          </p>
        </div>

        {/* Escrow Balance Indicators */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Protected in Escrow</span>
            <span className="font-mono text-sm font-bold text-emerald-600 tabular-nums">
              ₹{totalInEscrow.toLocaleString()} INR
            </span>
          </div>

          {totalDisputed > 0 && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-right">
              <span className="text-[10px] text-rose-600 uppercase tracking-wider block">Frozen Dispute</span>
              <span className="font-mono text-sm font-bold text-rose-800 tabular-nums">
                ₹{totalDisputed.toLocaleString()} INR
              </span>
            </div>
          )}

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
                const isDisputed = contract.escrowStatus === 'DISPUTED';
                const isRefunded = contract.escrowStatus === 'REFUNDED_TO_DEALER';
                const isSettled = isReleased || isRefunded;

                const platformFeePct = contract.platformFeePct ?? 5;
                const netPayout = contract.feeAmount - Math.round((contract.feeAmount * platformFeePct) / 100);
                const revisionsUsed = contract.revisionsUsed ?? 0;
                const revisionsIncluded = contract.terms.revisionsIncluded ?? 2;
                const showAudit = Boolean(expandedAudits[contract.id]);

                return (
                  <div
                    key={contract.id}
                    className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-bold text-slate-900">{contract.id}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            Brand: <strong className="text-slate-900">{contract.dealerName}</strong>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">
                            Revisions {revisionsUsed}/{revisionsIncluded}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                          {contract.campaignTitle}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">
                            Guaranteed Net ({100 - platformFeePct}% of ₹{contract.feeAmount.toLocaleString()})
                          </span>
                          <span className="font-mono text-base font-bold text-emerald-600 tabular-nums">
                            ₹{netPayout.toLocaleString()} INR
                          </span>
                        </div>

                        <div className="text-xs font-semibold">
                          {needsSignature ? (
                            <span className="text-amber-700 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Sign Required
                            </span>
                          ) : isReleased ? (
                            <span className="text-emerald-700 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Payout Released
                            </span>
                          ) : isRefunded ? (
                            <span className="text-slate-700 flex items-center gap-1">
                              <RotateCcw className="w-4 h-4" />
                              Escrow Refunded
                            </span>
                          ) : isDisputed ? (
                            <span className="text-rose-700 flex items-center gap-1">
                              <ShieldAlert className="w-4 h-4" />
                              Frozen Dispute
                            </span>
                          ) : isSubmitted ? (
                            <span className="text-indigo-700 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Under Brand Review
                            </span>
                          ) : (
                            <span className="text-emerald-700 flex items-center gap-1">
                              <Lock className="w-4 h-4" />
                              Escrow Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Terms & Scope */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[11px] text-slate-400 block">Required Format</span>
                        <span className="font-semibold text-slate-800 block mt-0.5">{contract.deliverable}</span>
                        <p className="text-slate-600 text-[11px] mt-1">
                          {contract.terms.deliverableDescription}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                        <span className="text-[11px] text-slate-400 block">Escrow & Compliance Clauses</span>
                        <div className="text-[11px] text-slate-700">
                          <strong>Exclusivity:</strong> {contract.terms.exclusivityDays} days ·{' '}
                          <strong>Review SLA:</strong> {contract.terms.approvalWindowDays} days
                        </div>
                        <div className="text-[11px] text-slate-700">
                          <strong>Disclosure:</strong> {contract.terms.disclosureRequirement}
                        </div>
                        <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-mono pt-0.5">
                          <Lock className="w-3 h-3" />
                          State: {contract.escrowStatus}
                        </div>
                      </div>
                    </div>

                    {/* Brand Revision Feedback Alert */}
                    {!needsSignature && !isSettled && !isDisputed && contract.revisionFeedback && !isSubmitted && (
                      <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg space-y-1 text-xs">
                        <div className="font-bold text-amber-950 flex items-center gap-1.5">
                          <RotateCcw className="w-4 h-4 text-amber-700" />
                          Revision Requested by {contract.dealerName} ({revisionsUsed}/{revisionsIncluded})
                        </div>
                        <p className="text-amber-900 text-[11px]">
                          &ldquo;{contract.revisionFeedback}&quot;
                        </p>
                      </div>
                    )}

                    {/* Deliverable Proof Submission & Live YouTube Compliance Self-Check */}
                    {!needsSignature && !isSettled && !isDisputed && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <UploadCloud className="w-4 h-4 text-indigo-600" />
                            Deliverable Proof Submission & Compliance Self-Check
                          </div>
                          {isSubmitted && (
                            <span className="text-indigo-600 font-semibold text-[11px]">
                              Waiting for {contract.dealerName} 3-gate approval
                            </span>
                          )}
                        </div>

                        {isSubmitted ? (
                          <div className="p-3 bg-white rounded border border-slate-200 space-y-2">
                            <span className="text-slate-500 block text-[11px]">Submitted Proof URL:</span>
                            <a
                              href={contract.submissionProof?.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 underline font-mono text-xs inline-flex items-center gap-1 break-all"
                            >
                              {contract.submissionProof?.url}
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                            {contract.submissionProof?.notes && (
                              <p className="text-slate-600 text-[11px] italic">
                                &quot;{contract.submissionProof.notes}&quot;
                              </p>
                            )}
                            {contract.verification && (
                              <div className="text-[11px] p-2 rounded bg-slate-50 border border-slate-200 text-slate-700">
                                <strong>YouTube API Audit ({contract.verification.status}):</strong>{' '}
                                {contract.verification.summary}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-slate-600 text-[11px]">
                              Upload your video as Unlisted or Public on YouTube, run our instant YouTube API check to verify visibility and #ad compliance, then submit to trigger brand review.
                            </p>
                            {submittingContractId === contract.id ? (
                              <form onSubmit={handleDeliverableSubmit} className="space-y-2.5 pt-1">
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <input
                                    type="url"
                                    required
                                    placeholder="https://youtube.com/watch?v=..."
                                    value={submissionUrl}
                                    onChange={e => {
                                      setSubmissionUrl(e.target.value);
                                      setPreCheckResult(null);
                                      setPreCheckError('');
                                    }}
                                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handlePreCheckVideo(contract)}
                                    disabled={preCheckLoading}
                                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold rounded text-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                                  >
                                    {preCheckLoading ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Checking...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Youtube className="w-3.5 h-3.5" />
                                        <span>Verify YouTube Link & #ad</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                {preCheckError && (
                                  <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px]">
                                    {preCheckError}
                                  </div>
                                )}

                                {preCheckResult && (
                                  <div
                                    className={`p-2.5 rounded border text-[11px] space-y-1.5 ${
                                      preCheckResult.status === 'VERIFIED'
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                        : preCheckResult.status === 'FAILED'
                                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                                        : 'bg-amber-50 border-amber-200 text-amber-900'
                                    }`}
                                  >
                                    <div className="font-bold flex items-center gap-1.5">
                                      {preCheckResult.status === 'VERIFIED' ? (
                                        <CheckCircle className="w-3.5 h-3.5" />
                                      ) : (
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                      )}
                                      <span>Pre-Submission Audit: {preCheckResult.status}</span>
                                    </div>
                                    <p>{preCheckResult.summary}</p>
                                  </div>
                                )}

                                <input
                                  type="text"
                                  placeholder="Optional note: Integration timestamp, promo code, pinned link confirmation..."
                                  value={submissionNotes}
                                  onChange={e => setSubmissionNotes(e.target.value)}
                                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSubmittingContractId(null);
                                      setPreCheckResult(null);
                                      setPreCheckError('');
                                    }}
                                    className="px-3 py-1.5 text-slate-500 hover:text-slate-700 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded cursor-pointer"
                                  >
                                    Submit Video & Request Escrow Release
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <button
                                onClick={() => {
                                  setSubmittingContractId(contract.id);
                                  setSubmissionUrl(contract.submissionProof?.url || '');
                                }}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded text-xs cursor-pointer flex items-center gap-1.5"
                              >
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>
                                  {contract.revisionFeedback ? 'Submit Revised Video Link' : 'Submit Video Proof Link'}
                                </span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dispute Banner or Creator Protection Trigger */}
                    {isDisputed && (
                      <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-lg space-y-2 text-xs">
                        <div className="font-bold text-rose-950 flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                          Escrow Frozen Under Dispute (Raised by {contract.dispute?.raisedByRole || 'party'})
                        </div>
                        <p className="text-rose-800 text-[11px]">
                          Reason: &ldquo;{contract.dispute?.reason}&quot;
                        </p>
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              resolveEscrowDispute(
                                contract.id,
                                'refund',
                                'Creator consented to cancel and refund locked escrow to brand dealer.'
                              )
                            }
                            className="px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-rose-900 font-semibold rounded cursor-pointer"
                          >
                            Consent to Mutual Refund
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Settled Receipt Strip */}
                    {isSettled && (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div>
                          <span className="font-bold text-emerald-950">
                            {isReleased ? 'Escrow Payout Settled' : 'Escrow Refunded to Brand'}
                          </span>
                          {contract.resolutionNote && (
                            <span className="text-emerald-800 ml-2 text-[11px]">
                              {contract.resolutionNote}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[11px] font-bold text-emerald-900">
                          Receipt: {contract.escrowReceiptHash || 'ESCROW-SETTLED'}
                        </span>
                      </div>
                    )}

                    {/* Inline Dispute Form for Creator */}
                    {disputeOpenId === contract.id && (
                      <form
                        onSubmit={e => handleSubmitDispute(e, contract.id)}
                        className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg space-y-2 text-xs"
                      >
                        <div className="font-bold text-rose-950">
                          Freeze Escrow & Raise Creator Protection Dispute
                        </div>
                        <textarea
                          rows={2}
                          required
                          placeholder="Describe the issue (e.g., brand requested extra unpaid deliverables, brand unresponsive past review SLA)..."
                          value={disputeReason}
                          onChange={e => setDisputeReason(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-rose-300 rounded-md focus:outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDisputeOpenId(null)}
                            className="px-3 py-1.5 text-slate-600 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md cursor-pointer"
                          >
                            Freeze Escrow Funds
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Expandable Escrow Audit Trail */}
                    {contract.auditEvents && contract.auditEvents.length > 0 && (
                      <div className="border-t border-slate-100 pt-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedAudits(prev => ({
                              ...prev,
                              [contract.id]: !prev[contract.id],
                            }))
                          }
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                        >
                          {showAudit ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                          <span>Escrow Audit Ledger ({contract.auditEvents.length} events)</span>
                        </button>

                        {showAudit && (
                          <div className="mt-2 space-y-1.5">
                            {contract.auditEvents.map(evt => (
                              <div
                                key={evt.id}
                                className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                              >
                                <div>
                                  <span className="font-semibold text-slate-900">{evt.action}</span>
                                  <span className="text-slate-500 ml-2">{evt.detail}</span>
                                </div>
                                <span className="font-mono text-[10px] text-slate-400 shrink-0">
                                  {evt.timestamp}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom Action Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-400 text-[11px] font-mono">
                        Hash: {contract.dealerSignature?.digitalHash?.substring(0, 22)}...
                      </span>

                      <div className="flex items-center gap-2">
                        {!needsSignature && !isSettled && !isDisputed && (
                          <button
                            type="button"
                            onClick={() =>
                              setDisputeOpenId(disputeOpenId === contract.id ? null : contract.id)
                            }
                            className="px-3 py-1.5 border border-rose-200 text-rose-800 hover:bg-rose-50 rounded-md bg-white cursor-pointer flex items-center gap-1"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Raise Dispute</span>
                          </button>
                        )}

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
                            <span>View Agreement & Receipt</span>
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
                  <span className="text-[11px] font-semibold text-emerald-700">
                    {activeConnection.status}
                  </span>
                </div>

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
