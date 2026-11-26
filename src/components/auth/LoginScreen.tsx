import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  UserCheck,
  ShieldCheck,
  Sparkles,
  FileText,
  TrendingUp,
  LogOut,
  Loader2,
  AlertCircle,
  Youtube,
  ArrowRight,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const {
    authUser,
    needsOnboarding,
    signInWithGoogle,
    logout,
    completeUserOnboarding,
  } = useApp();

  const [selectedRole, setSelectedRole] = useState<'business' | 'creator'>('business');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Business Onboarding Form
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

  // Creator Onboarding Form
  const [creatorForm, setCreatorForm] = useState({
    name: authUser?.displayName || '',
    handle: '@',
    channelUrl: 'https://youtube.com/@',
    niche: 'Tech & Gadgets' as
      | 'Tech & Gadgets'
      | 'Beauty & Skincare'
      | 'Fitness & Health'
      | 'Finance & Crypto'
      | 'Gaming & Hardware'
      | 'Food & Cooking'
      | 'Travel & Lifestyle',
    bio: '',
    subscribers: 50000,
    avgViews: 15000,
    engagementRate: 3.6,
    rateDedicated: 25000,
    rateIntegrated: 12000,
    rateShorts: 5000,
  });

  const [ytLookupBusy, setYtLookupBusy] = useState(false);
  const [ytLookupNote, setYtLookupNote] = useState<string | null>(null);
  const [saveBusy, setSaveBusy] = useState(false);

  const handleGoogleSignIn = async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError(err?.message || 'Google sign-in failed. Please allow popups and try again.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleAutoFillYouTube = async () => {
    const query = creatorForm.handle.trim() || creatorForm.name.trim();
    if (!query || query === '@') {
      setAuthError('Enter your YouTube @handle or channel name first to auto-fill.');
      return;
    }
    setYtLookupBusy(true);
    setAuthError(null);
    setYtLookupNote(null);
    try {
      const res = await fetch(`/api/youtube/channel?handle=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Could not fetch live YouTube channel.');
      }
      setCreatorForm(prev => ({
        ...prev,
        name: data.name || prev.name,
        handle: data.handle || prev.handle,
        channelUrl: data.channelUrl || prev.channelUrl,
        niche: data.inferredNiche || prev.niche,
        bio: (data.description || prev.bio).slice(0, 400),
        subscribers: Number(data.subscribers) || prev.subscribers,
        avgViews: Number(data.avgViews) || prev.avgViews,
        engagementRate: Number(data.engagementRate) || prev.engagementRate,
        rateDedicated: data.suggestedRatesInr?.dedicatedVideo || prev.rateDedicated,
        rateIntegrated: data.suggestedRatesInr?.integrated60s || prev.rateIntegrated,
        rateShorts: data.suggestedRatesInr?.shortsReels || prev.rateShorts,
      }));
      setYtLookupNote(`Loaded live stats for ${data.name} (${Number(data.subscribers).toLocaleString()} subs).`);
    } catch (err: any) {
      setAuthError(err?.message || 'Unable to pull YouTube channel stats.');
    } finally {
      setYtLookupBusy(false);
    }
  };

  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSaveBusy(true);
    try {
      if (selectedRole === 'business') {
        if (!dealerForm.companyName.trim()) {
          throw new Error('Please enter your Company / Brand Name.');
        }
        await completeUserOnboarding({
          role: 'business',
          dealerInput: {
            companyName: dealerForm.companyName.trim(),
            industry: dealerForm.industry,
            website: dealerForm.website.trim() || 'https://example.com',
            tagline: dealerForm.tagline.trim() || 'Direct-to-consumer innovation brand',
            description:
              dealerForm.description.trim() ||
              'Partnering with verified Indian & global content creators for authentic product launches.',
            defaultBudget: Number(dealerForm.defaultBudget) || 25000,
            targetAgeRange: dealerForm.targetAgeRange,
            primaryRegion: dealerForm.primaryRegion,
          },
        });
      } else {
        if (!creatorForm.name.trim()) {
          throw new Error('Please enter your Creator / Channel Name.');
        }
        await completeUserOnboarding({
          role: 'creator',
          creatorInput: {
            name: creatorForm.name.trim(),
            handle: creatorForm.handle.startsWith('@')
              ? creatorForm.handle.trim()
              : `@${creatorForm.handle.trim()}`,
            channelUrl: creatorForm.channelUrl.trim() || 'https://youtube.com',
            niche: creatorForm.niche,
            bio:
              creatorForm.bio.trim() ||
              'Independent creator delivering high-retention reviews and community storytelling.',
            subscribers: Number(creatorForm.subscribers) || 10000,
            avgViews: Number(creatorForm.avgViews) || 3500,
            engagementRate: Number(creatorForm.engagementRate) || 3.2,
            rateDedicated: Number(creatorForm.rateDedicated) || 20000,
            rateIntegrated: Number(creatorForm.rateIntegrated) || 10000,
            rateShorts: Number(creatorForm.rateShorts) || 5000,
          },
        });
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to save your onboarding profile.');
    } finally {
      setSaveBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Brand & Architecture Summary */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-8 flex flex-col justify-between shadow-lg">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-base">
                CB
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">CreatorBridge</h1>
                <p className="text-xs text-slate-400">Dual-Portal Influencer Marketplace</p>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold leading-snug">
                Verified Creator Matching, Trend Radar &amp; INR Escrow
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sign in with your Google account to access persistent Business Dealer campaigns, live YouTube Data API v3 creator audits, Kaggle 2024–25 Indian trend analytics, and digital contracts.
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-start gap-3">
                <Building2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Business Dealer Portal</div>
                  <p className="text-slate-400 mt-0.5">
                    Describe your brand, launch campaigns, score authentic creators, and fund ₹ INR escrow contracts.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Content Creator Studio</div>
                  <p className="text-slate-400 mt-0.5">
                    Sync your YouTube channel metrics, discover rising topics, and sign verified sponsorship agreements.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Real-Time Bot &amp; Engagement Audits</div>
                  <p className="text-slate-400 mt-0.5">
                    Detect fake follower spikes and comment-farm anomalies before committing sponsorship budgets.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Secured by Firebase Auth</span>
            <span>·</span>
            <span>Firestore Cloud Persistence</span>
          </div>
        </div>

        {/* Right Authentication & Onboarding Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col justify-center">
          {!authUser ? (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  Account Sign-In
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">
                  Sign in to CreatorBridge
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Select your primary portal below and authenticate securely with Google. You can switch portals or manage your profile anytime after logging in.
                </p>
              </div>

              {/* Portal Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('business')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedRole === 'business'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Building2
                      className={`w-5 h-5 ${
                        selectedRole === 'business' ? 'text-indigo-600' : 'text-slate-500'
                      }`}
                    />
                    <span className="text-[10px] font-mono uppercase text-slate-400">Portal A</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">Business Dealer</div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Launch products, find matched creators &amp; manage ₹ escrow contracts.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('creator')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedRole === 'creator'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <UserCheck
                      className={`w-5 h-5 ${
                        selectedRole === 'creator' ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                    />
                    <span className="text-[10px] font-mono uppercase text-slate-400">Portal B</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">Content Creator</div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sync YouTube metrics, browse trending topics &amp; accept brand deals.
                  </p>
                </button>
              </div>

              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="button"
                disabled={authBusy}
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-3 shadow-xs cursor-pointer transition-colors"
              >
                {authBusy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"
                    />
                  </svg>
                )}
                <span>
                  {authBusy
                    ? 'Connecting with Google...'
                    : `Continue with Google (${selectedRole === 'business' ? 'Business Dealer' : 'Creator'})`}
                </span>
              </button>

              <p className="text-[11px] text-slate-400 text-center">
                Your profile, campaigns, connections, and signed contracts persist securely in your private cloud workspace.
              </p>
            </div>
          ) : needsOnboarding ? (
            <div className="space-y-5">
              {/* Signed-in Google User Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  {authUser.photoURL ? (
                    <img
                      src={authUser.photoURL}
                      alt={authUser.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                      {(authUser.displayName || authUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {authUser.displayName || 'Signed-in User'}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">{authUser.email}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Onboarding Role Switch */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Complete Your Profile Setup</h2>
                  <p className="text-xs text-slate-500">
                    Tell us about your {selectedRole === 'business' ? 'brand & product goals' : 'creator channel & ₹ rates'} to enter your portal.
                  </p>
                </div>

                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('business')}
                    className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                      selectedRole === 'business' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Business
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('creator')}
                    className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                      selectedRole === 'creator' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Creator
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {ytLookupNote && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                  {ytLookupNote}
                </div>
              )}

              <form onSubmit={handleSubmitOnboarding} className="space-y-3 text-xs">
                {selectedRole === 'business' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Company / Brand Name *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={120}
                          placeholder="e.g. BharatAudio Labs"
                          value={dealerForm.companyName}
                          onChange={e => setDealerForm({ ...dealerForm, companyName: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Industry / Category
                        </label>
                        <select
                          value={dealerForm.industry}
                          onChange={e => setDealerForm({ ...dealerForm, industry: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="Consumer Electronics & Smart Tech">Consumer Electronics &amp; Smart Tech</option>
                          <option value="Beauty, Skincare & Wellness">Beauty, Skincare &amp; Wellness</option>
                          <option value="Fitness, Health & Athletics">Fitness, Health &amp; Athletics</option>
                          <option value="Finance & SaaS">Finance &amp; SaaS</option>
                          <option value="Gaming & Hardware">Gaming &amp; Hardware</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Default Sponsorship Budget (₹ INR)
                        </label>
                        <input
                          type="number"
                          min={500}
                          value={dealerForm.defaultBudget}
                          onChange={e => setDealerForm({ ...dealerForm, defaultBudget: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Primary Target Region
                        </label>
                        <input
                          type="text"
                          maxLength={80}
                          value={dealerForm.primaryRegion}
                          onChange={e => setDealerForm({ ...dealerForm, primaryRegion: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Brand Tagline
                      </label>
                      <input
                        type="text"
                        maxLength={200}
                        placeholder="e.g. Precision audio hardware built for Indian creators"
                        value={dealerForm.tagline}
                        onChange={e => setDealerForm({ ...dealerForm, tagline: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        About Your Brand
                      </label>
                      <textarea
                        rows={2}
                        maxLength={1000}
                        placeholder="Describe your products and ideal creator partners..."
                        value={dealerForm.description}
                        onChange={e => setDealerForm({ ...dealerForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Creator / Channel Name *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={120}
                          placeholder="e.g. Aarav Tech Reviews"
                          value={creatorForm.name}
                          onChange={e => setCreatorForm({ ...creatorForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          YouTube @handle *
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            required
                            maxLength={80}
                            placeholder="@yourhandle"
                            value={creatorForm.handle}
                            onChange={e => setCreatorForm({ ...creatorForm, handle: e.target.value })}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            disabled={ytLookupBusy}
                            onClick={handleAutoFillYouTube}
                            className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                            title="Pull live stats using YouTube Data API v3"
                          >
                            {ytLookupBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Youtube className="w-3.5 h-3.5" />
                            )}
                            <span>Sync</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Primary Niche</label>
                        <select
                          value={creatorForm.niche}
                          onChange={e => setCreatorForm({ ...creatorForm, niche: e.target.value as any })}
                          className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="Tech & Gadgets">Tech &amp; Gadgets</option>
                          <option value="Beauty & Skincare">Beauty &amp; Skincare</option>
                          <option value="Fitness & Health">Fitness &amp; Health</option>
                          <option value="Finance & Crypto">Finance &amp; Crypto</option>
                          <option value="Gaming & Hardware">Gaming &amp; Hardware</option>
                          <option value="Food & Cooking">Food &amp; Cooking</option>
                          <option value="Travel & Lifestyle">Travel &amp; Lifestyle</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Subscribers</label>
                        <input
                          type="number"
                          min={0}
                          value={creatorForm.subscribers}
                          onChange={e => setCreatorForm({ ...creatorForm, subscribers: Number(e.target.value) })}
                          className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">60s Mid-Roll Rate (₹)</label>
                        <input
                          type="number"
                          min={100}
                          value={creatorForm.rateIntegrated}
                          onChange={e => setCreatorForm({ ...creatorForm, rateIntegrated: Number(e.target.value) })}
                          className="w-full px-2.5 py-2 border border-slate-300 rounded-lg font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Channel Bio</label>
                      <textarea
                        rows={2}
                        maxLength={1000}
                        placeholder="Summarize your audience and content format..."
                        value={creatorForm.bio}
                        onChange={e => setCreatorForm({ ...creatorForm, bio: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={saveBusy}
                  className={`w-full py-2.5 px-4 text-white font-semibold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    selectedRole === 'business'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {saveBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>
                    {saveBusy
                      ? 'Creating Workspace...'
                      : `Enter ${selectedRole === 'business' ? 'Business Dealer Portal' : 'Creator Studio'}`}
                  </span>
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
