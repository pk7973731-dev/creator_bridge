import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DealContract, CreatorProfile, ProductCampaign } from '../../types';
import {
  X,
  ShieldCheck,
  Lock,
  CheckCircle,
  AlertTriangle,
  Key,
  Printer,
  Clock,
  ShieldAlert,
  Youtube,
} from 'lucide-react';

interface DigitalContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator?: CreatorProfile;
  campaign?: ProductCampaign;
  contract?: DealContract;
  mode?: 'create' | 'sign_creator' | 'view';
}

export const DigitalContractModal: React.FC<DigitalContractModalProps> = ({
  isOpen,
  onClose,
  creator,
  campaign,
  contract,
  mode = 'create',
}) => {
  const {
    activeRole,
    currentDealer,
    currentCreator,
    createContract,
    signContractAsCreator,
    approveAndReleaseEscrow,
  } = useApp();

  const targetCreator =
    creator ||
    (contract
      ? ({
          id: contract.creatorId,
          name: contract.creatorName,
          handle: contract.creatorHandle,
          rates: {
            dedicatedVideo: contract.feeAmount,
            integrated60s: contract.feeAmount,
            shortsReels: contract.feeAmount,
          },
        } as CreatorProfile)
      : undefined);

  const targetCampaign =
    campaign ||
    (contract
      ? ({
          id: contract.campaignId,
          productName: contract.campaignTitle,
          budget: contract.feeAmount,
          deliverableNeeded: contract.deliverable,
        } as unknown as ProductCampaign)
      : undefined);

  const [fee, setFee] = useState<number>(() => {
    if (contract) return contract.feeAmount;
    if (targetCampaign && targetCreator) {
      if (targetCampaign.deliverableNeeded === 'Dedicated YouTube Video') {
        return targetCreator.rates?.dedicatedVideo || 25000;
      }
      if (targetCampaign.deliverableNeeded === 'Shorts / Reels') {
        return targetCreator.rates?.shortsReels || 8000;
      }
      return targetCreator.rates?.integrated60s || targetCampaign.budget;
    }
    return 15000;
  });

  const [deliverableDesc, setDeliverableDesc] = useState(
    contract?.terms.deliverableDescription ||
      '60-second integrated mid-roll sponsorship segment with hands-on demonstration, clear #ad disclosure, and pinned comment tracking link.'
  );
  const [exclusivityDays, setExclusivityDays] = useState(contract?.terms.exclusivityDays || 14);
  const [revisionsIncluded, setRevisionsIncluded] = useState(contract?.terms.revisionsIncluded || 2);
  const [approvalWindowDays, setApprovalWindowDays] = useState(contract?.terms.approvalWindowDays || 3);
  const [signatoryName, setSignatoryName] = useState(
    activeRole === 'business'
      ? `${currentDealer.companyName} Legal Representative`
      : currentCreator.name
  );
  const [acknowledgedTerms, setAcknowledgedTerms] = useState(false);
  const [acknowledgedRiskOverride, setAcknowledgedRiskOverride] = useState(false);

  // 3-Gate confirmation inside modal when approving release
  const [gateVisibility, setGateVisibility] = useState(false);
  const [gateDisclosure, setGateDisclosure] = useState(false);
  const [gateIrrevocable, setGateIrrevocable] = useState(false);

  if (!isOpen) return null;

  const isHighRiskCreator = creator?.authenticityReport?.riskLevel === 'HIGH_RISK_SUSPICIOUS';
  const isCautionCreator = creator?.authenticityReport?.riskLevel === 'MODERATE_CAUTION';

  const activeFee = contract ? contract.feeAmount : Number(fee) || 0;
  const platformFeePct = contract?.platformFeePct ?? 5;
  const escrowProtectionFee = Math.round((activeFee * platformFeePct) / 100);
  const netCreatorPayout = Math.max(0, activeFee - escrowProtectionFee);

  const handleCreateAndSignDealer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCreator || !targetCampaign) return;
    if (isHighRiskCreator && !acknowledgedRiskOverride) return;

    createContract({
      campaignId: targetCampaign.id || 'camp_custom',
      campaignTitle: targetCampaign.productName,
      dealerId: currentDealer.id,
      dealerName: currentDealer.companyName,
      creatorId: targetCreator.id,
      creatorName: targetCreator.name,
      creatorHandle: targetCreator.handle,
      deliverable: targetCampaign.deliverableNeeded || '60s Integrated Sponsor',
      feeAmount: Number(fee),
      platformFeePct: 5,
      escrowStatus: 'SIGNED_BY_DEALER_PENDING_CREATOR',
      terms: {
        deliverableDescription: deliverableDesc,
        exclusivityDays: Number(exclusivityDays),
        disclosureRequirement:
          'Mandatory ASCI/FTC compliance: Clear verbal disclosure and #ad in top 3 lines of video description.',
        approvalWindowDays: Number(approvalWindowDays),
        revisionsIncluded: Number(revisionsIncluded),
        usageRights: '12 Months Digital Organic & Paid Social Ad Usage.',
        cancellationPolicy: 'Full refund before creator signs or starts draft; 50% kill fee after draft submission.',
      },
      milestones: [
        {
          title: 'Agreement Signed & Escrow Funded by Dealer',
          status: 'Completed',
          timestamp: new Date().toISOString().split('T')[0],
        },
        { title: 'Creator Review & Counter-Signature', status: 'Pending' },
        { title: 'Live YouTube Proof Audit & Dealer Review', status: 'Pending' },
        { title: 'Final Checklist & Escrow Payout Release', status: 'Pending' },
      ],
    });

    onClose();
  };

  const handleSignCreator = () => {
    if (!contract || !signatoryName.trim()) return;
    signContractAsCreator(contract.id, signatoryName.trim());
    onClose();
  };

  const handleRelease = () => {
    if (!contract || !gateVisibility || !gateDisclosure || !gateIrrevocable) return;
    approveAndReleaseEscrow(
      contract.id,
      'Verified visibility, ASCI/FTC #ad disclosure, and final payout release inside Escrow Contract Vault.'
    );
    onClose();
  };

  const isSettled =
    contract?.escrowStatus === 'APPROVED_PAYOUT_RELEASED' ||
    contract?.escrowStatus === 'REFUNDED_TO_DEALER';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                Escrow Protected Contract
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-500">{contract?.id || 'NEW_ESCROW_VAULT'}</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              Digital Sponsorship & Escrow Protection Agreement
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Parties Overview */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">
                Business Dealer (Escrow Funder)
              </span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {contract ? contract.dealerName : currentDealer.companyName}
              </div>
              <div className="text-slate-500 text-[11px]">Authorized Brand Representative</div>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">
                Content Creator (Payee)
              </span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {targetCreator?.name}
              </div>
              <div className="text-slate-500 text-[11px] font-mono">{targetCreator?.handle}</div>
            </div>
          </div>

          {/* INR Escrow Split Breakdown */}
          <div className="p-3.5 bg-slate-900 text-white rounded-lg grid grid-cols-3 gap-3">
            <div>
              <span className="text-[11px] text-slate-400 block">Gross Escrow Lock</span>
              <span className="font-mono text-sm font-bold tabular-nums">
                ₹{activeFee.toLocaleString()} INR
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">
                Escrow Protection ({platformFeePct}%)
              </span>
              <span className="font-mono text-sm font-semibold text-amber-300 tabular-nums">
                ₹{escrowProtectionFee.toLocaleString()} INR
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Net Creator Payout</span>
              <span className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                ₹{netCreatorPayout.toLocaleString()} INR
              </span>
            </div>
          </div>

          {/* Escrow Protection Banner */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-start gap-3 text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-950">
                Multi-Gate Escrow & Live YouTube Proof Verification
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                Funds lock immediately upon dealer signature. The creator must counter-sign before production, submit a live YouTube deliverable verified via YouTube Data API v3, and pass the 3-gate brand checklist before payout release. Either party can freeze funds in dispute.
              </p>
            </div>
          </div>

          {mode === 'create' ? (
            <form onSubmit={handleCreateAndSignDealer} className="space-y-4">
              {/* Anti-Fraud Pre-Lock Gate */}
              {(isHighRiskCreator || isCautionCreator) && creator?.authenticityReport && (
                <div
                  className={`p-3.5 rounded-lg border space-y-2 ${
                    isHighRiskCreator
                      ? 'bg-rose-50 border-rose-300 text-rose-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>
                      {isHighRiskCreator
                        ? `High Fraud Risk Detected (Credibility ${creator.authenticityReport.credibilityScore}/100)`
                        : `Moderate Caution Advisory (Credibility ${creator.authenticityReport.credibilityScore}/100)`}
                    </span>
                  </div>
                  <p className="text-[11px]">
                    Estimated inactive/bot audience: <strong>{creator.authenticityReport.fakeFollowersEstimatePct}%</strong>.{' '}
                    {creator.authenticityReport.auditFlags[0]}
                  </p>
                  {isHighRiskCreator && (
                    <label className="flex items-start gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        required
                        checked={acknowledgedRiskOverride}
                        onChange={e => setAcknowledgedRiskOverride(e.target.checked)}
                        className="mt-0.5 rounded text-rose-600"
                      />
                      <span className="text-[11px] font-semibold">
                        I have reviewed the bot audit warning and explicitly authorize locking escrow with this high-risk channel.
                      </span>
                    </label>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Total Deal Fee (₹ INR) *
                  </label>
                  <input
                    type="number"
                    min={500}
                    required
                    value={fee}
                    onChange={e => setFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Exclusivity (Days)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={exclusivityDays}
                    onChange={e => setExclusivityDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Revisions Included
                  </label>
                  <select
                    value={revisionsIncluded}
                    onChange={e => setRevisionsIncluded(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value={1}>1 Revision</option>
                    <option value={2}>2 Revisions</option>
                    <option value={3}>3 Revisions</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Deliverable Scope & Specific Requirements *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={deliverableDesc}
                    onChange={e => setDeliverableDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Review SLA Window
                  </label>
                  <select
                    value={approvalWindowDays}
                    onChange={e => setApprovalWindowDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value={2}>2 Business Days</option>
                    <option value={3}>3 Business Days</option>
                    <option value={5}>5 Business Days</option>
                    <option value={7}>7 Business Days</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Brand review window after proof submission
                  </span>
                </div>
              </div>

              {/* Legal Clauses */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-[11px] text-slate-600">
                <div className="font-semibold text-slate-900">Escrow Protection Clauses:</div>
                <p>
                  <strong>1. ASCI / FTC Disclosure:</strong> Creator must include clear &ldquo;#ad&rdquo; or &ldquo;#sponsored&rdquo; in video description/metadata and verbal disclosure.
                </p>
                <p>
                  <strong>2. Counter-Signature Lock:</strong> Funds lock now; production begins only after Creator digitally counter-signs.
                </p>
                <p>
                  <strong>3. Dispute Freeze:</strong> Either party may freeze escrow during active production or review for fair resolution.
                </p>
              </div>

              {/* Signature Section */}
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-2">
                <div className="font-semibold text-indigo-950 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-600" />
                  Dealer Digital Signature & Escrow Authorization
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Type Full Legal Name as Signature:
                  </label>
                  <input
                    type="text"
                    required
                    value={signatoryName}
                    onChange={e => setSignatoryName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-indigo-200 rounded bg-white font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <label className="flex items-start gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    required
                    checked={acknowledgedTerms}
                    onChange={e => setAcknowledgedTerms(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600"
                  />
                  <span className="text-[11px] text-slate-700">
                    I authorize locking <strong>₹{Number(fee).toLocaleString()} INR</strong> into escrow. Funds remain locked until the creator counter-signs and submits verified deliverable proof.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!acknowledgedTerms || (isHighRiskCreator && !acknowledgedRiskOverride)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Sign & Lock Escrow (₹{Number(fee).toLocaleString()})
                </button>
              </div>
            </form>
          ) : (
            /* View or Sign Creator */
            <div className="space-y-4">
              <div className="p-3.5 border border-slate-200 rounded-lg bg-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Campaign Deliverable:</span>
                  <span className="font-semibold text-slate-900">{contract?.deliverable}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Escrow State:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {contract?.escrowStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Revisions Policy:</span>
                  <span className="font-mono text-slate-700">
                    {contract?.revisionsUsed || 0} / {contract?.terms.revisionsIncluded ?? 2} used · {contract?.terms.exclusivityDays ?? 14}d exclusivity
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 block mb-1">Deliverable Scope:</span>
                  <p className="text-slate-800 bg-slate-50 p-2.5 rounded">
                    {contract?.terms.deliverableDescription}
                  </p>
                </div>
              </div>

              {/* Digital Signatures Display */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span>Dealer Signature</span>
                    {contract?.dealerSignature?.signed && (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="font-mono font-bold text-slate-900">
                    {contract?.dealerSignature?.signatoryName || 'Pending'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono break-all">
                    {contract?.dealerSignature?.digitalHash}
                  </div>
                </div>

                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span>Creator Signature</span>
                    {contract?.creatorSignature?.signed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <span className="text-[10px] text-amber-600 font-semibold">Awaiting Sign</span>
                    )}
                  </div>
                  <div className="font-mono font-bold text-slate-900">
                    {contract?.creatorSignature?.signatoryName || 'Awaiting counter-signature'}
                  </div>
                  {contract?.creatorSignature?.digitalHash && (
                    <div className="text-[10px] text-slate-400 mt-1 font-mono break-all">
                      {contract.creatorSignature.digitalHash}
                    </div>
                  )}
                </div>
              </div>

              {/* Deliverable Proof & Automated Verification */}
              {contract?.submissionProof && (
                <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sky-950 flex items-center gap-1.5">
                      <Youtube className="w-4 h-4 text-sky-600" />
                      Submitted Deliverable Proof
                    </span>
                    {contract.verification && (
                      <span
                        className={`font-mono text-[11px] font-bold ${
                          contract.verification.status === 'VERIFIED'
                            ? 'text-emerald-700'
                            : contract.verification.status === 'FAILED'
                            ? 'text-rose-700'
                            : 'text-amber-700'
                        }`}
                      >
                        API Audit: {contract.verification.status}
                      </span>
                    )}
                  </div>
                  <a
                    href={contract.submissionProof.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-700 underline font-mono block break-all"
                  >
                    {contract.submissionProof.url}
                  </a>
                  {contract.submissionProof.notes && (
                    <p className="text-slate-600 italic">&ldquo;{contract.submissionProof.notes}&quot;</p>
                  )}
                  {contract.verification?.summary && (
                    <div className="text-[11px] text-slate-700 bg-white/80 p-2 rounded border border-sky-100">
                      {contract.verification.summary}
                    </div>
                  )}
                </div>
              )}

              {/* Dispute Banner */}
              {contract?.dispute && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
                  <div className="font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Escrow Frozen Under Dispute (Raised by {contract.dispute.raisedByRole})
                  </div>
                  <p className="text-rose-800 text-[11px]">{contract.dispute.reason}</p>
                </div>
              )}

              {/* Settlement Receipt */}
              {isSettled && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Official Escrow Settlement Receipt
                    </div>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded text-[11px] font-semibold hover:bg-emerald-100 cursor-pointer flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3" />
                      Print Receipt
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-emerald-700 block">Settlement Hash:</span>
                      <span className="font-mono font-bold text-emerald-950">
                        {contract?.escrowReceiptHash || 'ESCROW-INR-SETTLED'}
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-700 block">Final Outcome:</span>
                      <span className="font-semibold text-emerald-950">
                        {contract?.escrowStatus === 'APPROVED_PAYOUT_RELEASED'
                          ? `₹${netCreatorPayout.toLocaleString()} Net Released to Creator`
                          : `₹${activeFee.toLocaleString()} Refunded to Brand Dealer`}
                      </span>
                    </div>
                  </div>
                  {contract?.resolutionNote && (
                    <p className="text-[11px] text-emerald-900">{contract.resolutionNote}</p>
                  )}
                </div>
              )}

              {/* Immutable Escrow Audit Trail */}
              {contract?.auditEvents && contract.auditEvents.length > 0 && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Escrow Audit Ledger ({contract.auditEvents.length} events)
                  </div>
                  <div className="space-y-2">
                    {contract.auditEvents.map(evt => (
                      <div
                        key={evt.id}
                        className="p-2 bg-white border border-slate-200 rounded flex flex-col gap-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{evt.action}</span>
                          <span className="font-mono text-[10px] text-slate-400">{evt.timestamp}</span>
                        </div>
                        <div className="text-[11px] text-slate-600">{evt.detail}</div>
                        {evt.txHash && (
                          <div className="font-mono text-[10px] text-slate-400 break-all">
                            Ref: {evt.txHash}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions based on role and contract state */}
              {mode === 'sign_creator' && !contract?.creatorSignature?.signed && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2.5">
                  <div className="font-semibold text-emerald-950">
                    Accept & Counter-Sign Escrow Agreement
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    By counter-signing, you lock in the guaranteed net payout of{' '}
                    <strong>₹{netCreatorPayout.toLocaleString()} INR</strong> (after {platformFeePct}% escrow protection fee) upon verified delivery.
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Creator Legal Signature:
                    </label>
                    <input
                      type="text"
                      value={signatoryName}
                      onChange={e => setSignatoryName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-emerald-300 rounded font-mono text-xs bg-white focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSignCreator}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded cursor-pointer mt-1"
                  >
                    Confirm & Counter-Sign Deal
                  </button>
                </div>
              )}

              {activeRole === 'business' && contract?.escrowStatus === 'DELIVERABLE_SUBMITTED' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3">
                  <div>
                    <div className="font-bold text-emerald-950">
                      3-Gate Mandatory Escrow Release Verification
                    </div>
                    <div className="text-[11px] text-emerald-800">
                      Confirm all three compliance gates before releasing ₹{contract.feeAmount.toLocaleString()} INR.
                    </div>
                  </div>
                  <div className="space-y-2 text-[11px] text-slate-800">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gateVisibility}
                        onChange={e => setGateVisibility(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-600"
                      />
                      <span>Video is live (Public or Unlisted preview) on the verified creator channel.</span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gateDisclosure}
                        onChange={e => setGateDisclosure(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-600"
                      />
                      <span>ASCI/FTC #ad sponsorship disclosure and campaign talking points are present.</span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gateIrrevocable}
                        onChange={e => setGateIrrevocable(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-600"
                      />
                      <span>
                        I authorize irrevocable release of ₹{contract.feeAmount.toLocaleString()} INR from escrow.
                      </span>
                    </label>
                  </div>
                  <button
                    onClick={handleRelease}
                    disabled={!gateVisibility || !gateDisclosure || !gateIrrevocable}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold rounded-lg cursor-pointer"
                  >
                    Approve & Release ₹{contract.feeAmount.toLocaleString()} Escrow
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
