import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DealContract } from '../../types';
import {
  FileText,
  Lock,
  CheckCircle,
  ExternalLink,
  MessageSquare,
  Send,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  Youtube,
  ChevronDown,
  ChevronUp,
  Loader2,
  XCircle,
} from 'lucide-react';
import { DigitalContractModal } from '../contracts/DigitalContractModal';

interface ReleaseChecklistState {
  visibilityChecked: boolean;
  disclosureChecked: boolean;
  irrevocableChecked: boolean;
}

export const BusinessContracts: React.FC = () => {
  const {
    currentDealer,
    contracts,
    connections,
    verifyYouTubeProofUrl,
    requestContractRevision,
    raiseEscrowDispute,
    resolveEscrowDispute,
    approveAndReleaseEscrow,
    sendMessage,
  } = useApp();

  const [activeSection, setActiveSection] = useState<'contracts' | 'contacts'>('contracts');
  const [selectedContract, setSelectedContract] = useState<DealContract | null>(null);
  const [selectedConnId, setSelectedConnId] = useState<string>(() => connections[0]?.id || '');
  const [chatInput, setChatInput] = useState('');

  // Escrow verification & gate states keyed by contractId
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyErrors, setVerifyErrors] = useState<Record<string, string>>({});
  const [checklists, setChecklists] = useState<Record<string, ReleaseChecklistState>>({});

  // Revision / Dispute / Resolution drawers keyed by contractId
  const [revisionOpenId, setRevisionOpenId] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [disputeOpenId, setDisputeOpenId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [expandedAudits, setExpandedAudits] = useState<Record<string, boolean>>({});

  const dealerContracts = contracts.filter(c => c.dealerId === currentDealer.id);
  const dealerConnections = connections.filter(c => c.dealerId === currentDealer.id);
  const activeConnection = dealerConnections.find(c => c.id === selectedConnId) || dealerConnections[0];

  // Escrow Vault Totals
  const activeLockedTotal = dealerContracts
    .filter(c => c.escrowStatus === 'SIGNED_BY_DEALER_PENDING_CREATOR' || c.escrowStatus === 'ESCROW_FUNDED_ACTIVE')
    .reduce((sum, c) => sum + c.feeAmount, 0);
  const awaitingAuditTotal = dealerContracts
    .filter(c => c.escrowStatus === 'DELIVERABLE_SUBMITTED')
    .reduce((sum, c) => sum + c.feeAmount, 0);
  const disputedTotal = dealerContracts
    .filter(c => c.escrowStatus === 'DISPUTED')
    .reduce((sum, c) => sum + c.feeAmount, 0);
  const releasedTotal = dealerContracts
    .filter(c => c.escrowStatus === 'APPROVED_PAYOUT_RELEASED')
    .reduce((sum, c) => sum + c.feeAmount, 0);

  const getChecklist = (contractId: string): ReleaseChecklistState =>
    checklists[contractId] || {
      visibilityChecked: false,
      disclosureChecked: false,
      irrevocableChecked: false,
    };

  const toggleChecklistField = (contractId: string, field: keyof ReleaseChecklistState) => {
    const current = getChecklist(contractId);
    setChecklists(prev => ({
      ...prev,
      [contractId]: { ...current, [field]: !current[field] },
    }));
  };

  const handleRunYouTubeAudit = async (contract: DealContract) => {
    if (!contract.submissionProof?.url) return;
    setVerifyingId(contract.id);
    setVerifyErrors(prev => ({ ...prev, [contract.id]: '' }));
    try {
      await verifyYouTubeProofUrl({
        url: contract.submissionProof.url,
        expectedCreatorHandle: contract.creatorHandle,
        expectedCreatorName: contract.creatorName,
        expectedKeywords: [contract.dealerName, contract.campaignTitle],
        contractId: contract.id,
      });
    } catch (err: any) {
      setVerifyErrors(prev => ({
        ...prev,
        [contract.id]: err?.message || 'Unable to reach YouTube Data API verification service.',
      }));
    } finally {
      setVerifyingId(null);
    }
  };

  const handleSubmitRevision = (e: React.FormEvent, contractId: string) => {
    e.preventDefault();
    if (!revisionNote.trim()) return;
    requestContractRevision(contractId, revisionNote.trim());
    setRevisionOpenId(null);
    setRevisionNote('');
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Multi-Gate Escrow & Verification Vault</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Escrow Contracts, Live YouTube Proof Audits & Dispute Desk
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
              Every payout requires dual signatures, live YouTube Data API verification, and a 3-gate compliance checklist. Freeze funds or request revisions anytime before release.
            </p>
          </div>

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
              <span>Escrow Contracts ({dealerContracts.length})</span>
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

        {/* Escrow Vault Summary Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Active Escrow Locked</span>
            <span className="font-mono text-base font-bold text-slate-900 tabular-nums mt-0.5 block">
              ₹{activeLockedTotal.toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200">
            <span className="text-[11px] text-indigo-700 block">Pending Proof Audit</span>
            <span className="font-mono text-base font-bold text-indigo-900 tabular-nums mt-0.5 block">
              ₹{awaitingAuditTotal.toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-200">
            <span className="text-[11px] text-rose-700 block">Frozen Under Dispute</span>
            <span className="font-mono text-base font-bold text-rose-900 tabular-nums mt-0.5 block">
              ₹{disputedTotal.toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200">
            <span className="text-[11px] text-emerald-700 block">Settled & Released</span>
            <span className="font-mono text-base font-bold text-emerald-900 tabular-nums mt-0.5 block">
              ₹{releasedTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {activeSection === 'contracts' && (
        <div className="space-y-4">
          {dealerContracts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800">No active contracts drafted yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Navigate to Creator Recommendations to select a verified creator and lock your first digital escrow agreement.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dealerContracts.map(contract => {
                const isPendingCreatorSign = contract.escrowStatus === 'SIGNED_BY_DEALER_PENDING_CREATOR';
                const isActive = contract.escrowStatus === 'ESCROW_FUNDED_ACTIVE';
                const isSubmitted = contract.escrowStatus === 'DELIVERABLE_SUBMITTED';
                const isReleased = contract.escrowStatus === 'APPROVED_PAYOUT_RELEASED';
                const isDisputed = contract.escrowStatus === 'DISPUTED';
                const isRefunded = contract.escrowStatus === 'REFUNDED_TO_DEALER';
                const isSettled = isReleased || isRefunded;

                const checklist = getChecklist(contract.id);
                const allGatesConfirmed =
                  checklist.visibilityChecked &&
                  checklist.disclosureChecked &&
                  checklist.irrevocableChecked;

                const platformFeePct = contract.platformFeePct ?? 5;
                const feeDeducted = Math.round((contract.feeAmount * platformFeePct) / 100);
                const netCreatorPayout = contract.feeAmount - feeDeducted;
                const revisionsUsed = contract.revisionsUsed ?? 0;
                const revisionsIncluded = contract.terms.revisionsIncluded ?? 2;
                const showAudit = Boolean(expandedAudits[contract.id]);

                const stage1Done = Boolean(contract.dealerSignature?.signed);
                const stage2Done = Boolean(contract.creatorSignature?.signed);
                const stage3Done = isSubmitted || isReleased || isDisputed;
                const stage4Done = isSettled;

                return (
                  <div
                    key={contract.id}
                    className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4"
                  >
                    {/* Top Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-bold text-slate-900">{contract.id}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-slate-700">{contract.campaignTitle}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">
                            Revisions {revisionsUsed}/{revisionsIncluded}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          Creator: <strong className="text-slate-900">{contract.creatorName}</strong>{' '}
                          <span className="font-mono text-slate-500">({contract.creatorHandle})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">
                            Escrow Deposit (Net ₹{netCreatorPayout.toLocaleString()})
                          </span>
                          <span className="font-mono text-base font-bold text-slate-900 tabular-nums">
                            ₹{contract.feeAmount.toLocaleString()} INR
                          </span>
                        </div>

                        <div className="text-xs font-semibold">
                          {isReleased ? (
                            <span className="text-emerald-700 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Payout Released
                            </span>
                          ) : isRefunded ? (
                            <span className="text-slate-700 flex items-center gap-1">
                              <RotateCcw className="w-4 h-4" />
                              Refunded to Dealer
                            </span>
                          ) : isDisputed ? (
                            <span className="text-rose-700 flex items-center gap-1">
                              <ShieldAlert className="w-4 h-4" />
                              Escrow Frozen
                            </span>
                          ) : isSubmitted ? (
                            <span className="text-indigo-700 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Proof Awaiting Audit
                            </span>
                          ) : isPendingCreatorSign ? (
                            <span className="text-amber-700 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Pending Creator Sign
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

                    {/* 4-Step Protection Progress Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div
                        className={`p-2 rounded border ${
                          stage1Done
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        1. Dealer Funded & Signed
                      </div>
                      <div
                        className={`p-2 rounded border ${
                          stage2Done
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-semibold'
                            : 'bg-amber-50/70 border-amber-200 text-amber-800 font-semibold'
                        }`}
                      >
                        2. {stage2Done ? 'Creator Counter-Signed' : 'Awaiting Creator Sign'}
                      </div>
                      <div
                        className={`p-2 rounded border ${
                          isDisputed
                            ? 'bg-rose-50 border-rose-200 text-rose-900 font-semibold'
                            : stage3Done
                            ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        3. {isDisputed ? 'Frozen in Dispute' : 'Live Proof & API Audit'}
                      </div>
                      <div
                        className={`p-2 rounded border ${
                          isReleased
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-semibold'
                            : isRefunded
                            ? 'bg-slate-100 border-slate-300 text-slate-800 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        4. {isRefunded ? 'Escrow Refunded' : '3-Gate Release & Receipt'}
                      </div>
                    </div>

                    {/* Middle Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 text-[11px] block">Contract Deliverable</span>
                        <span className="font-semibold text-slate-800 mt-0.5 block">
                          {contract.deliverable}
                        </span>
                        <p className="text-slate-500 text-[11px] mt-1 line-clamp-2">
                          {contract.terms.deliverableDescription}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 text-[11px] block">Dual Signature Hashes</span>
                        <div className="font-mono text-[10px] text-slate-700 break-all mt-1">
                          Dealer: {contract.dealerSignature?.digitalHash || 'Pending'}
                        </div>
                        <div className="font-mono text-[10px] text-slate-600 break-all mt-1">
                          Creator: {contract.creatorSignature?.digitalHash || 'Awaiting signature'}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 text-[11px] block">Escrow Protection Terms</span>
                        <div className="space-y-1 mt-1 text-[11px] text-slate-700">
                          <div>Exclusivity: {contract.terms.exclusivityDays} days</div>
                          <div>Review SLA: {contract.terms.approvalWindowDays} business days</div>
                          <div>Platform Holdback: {platformFeePct}% (₹{feeDeducted.toLocaleString()})</div>
                        </div>
                      </div>
                    </div>

                    {/* Revision Note Notice (if active after revision request) */}
                    {isActive && contract.revisionFeedback && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950">
                        <div className="font-semibold flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                          Revision Sent to Creator ({revisionsUsed}/{revisionsIncluded})
                        </div>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Feedback: &ldquo;{contract.revisionFeedback}&quot;
                        </p>
                      </div>
                    )}

                    {/* Live YouTube Deliverable Verification & 3-Gate Release Panel */}
                    {contract.submissionProof && (isSubmitted || isDisputed) && (
                      <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-4 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                              <Youtube className="w-4 h-4 text-indigo-600" />
                              Submitted YouTube Deliverable & Live API Audit
                            </div>
                            <a
                              href={contract.submissionProof.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-700 underline font-mono text-xs inline-flex items-center gap-1 mt-1 break-all"
                            >
                              {contract.submissionProof.url}
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                            {contract.submissionProof.notes && (
                              <p className="text-slate-600 text-[11px] mt-1">
                                Creator Note: &quot;{contract.submissionProof.notes}&quot;
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRunYouTubeAudit(contract)}
                            disabled={verifyingId === contract.id}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold rounded-lg cursor-pointer shrink-0 flex items-center gap-1.5"
                          >
                            {verifyingId === contract.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Auditing Video...</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Run Live YouTube API Audit</span>
                              </>
                            )}
                          </button>
                        </div>

                        {verifyErrors[contract.id] && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px]">
                            {verifyErrors[contract.id]}
                          </div>
                        )}

                        {contract.verification && (
                          <div className="p-3 bg-white rounded-lg border border-indigo-200 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span
                                className={`font-bold text-xs flex items-center gap-1.5 ${
                                  contract.verification.status === 'VERIFIED'
                                    ? 'text-emerald-700'
                                    : contract.verification.status === 'FAILED'
                                    ? 'text-rose-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {contract.verification.status === 'VERIFIED' ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : contract.verification.status === 'FAILED' ? (
                                  <XCircle className="w-4 h-4" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4" />
                                )}
                                Live Verification Result: {contract.verification.status}
                              </span>
                              {typeof contract.verification.views === 'number' && (
                                <span className="font-mono text-[11px] text-slate-600 tabular-nums">
                                  {contract.verification.views.toLocaleString()} views ·{' '}
                                  {contract.verification.durationFormatted || 'Video'} ·{' '}
                                  {contract.verification.privacyStatus?.toUpperCase() || 'PUBLIC'}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-700">
                              {contract.verification.summary}
                            </p>

                            {contract.verification.checks && contract.verification.checks.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {contract.verification.checks.map(chk => (
                                  <div
                                    key={chk.key}
                                    className={`p-2 rounded border text-[11px] ${
                                      chk.severity === 'pass'
                                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                                        : chk.severity === 'fail'
                                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                                        : 'bg-amber-50 border-amber-200 text-amber-900'
                                    }`}
                                  >
                                    <div className="font-semibold">{chk.label}</div>
                                    <div className="text-[10px] opacity-90 mt-0.5">{chk.detail}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3-Gate Mandatory Release Checklist */}
                        {isSubmitted && (
                          <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-3">
                            <div className="font-bold text-slate-900 flex items-center justify-between">
                              <span>3-Gate Escrow Release Verification</span>
                              <span className="text-[11px] font-normal text-slate-500">
                                Check all 3 gates to unlock payout
                              </span>
                            </div>

                            <div className="space-y-2 text-[11px] text-slate-700">
                              <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checklist.visibilityChecked}
                                  onChange={() => toggleChecklistField(contract.id, 'visibilityChecked')}
                                  className="mt-0.5 rounded text-emerald-600"
                                />
                                <span>
                                  Confirmed deliverable link is live (Public or Unlisted preview) on{' '}
                                  <strong>{contract.creatorHandle}</strong>.
                                </span>
                              </label>
                              <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checklist.disclosureChecked}
                                  onChange={() => toggleChecklistField(contract.id, 'disclosureChecked')}
                                  className="mt-0.5 rounded text-emerald-600"
                                />
                                <span>
                                  Verified ASCI/FTC <strong>#ad</strong> sponsorship disclosure and required campaign talking points.
                                </span>
                              </label>
                              <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checklist.irrevocableChecked}
                                  onChange={() => toggleChecklistField(contract.id, 'irrevocableChecked')}
                                  className="mt-0.5 rounded text-emerald-600"
                                />
                                <span>
                                  Authorize irrevocable escrow release of{' '}
                                  <strong>₹{contract.feeAmount.toLocaleString()} INR</strong> (Net{' '}
                                  <strong>₹{netCreatorPayout.toLocaleString()}</strong> to creator).
                                </span>
                              </label>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRevisionOpenId(revisionOpenId === contract.id ? null : contract.id);
                                    setDisputeOpenId(null);
                                  }}
                                  className="px-3 py-1.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold rounded-lg cursor-pointer flex items-center gap-1"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Request Revision ({revisionsUsed}/{revisionsIncluded})</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDisputeOpenId(disputeOpenId === contract.id ? null : contract.id);
                                    setRevisionOpenId(null);
                                  }}
                                  className="px-3 py-1.5 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900 font-semibold rounded-lg cursor-pointer flex items-center gap-1"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  <span>Freeze Escrow / Dispute</span>
                                </button>
                              </div>

                              <button
                                type="button"
                                disabled={!allGatesConfirmed}
                                onClick={() => approveAndReleaseEscrow(contract.id)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
                              >
                                Confirm & Release ₹{contract.feeAmount.toLocaleString()} Escrow
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Active state dispute trigger */}
                    {isActive && (
                      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                        <span className="text-slate-600">
                          Dual-signed escrow is active. Waiting for creator to upload live deliverable proof.
                        </span>
                        <button
                          type="button"
                          onClick={() => setDisputeOpenId(disputeOpenId === contract.id ? null : contract.id)}
                          className="px-3 py-1.5 border border-rose-300 bg-white hover:bg-rose-50 text-rose-800 font-semibold rounded-md cursor-pointer flex items-center gap-1"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Freeze Escrow / Dispute</span>
                        </button>
                      </div>
                    )}

                    {/* Inline Revision Drawer */}
                    {revisionOpenId === contract.id && (
                      <form
                        onSubmit={e => handleSubmitRevision(e, contract.id)}
                        className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg space-y-2 text-xs"
                      >
                        <div className="font-bold text-amber-950">
                          Send Revision Request to {contract.creatorName}
                        </div>
                        <textarea
                          rows={2}
                          required
                          placeholder="Specify exact edits needed (e.g., add #ad in top 3 lines of description, correct product URL, fix audio at 02:15)..."
                          value={revisionNote}
                          onChange={e => setRevisionNote(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-md focus:outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setRevisionOpenId(null)}
                            className="px-3 py-1.5 text-slate-600 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md cursor-pointer"
                          >
                            Return Deliverable for Revision
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Inline Dispute Freeze Drawer */}
                    {disputeOpenId === contract.id && (
                      <form
                        onSubmit={e => handleSubmitDispute(e, contract.id)}
                        className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg space-y-2 text-xs"
                      >
                        <div className="font-bold text-rose-950">
                          Freeze Escrow Funds & Open Formal Dispute
                        </div>
                        <p className="text-[11px] text-rose-800">
                          Freezing locks ₹{contract.feeAmount.toLocaleString()} INR so neither payout nor cancellation occurs until settled.
                        </p>
                        <textarea
                          rows={2}
                          required
                          placeholder="State the dispute reason clearly (e.g., missed deadline, missing #ad disclosure after revision, wrong video uploaded)..."
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

                    {/* Disputed Settlement Panel */}
                    {isDisputed && (
                      <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl space-y-3 text-xs">
                        <div>
                          <div className="font-bold text-rose-950 flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4 text-rose-600" />
                            Escrow Frozen Under Dispute (Raised by {contract.dispute?.raisedByRole || 'party'})
                          </div>
                          <p className="text-rose-800 text-[11px] mt-1">
                            Reason: &ldquo;{contract.dispute?.reason}&quot;
                          </p>
                        </div>

                        <div className="p-3 bg-white rounded-lg border border-rose-200 space-y-2">
                          <label className="block font-semibold text-slate-800 text-[11px]">
                            Dispute Settlement Note
                          </label>
                          <input
                            type="text"
                            placeholder="Enter resolution summary before settling escrow..."
                            value={resolutionNotes[contract.id] || ''}
                            onChange={e =>
                              setResolutionNotes(prev => ({ ...prev, [contract.id]: e.target.value }))
                            }
                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none"
                          />
                          <div className="flex flex-wrap justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                resolveEscrowDispute(
                                  contract.id,
                                  'refund',
                                  resolutionNotes[contract.id] || 'Dispute settled with escrow refund to dealer.'
                                )
                              }
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-md cursor-pointer"
                            >
                              Refund ₹{contract.feeAmount.toLocaleString()} to Dealer
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                resolveEscrowDispute(
                                  contract.id,
                                  'release',
                                  resolutionNotes[contract.id] || 'Dispute resolved; payout released to creator.'
                                )
                              }
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md cursor-pointer"
                            >
                              Release Payout to Creator
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Settled Receipt Strip */}
                    {isSettled && (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div>
                          <span className="font-bold text-emerald-950">
                            {isReleased ? 'Escrow Settled & Released' : 'Escrow Refunded to Brand'}
                          </span>
                          <span className="text-emerald-800 ml-2 text-[11px]">
                            {contract.resolutionNote}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-emerald-900">
                          Receipt: {contract.escrowReceiptHash || 'ESCROW-SETTLED'}
                        </span>
                      </div>
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

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Created {contract.createdAt} · Updated {contract.updatedAt}
                      </span>

                      <button
                        onClick={() => setSelectedContract(contract)}
                        className="px-3 py-1.5 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-md bg-white hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Legal Contract & Receipt</span>
                      </button>
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
                  <span className="text-[11px] font-semibold text-emerald-700">
                    {activeConnection.status}
                  </span>
                </div>

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
