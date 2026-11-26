import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DealContract, CreatorProfile, ProductCampaign } from '../../types';
import { X, ShieldCheck, Lock, CheckCircle, FileText, AlertTriangle, Key } from 'lucide-react';
import { generateDigitalContractHash } from '../../utils/fraudDetection';

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

  const targetCreator = creator || (contract ? { name: contract.creatorName, handle: contract.creatorHandle, rates: { dedicatedVideo: contract.feeAmount, integrated60s: contract.feeAmount, shortsReels: contract.feeAmount } } as any : undefined);
  const targetCampaign = campaign || (contract ? { productName: contract.campaignTitle, budget: contract.feeAmount, deliverableNeeded: contract.deliverable } as any : undefined);

  // Form for creating new contract
  const [fee, setFee] = useState<number>(() => {
    if (contract) return contract.feeAmount;
    if (targetCampaign && targetCreator) {
      if (targetCampaign.deliverableNeeded === 'Dedicated YouTube Video') return targetCreator.rates?.dedicatedVideo || 3000;
      if (targetCampaign.deliverableNeeded === 'Shorts / Reels') return targetCreator.rates?.shortsReels || 800;
      return targetCreator.rates?.integrated60s || targetCampaign.budget;
    }
    return 2500;
  });

  const [deliverableDesc, setDeliverableDesc] = useState(
    contract?.terms.deliverableDescription ||
      `60-second integrated mid-roll sponsorship segment with unboxing, practical demonstration of core features, and pinned comment tracking URL.`
  );
  const [exclusivityDays, setExclusivityDays] = useState(contract?.terms.exclusivityDays || 14);
  const [signatoryName, setSignatoryName] = useState(
    activeRole === 'business'
      ? `${currentDealer.companyName} Legal Representative`
      : currentCreator.name
  );
  const [acknowledgedTerms, setAcknowledgedTerms] = useState(false);

  if (!isOpen) return null;

  const handleCreateAndSignDealer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCreator || !targetCampaign) return;

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
      escrowStatus: 'ESCROW_FUNDED_ACTIVE',
      terms: {
        deliverableDescription: deliverableDesc,
        exclusivityDays: Number(exclusivityDays),
        disclosureRequirement: 'Mandatory FTC compliance: Clear verbal disclosure and #ad in top 3 lines of description.',
        approvalWindowDays: 3,
        revisionsIncluded: 1,
        usageRights: '12 Months Digital Organic & Paid Social Ad Usage.',
        cancellationPolicy: '50% kill fee if dealer cancels after initial production draft submission.',
      },
      milestones: [
        { title: 'Agreement Signed & Escrow Funded', status: 'Completed', timestamp: new Date().toISOString().split('T')[0] },
        { title: 'Creator Review & Counter-Signature', status: 'Pending' },
        { title: 'Video Production & Link Submission', status: 'Pending' },
        { title: 'Dealer Verification & Escrow Release', status: 'Pending' },
      ],
    });

    onClose();
  };

  const handleSignCreator = () => {
    if (!contract || !signatoryName.trim()) return;
    signContractAsCreator(contract.id, signatoryName);
    onClose();
  };

  const handleRelease = () => {
    if (!contract) return;
    approveAndReleaseEscrow(contract.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Escrow Protected Contract
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {contract?.id || 'NEW_AGREEMENT'}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              Digital Sponsorship & Escrow Agreement
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Parties Overview */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Business Dealer (Sponsor)
              </span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {contract ? contract.dealerName : currentDealer.companyName}
              </div>
              <div className="text-slate-500 text-[11px]">Authorized Brand Representative</div>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Content Creator
              </span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">
                {targetCreator?.name}
              </div>
              <div className="text-slate-500 text-[11px] font-mono">{targetCreator?.handle}</div>
            </div>
          </div>

          {/* Escrow Guarantee Banner */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-start gap-3 text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-950">
                100% Milestone Escrow Guarantee
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                When signed, funds are immediately debited from the Business Dealer and held in secure platform escrow. Funds cannot be recalled unilaterally, and are released upon verified deliverable publication.
              </p>
            </div>
          </div>

          {mode === 'create' ? (
            <form onSubmit={handleCreateAndSignDealer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Deal Fee (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    value={fee}
                    onChange={e => setFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Held in escrow until deliverable approval</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category Exclusivity (Days)</label>
                  <input
                    type="number"
                    value={exclusivityDays}
                    onChange={e => setExclusivityDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">No competing brands advertised</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deliverable Scope & Specific Requirements *</label>
                <textarea
                  rows={3}
                  required
                  value={deliverableDesc}
                  onChange={e => setDeliverableDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Legal Clauses */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-[11px] text-slate-600">
                <div className="font-semibold text-slate-900">Standard Platform Legal Clauses:</div>
                <p><strong>1. FTC Disclosure:</strong> Creator agrees to conspicuously display &ldquo;#ad&rdquo; on screen and state verbal sponsorship pursuant to FTC Endorsement Guides.</p>
                <p><strong>2. Escrow Release Condition:</strong> Payout is released within 72 hours of live video link submission, subject to deliverable conformity.</p>
                <p><strong>3. Usage Rights:</strong> 12 Months digital ad usage granted to Business Dealer.</p>
              </div>

              {/* Signature Section */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-2">
                <div className="font-semibold text-indigo-950 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-600" />
                  Dealer Digital Signature & Escrow Authorization
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Type Full Legal Name as Signature:</label>
                  <input
                    type="text"
                    required
                    value={signatoryName}
                    onChange={e => setSignatoryName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-indigo-200 rounded bg-white font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    required
                    checked={acknowledgedTerms}
                    onChange={e => setAcknowledgedTerms(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-[11px] text-slate-700">
                    I authorize the immediate locking of <strong>₹{Number(fee).toLocaleString()}</strong> into secure escrow.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!acknowledgedTerms}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Sign & Fund Escrow (₹{Number(fee).toLocaleString()})
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
                  <span className="text-slate-500">Agreed Escrow Fee:</span>
                  <span className="font-mono text-base font-bold text-emerald-600">
                    ₹{contract?.feeAmount.toLocaleString()} INR
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Escrow Security State:</span>
                  <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {contract?.escrowStatus}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 block mb-1">Deliverable Scope:</span>
                  <p className="text-slate-800 bg-slate-50 p-2 rounded">
                    {contract?.terms.deliverableDescription}
                  </p>
                </div>
              </div>

              {/* Digital Signatures Display */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span>Dealer Signature</span>
                    {contract?.dealerSignature?.signed && <CheckCircle className="w-4 h-4 text-emerald-600" />}
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

              {/* Deliverable Proof if submitted */}
              {contract?.submissionProof && (
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs space-y-1">
                  <span className="font-semibold text-sky-900">Submitted Content Proof:</span>
                  <a
                    href={contract.submissionProof.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-700 underline font-mono block break-all"
                  >
                    {contract.submissionProof.url}
                  </a>
                  {contract.submissionProof.notes && (
                    <p className="text-slate-600 italic mt-1">&quot;{contract.submissionProof.notes}&quot;</p>
                  )}
                  <div className="text-[10px] text-slate-400">
                    Submitted on: {contract.submissionProof.submittedAt}
                  </div>
                </div>
              )}

              {/* Actions based on role and contract state */}
              {mode === 'sign_creator' && !contract?.creatorSignature?.signed && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
                  <div className="font-semibold text-emerald-950">Accept & Counter-Sign Agreement</div>
                  <p className="text-[11px] text-emerald-800">
                    By signing, you agree to deliver the video content in exchange for the locked escrow fee of ₹{contract?.feeAmount.toLocaleString()}.
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Creator Legal Signature:</label>
                    <input
                      type="text"
                      value={signatoryName}
                      onChange={e => setSignatoryName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-emerald-300 rounded font-mono text-xs bg-white focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSignCreator}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded cursor-pointer mt-2"
                  >
                    Confirm & Counter-Sign Deal
                  </button>
                </div>
              )}

              {activeRole === 'business' && contract?.escrowStatus === 'DELIVERABLE_SUBMITTED' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-bold text-emerald-950">Deliverable Verified?</div>
                    <div className="text-[11px] text-emerald-800">
                      Release ₹{contract.feeAmount.toLocaleString()} from escrow to creator.
                    </div>
                  </div>
                  <button
                    onClick={handleRelease}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg cursor-pointer"
                  >
                    Approve & Release Escrow
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
