# BAICONF DATATHON — STAGE 2 FINAL REPORT
## Economic Transformation Using AI

**Project Title:** CreatorBridge — AI-Powered Matching, Fraud Detection, Trend Intelligence & Escrow Infrastructure for an Inclusive Creator Economy  
**Team Name:** VerityX  
**Institution:** Dr. Mahalingam College of Engineering and Technology, Pollachi, Coimbatore, Tamil Nadu  
**Team Members:**
- **Pradeep S** (`727625bad068`) — *Team Leader*
- **Nikith Varshan A** (`727625bad062`)
- **Thapaswine S** (`727625bad117`)
- **Sridevi D** (`727625bad107`)

**Submission Track:** BAICONF Datathon Stage 2 (IIMB DCAL & Analytics Society of India)  
**Submission Date:** November 13, 2026  

---

## Executive Summary

Small businesses (MSMEs) and digital creators represent two of the fastest-growing engines of economic activity, yet they remain severely disconnected due to an **information gap** and **trust deficit**. Businesses routinely select influencers based on vanity metrics (raw subscriber counts), leading to wasted advertising spend, mismatched target audiences, and exposure to bot-inflated accounts. Conversely, high-performing regional and micro-creators—especially the 66% operating outside tier-1 metro hubs—are systematically overlooked and lack transparent pricing, trend visibility, and payment protection.

Building directly upon our Stage 1 proposal (*"AI for a More Efficient and Inclusive Creator Economy"*), Team **VerityX** developed **CreatorBridge**, a full-stack interactive web application featuring two synchronized portals (**Business Dealer Portal** and **Creator Studio Portal**). The platform operationalizes:
1. **Explainable Multi-Vector Creator Recommendation Engine** (weighted 100-point scoring across Niche Alignment, Engagement Health, Budget Compatibility, Demographic/Geographic Overlap, and Dealer Track Record).
2. **Forensic Influencer Fraud & Bot Detection** (identifying follower injection spikes, click-farm engagement disconnects, and comment pod anomalies).
3. **Creator Trend Intelligence** powered by the **YouTube Data API v3** and the **Trending YouTube Video Statistics (2024–25)** Kaggle dataset.
4. **Milestone-Locked Digital Contracts & Simulated Escrow Settlement** with cryptographic verification hashes and full audit/communication logs.

---

## 1. Problem Statement & Economic Impact

### 1.1 The Market Opportunity and Disconnection
As established in our Stage 1 research:
- **Creator Economy Scale:** India's creator base expanded more than 4x from **0.96 million in 2020 to 4.12 million in 2025**, with **66% of creators originating from non-metro regions**. BCG estimates the creator economy grew nearly **25% in 2025 to ~₹4,500 crore**, with global creator-driven commerce projected to exceed **$1 trillion by 2030**.
- **MSME Backbone:** Micro, Small, and Medium Enterprises contribute **~31.1% of GDP** and **48.58% of exports**, with Udyam registrations crossing **8.7 crore in June 2026**.
- **Uneven Monetization:** As highlighted by the ISB–Hashfame report, sustainable growth in the creator economy depends directly on improving the quality and fairness of economic opportunities available to smaller, non-metro creators.

### 1.2 The Core Problem: Matching Failure, Fraud Risk & Payment Friction
Today, brand–creator collaborations fail across three structural bottlenecks:
1. **The Information Gap (Popularity Bias):** Businesses cannot easily verify who actually watches a creator's content. Falling back on raw follower counts distorts unit economics:
   - *Creator A (Large/Metro):* ₹50,000 fee | 500,000 reach | 8% in target city = **40,000 relevant viewers** (**₹1.25 per relevant viewer**).
   - *Creator B (Local/Niche):* ₹20,000 fee | 80,000 reach | 60% in target city = **48,000 relevant viewers** (**₹0.42 per relevant viewer** — nearly **3x more cost-efficient**).
2. **Influencer Fraud & Bot Inflation:** Up to 40% of unvetted sponsorship spend is lost to channels with purchased subscribers, proxy traffic, or repetitive emoji comment pods. Small businesses lack dedicated analysts to audit these signals.
3. **Contractual & Payment Risk:** Informal DM-based deals expose businesses to non-delivery and expose creators to delayed or withheld payments, alongside missing FTC/ASCI sponsorship disclosure compliance.

### 1.3 Three-Tier Economic Impact
| Economic Level | Beneficiary | Measurable Transformation |
| :--- | :--- | :--- |
| **Micro Level** | **MSMEs & Business Dealers** | Eliminates wasted ad spend on irrelevant audiences and bot accounts; lowers Cost Per Relevant Viewer (CPRV) by up to 3x through explainable AI matching. |
| **Meso Level** | **Creators & Non-Metro Regions** | Surfaces high-relevance local/micro-creators (66% non-metro base) directly to paying brands; stabilizes creator income via escrow protection and trend intelligence. |
| **Macro Level** | **Digital Economy** | Improves capital allocation efficiency across 8.7+ crore MSMEs, accelerates regional digital entrepreneurship, and reduces transaction friction in creator commerce. |

---

## 2. Datasets & Data Engineering Pipeline

To ensure reproducible, cost-effective, and realistic execution without relying on paid proprietary scrapers, CreatorBridge integrates **three complementary data layers**:

### 2.1 Primary Open Dataset: Trending YouTube Video Statistics (2024–25) [Kaggle]
- **Source:** Kaggle Open Dataset — *Trending YouTube Video Statistics (2024–25)*.
- **Attributes Utilized:** `video_id`, `title`, `channel_title`, `category_id`, `publish_time`, `tags`, `views`, `likes`, `comment_count`, and regional trending velocity indicators.
- **Role in Application:** Forms the empirical backbone of the **Creator Studio Trend Intelligence Engine** (`TRENDING_TOPICS_DATABASE`). By aggregating category-level momentum from 2024–25 trending records, the platform surfaces rising search themes (e.g., `+142%` to `+210%` growth velocity), monthly search volume estimates, competition saturation (`Low` / `Medium` / `High`), SEO keyword clusters, and commercial sponsor demand across verticals (`Tech & Gadgets`, `Beauty & Skincare`, `Fitness & Health`, `Finance & Crypto`, `Gaming & Hardware`).

### 2.2 Live Telemetry Architecture: Google YouTube Data API v3 (Free Tier)
- **Quota & Access:** Utilizes Google's free tier (**10,000 quota units/day**).
- **Endpoints & Pipeline:**
  1. `GET /youtube/v3/channels?part=snippet,statistics,contentDetails,brandingSettings&forHandle={handle}` — Extracts subscriber counts, cumulative channel views, video counts, country metadata, and the channel's `uploads` playlist ID.
  2. `GET /youtube/v3/playlistItems` — Retrieves the latest 10 public video IDs.
  3. `GET /youtube/v3/videos?part=statistics` — Batch-fetches view, like, and comment counts (1 quota unit per batch) to compute live engagement velocity:
     $$\text{Engagement Rate (\%)} = \frac{\text{Avg Likes} + \text{Avg Comments}}{\text{Avg Views}} \times 100$$
- **In-App Blueprint:** Exposed directly inside the Creator Portal (`CreatorChannelAnalytics.tsx`) showing live endpoint construction, JSON response schema, and engagement math.

### 2.3 Structured Marketplace & Adversarial Evaluation Dataset
- **Curated Profiles (`src/data/mockData.ts`):** Multi-dimensional profiles for verified creators (e.g., *Marcus Vance `@TechPulseVance`*, *Elena Chen `@ElenaGlows`*, *Malik Robinson `@IronMalik`*, *Sophia Sterling `@SterlingWealth`*, *Samir Ray `@PixelForgeTech`*) and Business Dealers (*NovaTech Devices*, *AuraGlow Skincare*, *IronPulse Nutrition*).
- **Adversarial Bot Benchmark:** Includes a synthetic high-risk channel (*ViralHype Studios `@ViralMegaGrowth`*) engineered with realistic bot-farm signatures (890,000 subscribers, 14,000 avg views, 0.38% engagement, +250K 72-hour follower spike, 62% proxy/unknown geography) to validate the fraud detection module.
- **Preprocessing & Persistence:** Normalization of handles, demographic percentage vectors (age buckets `18-24`, `25-34`, `35-44`, `45+` and country shares), rate-card normalization by deliverable type, and browser `localStorage` state persistence (`creatorbridge_v1_*`) enabling zero-friction evaluation without backend database lockouts.

---

## 3. System Architecture & Methodology

CreatorBridge is architected as a modular **React 19 + TypeScript + Tailwind CSS v4** single-page application (with Vite build tooling and Express backend compatibility) organized around two role-based portals and four core analytical engines.

### 3.1 High-Level Architecture Diagram

```text
+-------------------------------------------------------------------------+
|                    CREATORBRIDGE DUAL-PORTAL INTERFACE                  |
|  [Business Dealer Portal]  <--- Switch --->  [Creator Studio Portal]    |
|  - Brand Onboarding & Launch                 - Niche & Rate Onboarding  |
|  - Creator Recommendations                   - Kaggle Trend Intelligence|
|  - Bot & Fraud Scanner                       - YouTube API Inspector    |
|  - Escrow & Message Vault                    - Inbound Deals & Payouts  |
+-----------------------------------+-------------------------------------+
                                    |
        +---------------------------+---------------------------+
        v                           v                           v
+------------------+    +-----------------------+    +--------------------+
| Recommendation   |    | Forensic Fraud        |    | Escrow & Contract  |
| Scoring Engine   |    | Detection Engine      |    | State Machine      |
| (100-pt Matrix)  |    | (Bot Heuristics)      |    | (SHA-256 Hashing)  |
+--------+---------+    +-----------+-----------+    +---------+----------+
         |                          |                          |
         +--------------------------+--------------------------+
                                    v
+-------------------------------------------------------------------------+
|                        DATA & TELEMETRY LAYER                           |
|  1. Kaggle Trending YouTube Video Statistics (2024-25)                  |
|  2. YouTube Data API v3 (Channels / PlaylistItems / Videos)             |
|  3. Persistent Workspace Store (Campaigns, Contracts, Chat Logs)        |
+-------------------------------------------------------------------------+
```

### 3.2 Onboarding Data Collection (Both Portals)
To solve the cold-start matching problem, each portal collects structured signals via the **Demo Persona & Simulated Login Switcher** (`PersonaModal.tsx`):
- **Business Dealer Onboarding:** Company/brand name, industry category, tagline, brand values, target buyer age range, primary target geography, default campaign budget, plus per-product launch specifications (deliverable type, deadline, mandatory talking points).
- **Creator Onboarding:** Creator name, channel handle, platform, primary niche & sub-niches, subscriber count, average video views, engagement rate, verified audience geography & age distribution, and tiered rate card (Dedicated Video, 60s Mid-Roll Integrated, Shorts/Reels).

### 3.3 Explainable Creator Recommendation Algorithm (`src/utils/recommendationEngine.ts`)
Unlike opaque "black-box" recommender systems, CreatorBridge computes a **100-point transparent score** with human-readable explanations (`"Why?"` modal) for every candidate:

$$\text{Match Score} = \text{Clamp}_{[0, 100]}\Big(S_{\text{niche}} + S_{\text{engagement}} + S_{\text{budget}} + S_{\text{audience}} + S_{\text{reputation}} - P_{\text{fraud}}\Big)$$

| Scoring Pillar | Max Weight | Evaluation Logic |
| :--- | :---: | :--- |
| **1. Niche & Semantic Alignment** | **35 pts** | Direct 1:1 category match = 35 pts; adjacent crossover (e.g., Tech & Gaming, Fitness & Wearables) = 24 pts; unrelated = 8 pts. |
| **2. Engagement Authenticity & Health** | **25 pts** | Prime organic benchmark ($3.0\%–7.0\%$ engagement and credibility $\ge 90$) = 25 pts; healthy ($\ge 1.8\%$ & credibility $\ge 80$) = 20 pts; depressed ($<1.0\%$) = 6 pts. |
| **3. Budget & Rate Compatibility** | **20 pts** | Budget $\ge 100\%$ of deliverable rate = 20 pts; within 15% negotiation band = 16 pts; 35% gap = 10 pts; severe mismatch = 4 pts. |
| **4. Audience & Geo Overlap** | **15 pts** | Evaluates core purchasing age concentration (`18-34` $\ge 65\%$) and Tier-1/target market regional density. |
| **5. Dealer Track Record** | **5 pts** | Historical brand rating ($\ge 4.8/5.0$) and completed escrow deal volume ($\ge 15$ deals) = 5 pts. |
| **Safety Override: Fraud Penalty** | **-35 pts** | Automated deduction of **35 points** for `HIGH_RISK_SUSPICIOUS` profiles (or **-12 points** for `MODERATE_CAUTION`), overriding vanity follower counts. |

### 3.4 Forensic Fraud & Bot Detection Heuristics (`src/utils/fraudDetection.ts`)
The `analyzeInfluencerAuthenticity` module audits both pre-seeded channels and arbitrary user-submitted handles across four forensic signals:
1. **Follower-to-Interaction Disconnect:** Channels with $>500\text{K}$ subscribers and $<0.6\%$ engagement receive a `-35` credibility deduction and `+32%` fake-follower estimate.
2. **Comment-to-Like Velocity Ratio:** Flags click-farm like-only inflation ($\text{Comments}/\text{Likes} < 0.005$ on $>50\text{K}$ accounts) and artificial engagement pods ($\text{Comments}/\text{Likes} > 0.35$ with $>15\%$ engagement).
3. **Growth Trajectory Classification:** Differentiates `Organic Continuous` curves from `Gradual Viral` and `Abrupt Bot Spike` bursts (e.g., $+120\text{K}$ to $+250\text{K}$ followers in 48–72 hours without an underlying viral upload).
4. **Risk Stratification:** Classifies channels into `VERIFIED_SAFE`, `MODERATE_CAUTION`, or `HIGH_RISK_SUSPICIOUS` with itemized diagnostic flags.

### 3.5 Digital Contract & Milestone Escrow Workflow
To eliminate payment default and deliverable disputes, the contract engine enforces a deterministic state machine:
1. **Draft & Terms Specification:** Defines fee, deliverable scope, category exclusivity window (e.g., 14–30 days), mandatory FTC/ASCI `#ad` disclosure rules, revision limits, and 12-month usage rights.
2. **Dealer Digital Signature & Escrow Lock:** Generates a cryptographic validation hash (`SHA256:cb_...`) binding contract ID, parties, fee, and UTC timestamp, transitioning status to `ESCROW_FUNDED_ACTIVE`.
3. **Creator Counter-Signature & Production:** Creator reviews locked escrow proof in their portal, counter-signs, and films content.
4. **Proof Submission & Payout Release:** Creator submits live/unlisted video URL (`DELIVERABLE_SUBMITTED`); Business Dealer verifies talking points and disclosure, then clicks **"Verify & Release Escrow"** (`APPROVED_PAYOUT_RELEASED`), updating both parties' contract repositories and communication logs.

---

## 4. Tools, Frameworks & Implementation Stack

| Layer | Technologies & Tools Used | Purpose in CreatorBridge |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19, TypeScript, Vite 8 | Type-safe dual-portal SPA architecture with modular business/creator components. |
| **Styling & Design System** | Tailwind CSS v4, Lucide React, Plus Jakarta Sans & JetBrains Mono | High-legibility SaaS dashboard layout, tabular numerals (`tabular-nums`) for financial/metric alignment, clean unboxed metadata. |
| **AI & Algorithmic Logic** | Custom Multi-Vector Scoring Engine & Heuristic Fraud Classifier | Deterministic, explainable match scoring, bot penalty enforcement, and cryptographic contract hashing. |
| **External Data & APIs** | Google YouTube Data API v3 (Architecture & Schema), Kaggle *Trending YouTube Video Statistics (2024–25)* | Channel telemetry extraction blueprint (`channels`, `playlistItems`, `videos`) and historical niche trend forecasting. |
| **State & Persistence** | React Context API (`AppContext.tsx`) + Browser `localStorage` | Real-time cross-portal synchronization (a contract funded in Business Portal immediately appears in Creator Portal) with one-click demo reset. |
| **Asset Generation** | AI Studio Image Generation (`generate_image`) | Photorealistic studio portraits for creator personas and product launch photography. |

---

## 5. Evaluation Method & Experimental Validation

We evaluated CreatorBridge across **technical correctness**, **economic efficiency**, and **adversarial fraud resilience**:

### 5.1 Matching & Cost-Efficiency Validation
Using the active launch campaign *NexusPulse Biometric Smartwatch* (`Tech & Gadgets`, `₹2,500` budget, `60s Integrated Sponsor`), the recommendation engine ranked 6 candidate channels:
* **Top Match:** *Marcus Vance (`@TechPulseVance`)* achieved **97/100 Match** (35/35 Niche, 25/25 Engagement Health at 4.2%, 20/20 Budget Fit at ₹2,100 rate vs ₹2,500 budget, 12/15 Audience Overlap, 5/5 Dealer Reputation).
* **Adjacent Match:** *Samir "Pixel" Ray (`@PixelForgeTech`)* (`Gaming & Hardware`) scored **86/100** due to adjacent hardware overlap and strong 4.8% engagement.
* **Cross-Niche Filtering:** *Elena Chen (`@ElenaGlows`)* (`Beauty & Skincare`) scored lower on the smartwatch campaign (**65/100**) because of category mismatch, while automatically rising to **98/100** when switching the active campaign to *AuraGlow Deep Sea Ceramide Renewal Serum*.

### 5.2 Adversarial Fraud Detection Test
To verify that popularity bias cannot exploit the matching engine, *ViralHype Studios (`@ViralMegaGrowth`)* was seeded with the highest subscriber count in the dataset (**890,000 subscribers**) and matching `Tech & Gadgets` category:
* **Without Fraud Guardrails:** A naive follower-count system would rank `@ViralMegaGrowth` #1.
* **With CreatorBridge Fraud Scanner:** The heuristic engine detected a `0.38%` engagement rate, `48.7%` estimated fake followers, `428` bot comment patterns, and an `Abrupt Bot Spike` growth curve—assigning a **32/100 Credibility Score**, applying the **-35 point safety penalty**, and demoting the channel to **`High Risk Warning`** at the bottom of recommendations.

### 5.3 End-to-End Cross-Portal Functional Verification
* **Build & Type Safety:** Verified zero TypeScript errors (`tsc --noEmit`) and clean production Vite bundling.
* **Cross-Portal State Sync:** Verified that launching a new product campaign, drafting/signing an escrow contract as a Business Dealer, switching to the Creator Studio via the **Demo Persona Switcher**, counter-signing, submitting a YouTube proof URL, and releasing escrow funds as the Business Dealer completes end-to-end without page reload or data loss.

---

## 6. Key Results, Insights & Demo Walkthrough

*(Note: Insert captured screenshots from the live CreatorBridge web app under each subsection below before PDF export.)*

### 6.1 Business Dealer Portal — Hub & Campaign Launcher
* **Capabilities:** Displays active brand profile (*NovaTech Devices*), protected escrow balance (`₹2,200`), audited creator count, and active product campaigns. The **Launch New Product** modal lets dealers define product category, deliverable format, escrow budget, target buyer persona, and mandatory talking points—immediately recalculating all creator match scores.
* *[Demo Screenshot Placeholder 1: Business Dealer Dashboard & Product Campaign Launcher]*

### 6.2 Explainable Creator Recommendations & "Why?" Inspector
* **Capabilities:** Ranks creators by match percentage with inline filters for Niche, Risk Profile (`Verified Authentic Only` vs `Flagged Bot Accounts`), and live search. Clicking **"Why?"** opens the 5-pillar score breakdown modal explaining exact points earned and any fraud penalties applied.
* *[Demo Screenshot Placeholder 2: Creator Recommendations Grid & 5-Pillar Match Breakdown Modal]*

### 6.3 Influencer Fraud & Bot Scanner
* **Capabilities:** Interactive forensic dashboard allowing dealers to test pre-seeded creators or input any custom `@handle`, follower count, average likes, average comments, and growth trajectory to generate a real-time Credibility Score (`0–100`), Fake Follower %, Engagement Anomaly status, and itemized audit log.
* *[Demo Screenshot Placeholder 3: Fraud Detector Audit Report showing Verified Creator vs. Bot-Flagged Channel]*

### 6.4 Creator Studio — Kaggle Trending Topics & YouTube API Inspector
* **Capabilities:** Surfaces niche-filtered viral topics from the **Trending YouTube Video Statistics (2024–25)** Kaggle dataset with growth percentages (`+142%` to `+210%`), search volume, recommended video hooks, SEO tags, and one-click **"Copy Pitch"**. Includes the **Channel & Rate Card Desk** displaying audience age/geo distributions and the **Free YouTube Data API v3 Blueprint**.
* *[Demo Screenshot Placeholder 4: Creator Studio Trending Topics & YouTube Channel Analytics]*

### 6.5 Digital Contracts, Escrow Vault & Communication Logs
* **Capabilities:** Unified contract and messaging repository in both portals. Supports SHA-256 digital signing, milestone progress tracking, live deliverable URL submission by creators, and one-click escrow payout release by dealers.
* *[Demo Screenshot Placeholder 5: Digital Escrow Contract Modal & Cross-Portal Message Vault]*

---

## 7. Instructions to Run the Live Prototype

1. **Launch Application:** Open the deployed web application URL or run locally via `npm install && npm run dev` (serves on `http://localhost:3000`).
2. **Switch Portals:** Use the **Business | Creator** segmented toggle in the top navigation bar.
3. **Test Simulated Logins ("False Login" System):** Click **Demo Persona Switcher** in the header to switch between pre-seeded Brands (*NovaTech Devices*, *AuraGlow Skincare*, *IronPulse Nutrition*), Creators (*Marcus Vance*, *Elena Chen*, *Malik Robinson*, *Sophia Sterling*, *Samir Ray*), the bot test account (*ViralHype Studios*), or register a custom Brand/Creator profile.
4. **Execute End-to-End Flow:**
   - In **Business** mode: Launch a product -> Inspect **Creator Recommendations** -> Click **"Why?"** -> Audit `@ViralMegaGrowth` in **Fraud & Bot Scanner** -> Click **Send Deal** to sign and lock escrow.
   - Switch to **Creator** mode (for that creator): View **Trending Topics** -> Open **Inbound Deals & Escrow** -> Counter-sign & submit a video URL -> Switch back to **Business** mode -> **Verify & Release Escrow**.

---

## 8. Challenges & Limitations

1. **YouTube API Rate Limits & Private Demographics:** While public channel statistics and video engagement are accessible via the YouTube Data API v3 free tier (10,000 units/day), granular viewer age/gender splits require creator-authorized OAuth 2.0 (`YouTube Analytics API`). Our prototype models these demographic vectors directly in creator onboarding and bridges public data with a deterministic simulation fallback.
2. **Evolving Bot Sophistication:** Click-farms increasingly mimic human timing and staggered drip-fed followers. Static threshold rules alone can be bypassed over time, necessitating longitudinal time-series anomaly detection in production.
3. **Cold-Start Reputation for New Creators:** Newly onboarded micro-creators lack on-platform dealer ratings (5% weight). We mitigate this by keeping track-record weight modest (5%) while weighting niche relevance (35%) and organic engagement health (25%) heavily so talented newcomers still surface at the top.
4. **Browser-Local Demo Persistence:** To guarantee zero-downtime evaluation without external database credential failures, the submission prototype persists state in `localStorage` rather than a live payment gateway (Razorpay/Stripe Connect) or cloud SQL instance.

---

## 9. Conclusions & Recommendations

CreatorBridge demonstrates that **AI-driven matching infrastructure can transform the creator economy from a vanity-driven guesswork market into an efficient, equitable digital marketplace**:
- **For MSMEs & Business Dealers:** Prioritizing **audience fit, engagement authenticity, and cost-per-relevant-viewer** over raw subscriber count unlocks ~3x higher marketing efficiency while insulating budgets from bot fraud.
- **For Micro & Non-Metro Creators:** Transparent rate cards, niche trend forecasting (grounded in 2024–25 YouTube trending data), and escrow-backed digital contracts formalize creator work and bridge the metro/non-metro income gap.
- **Recommendation for Adoption:** Industry bodies and MSME networks should standardize verifiable engagement-to-follower audits and milestone escrow templates as default procurement practices for influencer marketing.

---

## 10. Implementation, Real-World Impact & Future Work

1. **Live OAuth & YouTube Analytics Integration:** Connect Google OAuth 2.0 (`yt-analytics.readonly`) so creators can authenticate in one click to stream verified first-party age, gender, and city-level viewership directly into the matching engine.
2. **Semantic NLP Embeddings & LLM Brief Assistant:** Upgrade category matching to dense vector embeddings (e.g., Gemini text embeddings over video transcripts and product briefs) and automated vernacular multilingual support (Tamil, Hindi, Telugu, Bengali) to serve India's 66% non-metro creator base.
3. **Production Payment Escrow Rails:** Integrate UPI Autopay / Razorpay Route / Stripe Connect Escrow APIs with GST invoicing and automated TDS compliance for Indian MSME–creator payouts.
4. **Closed-Loop ROI Attribution:** Feed post-campaign UTM click-through and conversion telemetry back into the **Learn** stage of our Stage 1 loop (`Collect -> Prepare -> Match -> Learn`), continuously calibrating weights based on real sales conversions.
