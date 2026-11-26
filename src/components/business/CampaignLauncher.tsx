import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Sparkles, X, Layers, Calendar, DollarSign, Target } from 'lucide-react';

interface CampaignLauncherProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CampaignLauncher: React.FC<CampaignLauncherProps> = ({ isOpen, onClose }) => {
  const { currentDealer, createCampaign } = useApp();

  const [form, setForm] = useState({
    productName: '',
    productTagline: '',
    productCategory: 'Tech & Gadgets',
    description: '',
    targetAudience: 'Tech early adopters, professionals 22-40',
    deliverableNeeded: '60s Integrated Sponsor' as const,
    budget: currentDealer.defaultBudget || 3000,
    deadline: '2026-12-30',
    talkingPoints: 'Highlight 14-day battery life\nUnboxing experience\nSpecial 20% community discount code',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productName.trim()) return;

    createCampaign({
      dealerId: currentDealer.id,
      dealerName: currentDealer.companyName,
      productName: form.productName,
      productTagline: form.productTagline || 'Revolutionary consumer launch',
      productCategory: form.productCategory,
      productImage: '/src/assets/images/product_launch_device_1794494846556.jpg',
      description: form.description || 'New product launch seeking high-converting creator integrations.',
      targetAudience: form.targetAudience,
      deliverableNeeded: form.deliverableNeeded,
      budget: Number(form.budget),
      deadline: form.deadline,
      keyTalkingPoints: form.talkingPoints.split('\n').map(s => s.trim()).filter(Boolean),
      status: 'Active',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Launch New Product Campaign
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Creator recommendations will dynamically recalculate for this product
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Ultra ANC Headphones"
              value={form.productName}
              onChange={e => setForm({ ...form, productName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product Tagline</label>
            <input
              type="text"
              placeholder="e.g. Studio-grade lossless wireless acoustics"
              value={form.productTagline}
              onChange={e => setForm({ ...form, productTagline: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Category</label>
              <select
                value={form.productCategory}
                onChange={e => setForm({ ...form, productCategory: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
              >
                <option value="Tech & Gadgets">Tech & Gadgets</option>
                <option value="Beauty & Skincare">Beauty & Skincare</option>
                <option value="Fitness & Health">Fitness & Health</option>
                <option value="Finance & Crypto">Finance & Crypto</option>
                <option value="Gaming & Hardware">Gaming & Hardware</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Deliverable Needed</label>
              <select
                value={form.deliverableNeeded}
                onChange={e => setForm({ ...form, deliverableNeeded: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
              >
                <option value="60s Integrated Sponsor">60s Integrated Sponsor</option>
                <option value="Dedicated YouTube Video">Dedicated YouTube Video</option>
                <option value="Shorts / Reels">Shorts / Reels</option>
                <option value="Multi-Deliverable Package">Multi-Deliverable Package</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Escrow Budget Allocation (₹) *</label>
              <input
                type="number"
                required
                value={form.budget}
                onChange={e => setForm({ ...form, budget: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Campaign Launch Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Audience & Buyer Persona</label>
            <input
              type="text"
              placeholder="e.g. Remote software developers, audio engineers, commuter professionals"
              value={form.targetAudience}
              onChange={e => setForm({ ...form, targetAudience: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mandatory Talking Points (1 per line)</label>
            <textarea
              rows={3}
              value={form.talkingPoints}
              onChange={e => setForm({ ...form, talkingPoints: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
            />
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              Launch Product & Match Creators
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
