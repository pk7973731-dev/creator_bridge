import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Building2, UserCheck, Plus, RotateCcw, Check, LogOut } from 'lucide-react';

export const PersonaModal: React.FC = () => {
  const {
    authUser,
    logout,
    showPersonaModal,
    setShowPersonaModal,
    activeRole,
    dealers,
    creators,
    currentDealer,
    currentCreator,
    switchDealer,
    switchCreator,
    registerNewDealer,
    registerNewCreator,
    resetAllData,
  } = useApp();

  const [mode, setMode] = useState<'pick' | 'custom_dealer' | 'custom_creator'>('pick');

  // Custom dealer form state
  const [dealerForm, setDealerForm] = useState({
    companyName: '',
    industry: 'Consumer Electronics & Smart Tech',
    website: 'https://',
    tagline: '',
    description: '',
    defaultBudget: 25000,
    targetAgeRange: '18-34',
    primaryRegion: 'India',
  });

  // Custom creator form state
  const [creatorForm, setCreatorForm] = useState({
    name: '',
    handle: '@',
    channelUrl: 'https://youtube.com/@',
    platform: 'YouTube' as const,
    niche: 'Tech & Gadgets' as const,
    subNiches: 'Reviews, Tutorials',
    bio: '',
    subscribers: 150000,
    avgViews: 45000,
    engagementRate: 3.5,
    rateDedicated: 2500,
    rateIntegrated: 1200,
    rateShorts: 600,
  });

  if (!showPersonaModal) return null;

  const handleCreateDealer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerForm.companyName.trim()) return;

    registerNewDealer({
      companyName: dealerForm.companyName,
      industry: dealerForm.industry,
      website: dealerForm.website,
      tagline: dealerForm.tagline || 'Leading innovation brand',
      description: dealerForm.description || 'Innovative brand seeking genuine creator partnerships.',
      defaultBudget: Number(dealerForm.defaultBudget),
      brandValues: ['Innovation', 'Quality', 'Integrity'],
      targetDemographics: {
        ageRange: dealerForm.targetAgeRange,
        primaryRegion: dealerForm.primaryRegion,
      },
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=160&auto=format&fit=crop&q=80',
    });

    setMode('pick');
    setShowPersonaModal(false);
  };

  const handleCreateCreator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorForm.name.trim()) return;

    registerNewCreator({
      name: creatorForm.name,
      handle: creatorForm.handle.startsWith('@') ? creatorForm.handle : `@${creatorForm.handle}`,
      channelUrl: creatorForm.channelUrl,
      platform: creatorForm.platform,
      niche: creatorForm.niche,
      subNiches: creatorForm.subNiches.split(',').map(s => s.trim()).filter(Boolean),
      bio: creatorForm.bio || 'Passionate creator sharing honest opinions with my community.',
      subscribers: Number(creatorForm.subscribers),
      avgViews: Number(creatorForm.avgViews),
      engagementRate: Number(creatorForm.engagementRate),
      rates: {
        dedicatedVideo: Number(creatorForm.rateDedicated),
        integrated60s: Number(creatorForm.rateIntegrated),
        shortsReels: Number(creatorForm.rateShorts),
      },
      avatar: '/src/assets/images/creator_avatar_tech_1794494846107.jpg',
      demographics: {
        topCountries: [
          { country: 'United States', percent: 55 },
          { country: 'Canada', percent: 20 },
          { country: 'UK', percent: 15 },
        ],
        ageDistribution: [
          { range: '18-24', percent: 35 },
          { range: '25-34', percent: 45 },
          { range: '35-44', percent: 15 },
          { range: '45+', percent: 5 },
        ],
        genderRatio: { male: 50, female: 50 },
      },
    });

    setMode('pick');
    setShowPersonaModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Brand &amp; Creator Profile Switcher
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {authUser?.email
                ? `Signed in as ${authUser.email} · Switch or create a brand or creator profile`
                : 'Select or register a Business Dealer or Content Creator profile'}
            </p>
          </div>
          <button
            onClick={() => {
              setMode('pick');
              setShowPersonaModal(false);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {mode === 'pick' && (
            <>
              {/* Business Dealers Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    Select Business Dealer Account
                  </h3>
                  <button
                    onClick={() => setMode('custom_dealer')}
                    className="text-xs text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Brand Login
                  </button>
                </div>
                <div className="space-y-2">
                  {dealers.map(d => {
                    const isCurrent = activeRole === 'business' && currentDealer.id === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => {
                          switchDealer(d.id);
                          setShowPersonaModal(false);
                        }}
                        className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isCurrent
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={d.avatar}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                              {d.companyName}
                              {isCurrent && (
                                <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-medium">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate max-w-sm">{d.tagline}</p>
                            <span className="text-[11px] text-slate-400">{d.industry}</span>
                          </div>
                        </div>
                        {isCurrent && <Check className="w-5 h-5 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Creators Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    Select Content Creator Account
                  </h3>
                  <button
                    onClick={() => setMode('custom_creator')}
                    className="text-xs text-emerald-600 font-medium hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Creator Login
                  </button>
                </div>
                <div className="space-y-2">
                  {creators.map(c => {
                    const isCurrent = activeRole === 'creator' && currentCreator.id === c.id;
                    const isFlagged = c.authenticityReport.riskLevel === 'HIGH_RISK_SUSPICIOUS';
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          switchCreator(c.id);
                          setShowPersonaModal(false);
                        }}
                        className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isCurrent
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                            : isFlagged
                            ? 'border-rose-200 bg-rose-50/20 hover:bg-rose-50/40'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={c.avatar}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                              {c.name}
                              <span className="text-xs font-normal text-slate-500">{c.handle}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-medium">
                                  Active
                                </span>
                              )}
                              {isFlagged && (
                                <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-semibold border border-rose-300">
                                  Flagged Bot Test
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                              <span>{c.niche}</span>
                              <span>·</span>
                              <span className="font-mono tabular-nums">{c.subscribers.toLocaleString()} subs</span>
                              <span>·</span>
                              <span className="font-mono tabular-nums">{c.engagementRate}% eng</span>
                            </div>
                          </div>
                        </div>
                        {isCurrent && <Check className="w-5 h-5 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Custom Dealer Registration / False Login */}
          {mode === 'custom_dealer' && (
            <form onSubmit={handleCreateDealer} className="space-y-4 text-xs">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900">
                <strong>Simulated Brand Onboarding:</strong> Enter custom company attributes to test how the recommendation algorithm adapts.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lumina Smart Home"
                  value={dealerForm.companyName}
                  onChange={e => setDealerForm({ ...dealerForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Industry / Category</label>
                  <select
                    value={dealerForm.industry}
                    onChange={e => setDealerForm({ ...dealerForm, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Consumer Electronics & Smart Tech">Consumer Electronics & Smart Tech</option>
                    <option value="Beauty, Skincare & Wellness">Beauty, Skincare & Wellness</option>
                    <option value="Fitness, Health & Athletics">Fitness, Health & Athletics</option>
                    <option value="Finance & SaaS">Finance & SaaS</option>
                    <option value="Gaming & Hardware">Gaming & Hardware</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Campaign Budget (₹)</label>
                  <input
                    type="number"
                    value={dealerForm.defaultBudget}
                    onChange={e => setDealerForm({ ...dealerForm, defaultBudget: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Next-generation smart ambient home sensors"
                  value={dealerForm.tagline}
                  onChange={e => setDealerForm({ ...dealerForm, tagline: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Brand Description</label>
                <textarea
                  rows={2}
                  placeholder="What makes your products unique? Who is your ideal customer?"
                  value={dealerForm.description}
                  onChange={e => setDealerForm({ ...dealerForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setMode('pick')}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Save & Login as Brand
                </button>
              </div>
            </form>
          )}

          {/* Custom Creator Registration / False Login */}
          {mode === 'custom_creator' && (
            <form onSubmit={handleCreateCreator} className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-900">
                <strong>Simulated Creator Onboarding:</strong> Enter creator metrics and rates to test inbound campaign deals and trending topics.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Creator Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan River"
                    value={creatorForm.name}
                    onChange={e => setCreatorForm({ ...creatorForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Handle *</label>
                  <input
                    type="text"
                    required
                    placeholder="@jordancreates"
                    value={creatorForm.handle}
                    onChange={e => setCreatorForm({ ...creatorForm, handle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Niche</label>
                  <select
                    value={creatorForm.niche}
                    onChange={e => setCreatorForm({ ...creatorForm, niche: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Tech & Gadgets">Tech & Gadgets</option>
                    <option value="Beauty & Skincare">Beauty & Skincare</option>
                    <option value="Fitness & Health">Fitness & Health</option>
                    <option value="Finance & Crypto">Finance & Crypto</option>
                    <option value="Gaming & Hardware">Gaming & Hardware</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subscribers / Followers</label>
                  <input
                    type="number"
                    value={creatorForm.subscribers}
                    onChange={e => setCreatorForm({ ...creatorForm, subscribers: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dedicated Fee (₹)</label>
                  <input
                    type="number"
                    value={creatorForm.rateDedicated}
                    onChange={e => setCreatorForm({ ...creatorForm, rateDedicated: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">60s Mid-roll (₹)</label>
                  <input
                    type="number"
                    value={creatorForm.rateIntegrated}
                    onChange={e => setCreatorForm({ ...creatorForm, rateIntegrated: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shorts / Reel (₹)</label>
                  <input
                    type="number"
                    value={creatorForm.rateShorts}
                    onChange={e => setCreatorForm({ ...creatorForm, rateShorts: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setMode('pick')}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Save & Login as Creator
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {mode === 'pick' && (
          <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-4">
              <button
                onClick={resetAllData}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 font-medium cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Local Sandbox
              </button>
              {authUser && (
                <button
                  onClick={() => {
                    setShowPersonaModal(false);
                    logout();
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1.5 font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              )}
            </div>
            <button
              onClick={() => setShowPersonaModal(false)}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
