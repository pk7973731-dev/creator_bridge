import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, CheckCircle2, ShieldAlert, FileText, Cpu, Database, UserCheck, Scale } from 'lucide-react';

export const MethodologyModal: React.FC = () => {
  const { showMethodologyModal, setShowMethodologyModal } = useApp();
  const [activeTab, setActiveTab] = useState<'recommendation' | 'fraud' | 'contract' | 'onboarding' | 'dataset'>('recommendation');

  if (!showMethodologyModal) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Platform Architecture & Methodology
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Formulas, fraud heuristics, escrow agreements, and data schemas
            </p>
          </div>
          <button
            onClick={() => setShowMethodologyModal(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('recommendation')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'recommendation'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Recommendation Scoring
          </button>
          <button
            onClick={() => setActiveTab('fraud')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'fraud'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Fraud & Bot Detection
          </button>
          <button
            onClick={() => setActiveTab('contract')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'contract'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Digital Contract & Escrow
          </button>
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'onboarding'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            4. Onboarding Questions
          </button>
          <button
            onClick={() => setActiveTab('dataset')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'dataset'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            5. Free YouTube Data & API
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 leading-relaxed">
          {activeTab === 'recommendation' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/60 rounded-lg border border-indigo-100">
                <h3 className="font-semibold text-indigo-950 text-base flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-600" />
                  On What Basis Do We Recommend a Creator?
                </h3>
                <p className="text-xs text-indigo-900/80 mt-1">
                  Instead of black-box guesses, our recommendation engine evaluates candidates on a 100-point multi-vector weighted matrix tailored to the business owner&apos;s active product launch.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span>1. Niche & Semantic Alignment</span>
                    <span className="font-mono text-indigo-600">35% Weight</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">
                    Analyzes target product category (e.g. Consumer Electronics) against creator&apos;s primary niche, sub-niches (e.g. Wearables, Teardowns), and past video subjects.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span>2. Engagement Authenticity & Health</span>
                    <span className="font-mono text-indigo-600">25% Weight</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">
                    Calculates average views / subscriber ratio and comment interaction velocity. Healthy benchmarks range from 2.5% to 6.5%. Unnatural spikes or &lt;0.5% ratios are heavily downgraded.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span>3. Budget & Rate Compatibility</span>
                    <span className="font-mono text-indigo-600">20% Weight</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">
                    Compares product campaign budget directly against creator&apos;s rate card for the requested deliverable (Integrated, Dedicated, or Shorts).
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span>4. Demographic & Geo Overlap</span>
                    <span className="font-mono text-indigo-600">15% Weight</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">
                    Matches campaign target buyer age distribution (e.g. 18-34) and target sales territory (US, Canada, EU) with creator&apos;s verified analytics audience.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-white md:col-span-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span>5. Dealer Satisfaction & Past Completion Record</span>
                    <span className="font-mono text-indigo-600">5% Weight</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">
                    Verified on-platform completion rate, timeline punctuality, and post-sponsorship brand review ratings (e.g. 4.95 / 5.0).
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 text-xs text-amber-900">
                <span className="font-semibold">Automated Safety Penalty:</span> If our fraud detection heuristics detect bot anomalies or suspicious follower bursts, an automatic <strong className="text-amber-800">-35 point penalty</strong> is imposed and the profile is branded with a prominent Fraud Alert.
              </div>
            </div>
          )}

          {activeTab === 'fraud' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50/60 rounded-lg border border-rose-100">
                <h3 className="font-semibold text-rose-950 text-base flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  Influencer Bot & Engagement Fraud Detection
                </h3>
                <p className="text-xs text-rose-900/80 mt-1">
                  Over 40% of marketing budgets are lost to inflated subscriber counts and click-farm pods. Our system evaluates four distinct forensic signals:
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold text-slate-900 text-xs">A. Follower Velocity & Anomaly Spikes</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Organic creator growth forms a steady logarithmic or linear curve. Sudden surges (+100k followers in 48 hours) without a corresponding viral video release indicates wholesale bot-package purchases.
                  </p>
                </div>

                <div className="p-3 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold text-slate-900 text-xs">B. Follower-to-Interaction Ratio (Click-Farm Disconnect)</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Channels with 800,000 subscribers but only 12,000 views and 40 comments have a 0.05% interaction rate. This severe deviation flags dead or simulated accounts.
                  </p>
                </div>

                <div className="p-3 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold text-slate-900 text-xs">C. Comment NLP & Spam Pattern Detection</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Bot accounts leave repetitive 1-word or emoji strings (&quot;Awesome 🔥&quot;, &quot;Nice post check DM&quot;). Authentic human audiences discuss specific timestamped points and video topics.
                  </p>
                </div>

                <div className="p-3 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold text-slate-900 text-xs">D. Proxy Network & Geographic Outliers</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Detects when a North American English channel has 75% of traffic originating from known data-center IP ranges or unrelated proxy pools.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contract' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/60 rounded-lg border border-emerald-100">
                <h3 className="font-semibold text-emerald-950 text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  Secured Escrow & Digital Milestone Agreements
                </h3>
                <p className="text-xs text-emerald-900/80 mt-1">
                  Protects both parties: Business dealers don&apos;t risk losing money to creators who disappear, and creators are guaranteed payment once deliverables are approved.
                </p>
              </div>

              <ol className="relative border-l border-slate-200 ml-4 space-y-4 text-xs">
                <li className="ml-4">
                  <div className="font-semibold text-slate-900">Step 1: Terms Specification & Generation</div>
                  <p className="text-slate-600 mt-0.5">
                    Dealer selects deliverable (Dedicated Video, 60s Integrated Sponsor, Shorts), exclusivity duration, FTC disclosure terms, and agreed fee.
                  </p>
                </li>
                <li className="ml-4">
                  <div className="font-semibold text-slate-900">Step 2: Business Dealer Signs & Escrow Lock</div>
                  <p className="text-slate-600 mt-0.5">
                    Dealer applies cryptographic digital signature and deposits full deal fee into secure platform escrow.
                  </p>
                </li>
                <li className="ml-4">
                  <div className="font-semibold text-slate-900">Step 3: Creator Inbound Review & Counter-Signature</div>
                  <p className="text-slate-600 mt-0.5">
                    Creator reviews legal terms, accepts proposal, signs digitally, and receives confirmation that funds are locked in escrow.
                  </p>
                </li>
                <li className="ml-4">
                  <div className="font-semibold text-slate-900">Step 4: Production & Proof Submission</div>
                  <p className="text-slate-600 mt-0.5">
                    Creator shoots content, posts video link / unlisted preview, and logs submission timestamp.
                  </p>
                </li>
                <li className="ml-4">
                  <div className="font-semibold text-slate-900">Step 5: Verification & Automated Payout Release</div>
                  <p className="text-slate-600 mt-0.5">
                    Dealer verifies FTC disclosure and talking points, clicks &quot;Approve & Release&quot;, and escrow funds are transferred immediately with transaction receipt.
                  </p>
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'onboarding' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-100 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-slate-700" />
                  What We Ask During Portal Onboarding
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Required data points collected during initial onboarding to feed the recommendation engine:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="font-semibold text-slate-900 mb-2">Business Dealer Onboarding:</div>
                  <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                    <li>Company & Brand Name</li>
                    <li>Industry & Product Category</li>
                    <li>Official Website & Tagline</li>
                    <li>Core Brand Values & Tone of Voice</li>
                    <li>Target Customer Demographics (Age & Region)</li>
                    <li>Typical Campaign Budget Range</li>
                  </ul>
                </div>

                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="font-semibold text-slate-900 mb-2">Creator Portal Onboarding:</div>
                  <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                    <li>Channel Name & Handle (@handle)</li>
                    <li>Primary Platform (YouTube, Instagram, TikTok)</li>
                    <li>Primary Niche & Sub-Niches</li>
                    <li>Verified Subscriber Count & Avg Video Views</li>
                    <li>Engagement Rate Benchmark (%)</li>
                    <li>Standard Deliverable Rate Card (₹)</li>
                    <li>Top Audience Geographies & Age Split</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dataset' && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-50/60 rounded-lg border border-sky-100">
                <h3 className="font-semibold text-sky-950 text-base flex items-center gap-2">
                  <Database className="w-5 h-5 text-sky-600" />
                  Free YouTube Dataset & API Architecture
                </h3>
                <p className="text-xs text-sky-900/80 mt-1">
                  How to fetch and audit YouTube creator data without expensive third-party scrapers:
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <p>
                  <strong>1. Google YouTube Data API v3 (Free Tier):</strong> YouTube provides 10,000 free quota units daily. You can query:
                </p>
                <div className="p-2.5 bg-slate-900 text-slate-100 font-mono text-[11px] rounded-md">
                  GET https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=@handle
                </div>
                <p>
                  This returns official channel subscriber count, lifetime view count, video count, and recent upload playlist ID.
                </p>
                <p>
                  <strong>2. Engagement Calculation:</strong> We calculate engagement by pulling the latest 10 videos via <code>playlistItems</code>, summing likes + comments, and dividing by views:
                </p>
                <div className="p-2.5 bg-slate-100 border border-slate-200 font-mono text-[11px] rounded-md">
                  EngagementRate = (AvgLikes + AvgComments) / AvgViews * 100
                </div>
                <p>
                  <strong>3. Bundled Live Dataset:</strong> For presentation & evaluation submission, CreatorBridge includes an offline verified dataset of vetted creators across Tech, Skincare, Athletics, Finance, and Hardware, plus a live simulation analyzer for arbitrary channel handles!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 flex justify-end bg-slate-50">
          <button
            onClick={() => setShowMethodologyModal(false)}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
