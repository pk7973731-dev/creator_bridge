import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  OperationType,
  handleFirestoreError,
  BLUEPRINT_LIMITS,
  sanitizeText,
  sanitizeId,
} from '../firebase';
import {
  UserRole,
  CreatorProfile,
  BusinessDealerProfile,
  ProductCampaign,
  DealContract,
  ConnectionLog,
  TrendingTopic,
  MessageLog,
} from '../types';
import {
  SAMPLE_DEALERS,
  SAMPLE_CREATORS,
  INITIAL_CAMPAIGNS,
  INITIAL_CONTRACTS,
  INITIAL_CONNECTIONS,
  TRENDING_TOPICS_DATABASE,
} from '../data/mockData';
import { generateDigitalContractHash } from '../utils/fraudDetection';

export interface LiveChannelAuditPayload {
  channelId: string;
  name: string;
  handle: string;
  description: string;
  avatar: string;
  country: string;
  channelUrl: string;
  subscribers: number;
  avgViews: number;
  engagementRate: number;
  suggestedRatesInr: {
    dedicatedVideo: number;
    integrated60s: number;
    shortsReels: number;
  };
  inferredNiche: CreatorProfile['niche'];
  recentVideos: {
    id: string;
    title: string;
    publishedAt: string;
    views: number;
  }[];
  authenticityReport: CreatorProfile['authenticityReport'];
}

export interface OnboardingPayload {
  role: UserRole;
  dealerInput?: {
    companyName: string;
    industry: string;
    website: string;
    tagline: string;
    description: string;
    defaultBudget: number;
    targetAgeRange: string;
    primaryRegion: string;
  };
  creatorInput?: {
    name: string;
    handle: string;
    channelUrl: string;
    niche: CreatorProfile['niche'];
    bio: string;
    subscribers: number;
    avgViews: number;
    engagementRate: number;
    rateDedicated: number;
    rateIntegrated: number;
    rateShorts: number;
  };
}

interface UserAccountDoc {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  dealerProfileId?: string;
  creatorProfileId?: string;
}

type CreatorWithOwner = CreatorProfile & { ownerUid?: string };
type DealerWithOwner = BusinessDealerProfile & { ownerUid?: string };
type CampaignWithOwner = ProductCampaign & { ownerUid?: string };
type ContractWithOwners = DealContract & { dealerUid?: string; creatorUid?: string };
type ConnectionWithOwners = ConnectionLog & { dealerUid?: string; creatorUid?: string };

interface AppContextType {
  // Firebase Authentication State
  authUser: User | null;
  authLoading: boolean;
  needsOnboarding: boolean;
  userAccount: UserAccountDoc | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  completeUserOnboarding: (payload: OnboardingPayload) => Promise<void>;

  // Portal & Marketplace State
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  currentDealer: BusinessDealerProfile;
  currentCreator: CreatorProfile;
  dealers: BusinessDealerProfile[];
  creators: CreatorProfile[];
  campaigns: ProductCampaign[];
  contracts: DealContract[];
  connections: ConnectionLog[];
  trendingTopics: TrendingTopic[];
  selectedCampaignId: string;
  setSelectedCampaignId: (id: string) => void;
  showMethodologyModal: boolean;
  setShowMethodologyModal: (show: boolean) => void;
  showPersonaModal: boolean;
  setShowPersonaModal: (show: boolean) => void;

  // Actions
  switchDealer: (dealerId: string) => void;
  switchCreator: (creatorId: string) => void;
  createCampaign: (campaignData: Omit<ProductCampaign, 'id' | 'createdAt'>) => string;
  createContract: (
    contractData: Omit<DealContract, 'id' | 'createdAt' | 'updatedAt' | 'dealerSignature' | 'creatorSignature'>
  ) => string;
  signContractAsDealer: (contractId: string, signatoryName: string) => void;
  signContractAsCreator: (contractId: string, signatoryName: string) => void;
  submitDeliverableProof: (contractId: string, url: string, notes?: string) => void;
  approveAndReleaseEscrow: (contractId: string) => void;
  initiateConnection: (creatorId: string, campaignId?: string, message?: string) => string;
  sendMessage: (connectionId: string, text: string) => void;
  updateCreatorProfile: (profile: Partial<CreatorProfile>) => void;
  updateDealerProfile: (profile: Partial<BusinessDealerProfile>) => void;
  registerNewCreator: (
    creator: Omit<CreatorProfile, 'id' | 'authenticityReport' | 'pastDealsCompleted' | 'avgDealerRating' | 'sampleVideos'>
  ) => string;
  registerNewDealer: (dealer: Omit<BusinessDealerProfile, 'id'>) => string;
  importLiveYouTubeCreator: (audit: LiveChannelAuditPayload) => string;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function formatFirestoreTimestamp(ts: unknown): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toISOString().split('T')[0];
  }
  if (ts && typeof ts === 'object' && 'toDate' in ts && typeof (ts as any).toDate === 'function') {
    return (ts as any).toDate().toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

function formatFirestoreDateTime(ts: unknown): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  }
  if (ts && typeof ts === 'object' && 'toDate' in ts && typeof (ts as any).toDate === 'function') {
    return (ts as any).toDate().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  }
  return new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}

function hydrateDealerDoc(data: any): DealerWithOwner {
  return {
    id: data.id,
    ownerUid: data.ownerUid,
    companyName: data.companyName,
    tagline: data.tagline || '',
    industry: data.industry,
    website: data.website || '',
    brandValues: Array.isArray(data.brandValues) ? data.brandValues : ['Quality', 'Authenticity'],
    targetDemographics: {
      ageRange: data.targetAgeRange || '18-34',
      primaryRegion: data.primaryRegion || 'India',
    },
    defaultBudget: Number(data.defaultBudget) || 25000,
    avatar: data.avatar || '/src/assets/images/product_launch_device_1794494846556.jpg',
    description: data.description || '',
  };
}

function hydrateCreatorDoc(data: any): CreatorWithOwner {
  return {
    id: data.id,
    ownerUid: data.ownerUid,
    name: data.name,
    handle: data.handle,
    avatar: data.avatar || '/src/assets/images/creator_avatar_tech_1794494846107.jpg',
    channelUrl: data.channelUrl || 'https://youtube.com',
    platform: data.platform || 'YouTube',
    niche: data.niche || 'Tech & Gadgets',
    subNiches: Array.isArray(data.subNiches) ? data.subNiches : ['Verified Channel'],
    bio: data.bio || '',
    subscribers: Number(data.subscribers) || 0,
    avgViews: Number(data.avgViews) || 0,
    engagementRate: Number(data.engagementRate) || 0,
    rates: {
      dedicatedVideo: Number(data.rateDedicated) || 25000,
      integrated60s: Number(data.rateIntegrated) || 12000,
      shortsReels: Number(data.rateShorts) || 5000,
    },
    demographics: {
      topCountries: [
        { country: 'India', percent: 74 },
        { country: 'Global', percent: 26 },
      ],
      ageDistribution: [
        { range: '18-24', percent: 38 },
        { range: '25-34', percent: 42 },
        { range: '35-44', percent: 15 },
        { range: '45+', percent: 5 },
      ],
      genderRatio: { male: 58, female: 42 },
    },
    authenticityReport: {
      riskLevel: data.riskLevel || 'VERIFIED_SAFE',
      credibilityScore: Number(data.credibilityScore) || 92,
      fakeFollowersEstimatePct: Number(data.fakeFollowersEstimatePct) || 3.1,
      engagementAnomaly: 'Normal',
      botPatternCount: 0,
      growthCurveType: 'Organic Continuous',
      commentAuthenticityScore: Number(data.credibilityScore) || 92,
      auditFlags: ['Authenticated Firebase Creator Profile', 'Organic baseline engagement verified'],
      scanDate: formatFirestoreTimestamp(data.updatedAt),
    },
    pastDealsCompleted: 0,
    avgDealerRating: 5.0,
    sampleVideos: [
      { title: 'Creator Showcase & Sponsorship Format', views: `${Math.round((Number(data.avgViews) || 10000) / 1000)}K`, uploadDate: 'Recent', duration: '11:20' },
    ],
  };
}

function hydrateCampaignDoc(data: any): CampaignWithOwner {
  return {
    id: data.id,
    ownerUid: data.ownerUid,
    dealerId: data.dealerId,
    dealerName: data.dealerName,
    productName: data.productName,
    productTagline: data.productTagline || '',
    productCategory: data.productCategory,
    description: data.description || '',
    targetAudience: data.targetAudience || '18-34 India',
    deliverableNeeded: data.deliverableNeeded || '60s Integrated Sponsor',
    budget: Number(data.budget) || 0,
    deadline: data.deadline || '2026-12-31',
    keyTalkingPoints: Array.isArray(data.keyTalkingPoints) ? data.keyTalkingPoints : [],
    status: data.status || 'Active',
    createdAt: formatFirestoreTimestamp(data.createdAt),
  };
}

function hydrateContractDoc(data: any): ContractWithOwners {
  const status = data.escrowStatus as DealContract['escrowStatus'];
  const createdStr = formatFirestoreTimestamp(data.createdAt);
  const updatedStr = formatFirestoreTimestamp(data.updatedAt);

  return {
    id: data.id,
    dealerUid: data.dealerUid,
    creatorUid: data.creatorUid,
    campaignId: data.campaignId,
    campaignTitle: data.campaignTitle,
    dealerId: data.dealerId,
    dealerName: data.dealerName,
    creatorId: data.creatorId,
    creatorName: data.creatorName,
    creatorHandle: data.creatorHandle,
    deliverable: data.deliverable,
    feeAmount: Number(data.feeAmount) || 0,
    escrowStatus: status,
    terms: {
      deliverableDescription: data.deliverable,
      exclusivityDays: 14,
      disclosureRequirement: 'Clear #ad disclosure & verbal sponsor acknowledgment in first 30s',
      approvalWindowDays: 3,
      revisionsIncluded: 2,
      usageRights: '90-day brand digital & social repost rights',
      cancellationPolicy: 'Full escrow refund if cancelled prior to draft submission',
    },
    dealerSignature: data.dealerSigned
      ? {
          signed: true,
          signatoryName: data.dealerSignatoryName || `${data.dealerName} Representative`,
          signedAt: formatFirestoreDateTime(data.createdAt),
          digitalHash: data.dealerDigitalHash || 'CB-SHA256-DEALER',
        }
      : undefined,
    creatorSignature: data.creatorSigned
      ? {
          signed: true,
          signatoryName: data.creatorSignatoryName || data.creatorName,
          signedAt: formatFirestoreDateTime(data.updatedAt),
          digitalHash: data.creatorDigitalHash || 'CB-SHA256-CREATOR',
        }
      : undefined,
    submissionProof: data.submissionUrl
      ? {
          url: data.submissionUrl,
          submittedAt: formatFirestoreDateTime(data.updatedAt),
          notes: data.submissionNotes,
        }
      : undefined,
    milestones: [
      {
        title: 'Digital Contract & Escrow Funded',
        status: 'Completed',
        timestamp: createdStr,
      },
      {
        title: 'Creator Signed Agreement',
        status: data.creatorSigned ? 'Completed' : 'Pending',
        timestamp: data.creatorSigned ? updatedStr : undefined,
      },
      {
        title: 'Deliverable Draft Submission & Review',
        status:
          status === 'APPROVED_PAYOUT_RELEASED'
            ? 'Completed'
            : status === 'DELIVERABLE_SUBMITTED'
            ? 'In Review'
            : 'Pending',
        timestamp:
          status === 'DELIVERABLE_SUBMITTED' || status === 'APPROVED_PAYOUT_RELEASED'
            ? updatedStr
            : undefined,
      },
      {
        title: 'Escrow Funds Released to Creator',
        status: status === 'APPROVED_PAYOUT_RELEASED' ? 'Completed' : 'Pending',
        timestamp: status === 'APPROVED_PAYOUT_RELEASED' ? updatedStr : undefined,
      },
    ],
    createdAt: createdStr,
    updatedAt: updatedStr,
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [userAccount, setUserAccount] = useState<UserAccountDoc | null>(null);
  const [userAccountLoaded, setUserAccountLoaded] = useState<boolean>(false);

  const [activeRole, setActiveRoleState] = useState<UserRole>('business');

  // Cloud Firestore collections
  const [fsDealers, setFsDealers] = useState<DealerWithOwner[]>([]);
  const [fsCreators, setFsCreators] = useState<CreatorWithOwner[]>([]);
  const [fsCampaigns, setFsCampaigns] = useState<CampaignWithOwner[]>([]);
  const [fsDealerContracts, setFsDealerContracts] = useState<ContractWithOwners[]>([]);
  const [fsCreatorContracts, setFsCreatorContracts] = useState<ContractWithOwners[]>([]);
  const [fsDealerConnections, setFsDealerConnections] = useState<ConnectionWithOwners[]>([]);
  const [fsCreatorConnections, setFsCreatorConnections] = useState<ConnectionWithOwners[]>([]);
  const [fsMessagesByConn, setFsMessagesByConn] = useState<Record<string, MessageLog[]>>({});

  // Local fallback/sandbox state (curated sample accounts + live API imports)
  const [localDealers, setLocalDealers] = useState<DealerWithOwner[]>(SAMPLE_DEALERS);
  const [localCreators, setLocalCreators] = useState<CreatorWithOwner[]>(SAMPLE_CREATORS);
  const [localCampaigns, setLocalCampaigns] = useState<CampaignWithOwner[]>(INITIAL_CAMPAIGNS);
  const [localContracts, setLocalContracts] = useState<ContractWithOwners[]>(INITIAL_CONTRACTS);
  const [localConnections, setLocalConnections] = useState<ConnectionWithOwners[]>(INITIAL_CONNECTIONS);

  const [currentDealerId, setCurrentDealerId] = useState<string>(SAMPLE_DEALERS[0].id);
  const [currentCreatorId, setCurrentCreatorId] = useState<string>(SAMPLE_CREATORS[0].id);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(INITIAL_CAMPAIGNS[0].id);

  const [trendingTopics] = useState<TrendingTopic[]>(TRENDING_TOPICS_DATABASE);
  const [showMethodologyModal, setShowMethodologyModal] = useState<boolean>(false);
  const [showPersonaModal, setShowPersonaModal] = useState<boolean>(false);

  // 1. Firebase Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      setAuthUser(user);
      if (!user) {
        setUserAccount(null);
        setUserAccountLoaded(true);
        setFsDealers([]);
        setFsCreators([]);
        setFsCampaigns([]);
        setFsDealerContracts([]);
        setFsCreatorContracts([]);
        setFsDealerConnections([]);
        setFsCreatorConnections([]);
        setFsMessagesByConn({});
        setAuthLoading(false);
        return;
      }

      setUserAccountLoaded(false);
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data() as UserAccountDoc;
          setUserAccount(data);
          setActiveRoleState(data.role || 'business');
          if (data.dealerProfileId) setCurrentDealerId(data.dealerProfileId);
          if (data.creatorProfileId) setCurrentCreatorId(data.creatorProfileId);
        } else {
          setUserAccount(null);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      } finally {
        setUserAccountLoaded(true);
        setAuthLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // 2. Attach Real-Time Firestore Listeners ONLY when user is authenticated & onboarded
  useEffect(() => {
    if (!authUser || !userAccount) return;

    const uid = authUser.uid;

    const unsubDealers = onSnapshot(
      query(collection(db, 'dealers'), where('isPublic', '==', true)),
      snap => {
        setFsDealers(snap.docs.map(d => hydrateDealerDoc(d.data())));
      },
      err => handleFirestoreError(err, OperationType.LIST, 'dealers')
    );

    const unsubCreators = onSnapshot(
      query(collection(db, 'creators'), where('isPublic', '==', true)),
      snap => {
        setFsCreators(snap.docs.map(d => hydrateCreatorDoc(d.data())));
      },
      err => handleFirestoreError(err, OperationType.LIST, 'creators')
    );

    const unsubCampaigns = onSnapshot(
      query(collection(db, 'campaigns'), where('isPublic', '==', true)),
      snap => {
        const list = snap.docs.map(d => hydrateCampaignDoc(d.data()));
        setFsCampaigns(list);
        if (list.length > 0) {
          setSelectedCampaignId(prev => (list.some(c => c.id === prev) ? prev : list[0].id));
        }
      },
      err => handleFirestoreError(err, OperationType.LIST, 'campaigns')
    );

    const unsubContractsDealer = onSnapshot(
      query(collection(db, 'contracts'), where('dealerUid', '==', uid)),
      snap => {
        setFsDealerContracts(snap.docs.map(d => hydrateContractDoc(d.data())));
      },
      err => handleFirestoreError(err, OperationType.LIST, 'contracts')
    );

    const unsubContractsCreator = onSnapshot(
      query(collection(db, 'contracts'), where('creatorUid', '==', uid)),
      snap => {
        setFsCreatorContracts(snap.docs.map(d => hydrateContractDoc(d.data())));
      },
      err => handleFirestoreError(err, OperationType.LIST, 'contracts')
    );

    const unsubConnDealer = onSnapshot(
      query(collection(db, 'connections'), where('dealerUid', '==', uid)),
      snap => {
        setFsDealerConnections(
          snap.docs.map(d => {
            const data = d.data();
            return {
              id: data.id,
              dealerUid: data.dealerUid,
              creatorUid: data.creatorUid,
              dealerId: data.dealerId,
              dealerName: data.dealerName,
              creatorId: data.creatorId,
              creatorName: data.creatorName,
              creatorHandle: data.creatorHandle,
              campaignId: data.campaignId,
              campaignTitle: data.campaignTitle,
              status: data.status || 'Connected',
              createdAt: formatFirestoreTimestamp(data.createdAt),
              lastMessage: data.lastMessage || '',
              lastMessageTime: formatFirestoreTimestamp(data.updatedAt),
              messages: [],
            };
          })
        );
      },
      err => handleFirestoreError(err, OperationType.LIST, 'connections')
    );

    const unsubConnCreator = onSnapshot(
      query(collection(db, 'connections'), where('creatorUid', '==', uid)),
      snap => {
        setFsCreatorConnections(
          snap.docs.map(d => {
            const data = d.data();
            return {
              id: data.id,
              dealerUid: data.dealerUid,
              creatorUid: data.creatorUid,
              dealerId: data.dealerId,
              dealerName: data.dealerName,
              creatorId: data.creatorId,
              creatorName: data.creatorName,
              creatorHandle: data.creatorHandle,
              campaignId: data.campaignId,
              campaignTitle: data.campaignTitle,
              status: data.status || 'Connected',
              createdAt: formatFirestoreTimestamp(data.createdAt),
              lastMessage: data.lastMessage || '',
              lastMessageTime: formatFirestoreTimestamp(data.updatedAt),
              messages: [],
            };
          })
        );
      },
      err => handleFirestoreError(err, OperationType.LIST, 'connections')
    );

    return () => {
      unsubDealers();
      unsubCreators();
      unsubCampaigns();
      unsubContractsDealer();
      unsubContractsCreator();
      unsubConnDealer();
      unsubConnCreator();
    };
  }, [authUser, userAccount]);

  // 3. Subscribe to message subcollections for active Firestore connections
  const mergedFsConnections = useMemo(() => {
    const map = new Map<string, ConnectionWithOwners>();
    for (const c of [...fsDealerConnections, ...fsCreatorConnections]) {
      map.set(c.id, c);
    }
    return Array.from(map.values());
  }, [fsDealerConnections, fsCreatorConnections]);

  const fsConnIdsKey = useMemo(
    () => mergedFsConnections.map(c => c.id).sort().join(','),
    [mergedFsConnections]
  );

  useEffect(() => {
    if (!authUser || !userAccount || mergedFsConnections.length === 0) return;

    const unsubs = mergedFsConnections.map(conn => {
      const msgQuery = query(
        collection(db, 'connections', conn.id, 'messages'),
        where(conn.dealerUid === authUser.uid ? 'dealerUid' : 'creatorUid', '==', authUser.uid)
      );
      return onSnapshot(
        msgQuery,
        snap => {
          const msgs: MessageLog[] = snap.docs
            .map(m => {
              const md = m.data();
              const sortMs =
                md.createdAt && typeof md.createdAt.toMillis === 'function'
                  ? md.createdAt.toMillis()
                  : Date.now();
              return {
                sortMs,
                msg: {
                  id: md.id,
                  senderId: md.senderUid,
                  senderRole: md.senderRole,
                  text: md.text,
                  timestamp: formatFirestoreDateTime(md.createdAt),
                } as MessageLog,
              };
            })
            .sort((a, b) => a.sortMs - b.sortMs)
            .map(item => item.msg);
          setFsMessagesByConn(prev => ({ ...prev, [conn.id]: msgs }));
        },
        err => handleFirestoreError(err, OperationType.LIST, `connections/${conn.id}/messages`)
      );
    });

    return () => {
      unsubs.forEach(u => u());
    };
  }, [authUser, userAccount, fsConnIdsKey]);

  // Merge Firestore live records + curated sample catalog
  const dealers = useMemo<DealerWithOwner[]>(() => {
    const map = new Map<string, DealerWithOwner>();
    for (const d of localDealers) map.set(d.id, d);
    for (const d of fsDealers) map.set(d.id, d);
    return Array.from(map.values());
  }, [fsDealers, localDealers]);

  const creators = useMemo<CreatorWithOwner[]>(() => {
    const map = new Map<string, CreatorWithOwner>();
    for (const c of localCreators) map.set(c.id, c);
    for (const c of fsCreators) map.set(c.id, c);
    return Array.from(map.values());
  }, [fsCreators, localCreators]);

  const campaigns = useMemo<CampaignWithOwner[]>(() => {
    const map = new Map<string, CampaignWithOwner>();
    for (const c of fsCampaigns) map.set(c.id, c);
    for (const c of localCampaigns) {
      if (!map.has(c.id)) map.set(c.id, c);
    }
    return Array.from(map.values());
  }, [fsCampaigns, localCampaigns]);

  const contracts = useMemo<ContractWithOwners[]>(() => {
    const map = new Map<string, ContractWithOwners>();
    for (const c of [...fsDealerContracts, ...fsCreatorContracts]) map.set(c.id, c);
    for (const c of localContracts) {
      if (!map.has(c.id)) map.set(c.id, c);
    }
    return Array.from(map.values());
  }, [fsDealerContracts, fsCreatorContracts, localContracts]);

  const connections = useMemo<ConnectionWithOwners[]>(() => {
    const map = new Map<string, ConnectionWithOwners>();
    for (const c of mergedFsConnections) {
      const msgs = fsMessagesByConn[c.id];
      map.set(c.id, {
        ...c,
        messages: msgs && msgs.length > 0 ? msgs : [
          {
            id: `init_${c.id}`,
            senderId: c.dealerId,
            senderRole: 'business',
            text: c.lastMessage,
            timestamp: c.lastMessageTime,
          },
        ],
      });
    }
    for (const c of localConnections) {
      if (!map.has(c.id)) map.set(c.id, c);
    }
    return Array.from(map.values());
  }, [mergedFsConnections, fsMessagesByConn, localConnections]);

  const currentDealer = useMemo(() => {
    return (
      dealers.find(d => d.id === currentDealerId) ||
      dealers.find(d => authUser && d.ownerUid === authUser.uid) ||
      dealers[0] ||
      SAMPLE_DEALERS[0]
    );
  }, [dealers, currentDealerId, authUser]);

  const currentCreator = useMemo(() => {
    return (
      creators.find(c => c.id === currentCreatorId) ||
      creators.find(c => authUser && c.ownerUid === authUser.uid) ||
      creators[0] ||
      SAMPLE_CREATORS[0]
    );
  }, [creators, currentCreatorId, authUser]);

  // Auth Actions
  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const ensureDealerProfileInFirestore = useCallback(async (): Promise<DealerWithOwner> => {
    if (!authUser) return currentDealer;
    const expectedId = sanitizeId(`dealer_${authUser.uid}`);
    const existing = dealers.find(d => d.id === expectedId || d.ownerUid === authUser.uid);
    if (existing) return existing;

    const newDealerPayload = {
      id: expectedId,
      ownerUid: authUser.uid,
      companyName: sanitizeText(authUser.displayName ? `${authUser.displayName}'s Brand` : 'My Brand', BLUEPRINT_LIMITS.NAME_MAX, 'My Brand'),
      industry: 'Consumer Electronics & Smart Tech',
      website: 'https://creatorbridge.app',
      tagline: 'Direct-to-consumer creator partner brand',
      description: 'Launched via CreatorBridge verified Business Dealer workspace.',
      avatar: sanitizeText(authUser.photoURL, BLUEPRINT_LIMITS.AVATAR_MAX, '/src/assets/images/product_launch_device_1794494846556.jpg'),
      defaultBudget: 25000,
      targetAgeRange: '18-34',
      primaryRegion: 'India',
      brandValues: ['Quality', 'Transparency', 'Innovation'],
      isPublic: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'dealers', expectedId), newDealerPayload);
      if (userAccount) {
        await updateDoc(doc(db, 'users', authUser.uid), {
          dealerProfileId: expectedId,
          updatedAt: serverTimestamp(),
        });
      }
      setCurrentDealerId(expectedId);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `dealers/${expectedId}`);
    }
    return hydrateDealerDoc(newDealerPayload);
  }, [authUser, currentDealer, dealers, userAccount]);

  const completeUserOnboarding = async (payload: OnboardingPayload) => {
    if (!authUser) throw new Error('Must be signed in with Google first.');
    const uid = sanitizeId(authUser.uid);
    const batch = writeBatch(db);

    const userDocData: Record<string, unknown> = {
      uid,
      email: sanitizeText(authUser.email, 200, 'user@creatorbridge.app'),
      displayName: sanitizeText(authUser.displayName, BLUEPRINT_LIMITS.NAME_MAX, 'CreatorBridge User'),
      photoURL: sanitizeText(authUser.photoURL, BLUEPRINT_LIMITS.AVATAR_MAX, ''),
      role: payload.role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    let createdDealerId: string | undefined;
    let createdCreatorId: string | undefined;

    if (payload.role === 'business' && payload.dealerInput) {
      createdDealerId = sanitizeId(`dealer_${uid}`);
      userDocData.dealerProfileId = createdDealerId;
      batch.set(doc(db, 'dealers', createdDealerId), {
        id: createdDealerId,
        ownerUid: uid,
        companyName: sanitizeText(payload.dealerInput.companyName, BLUEPRINT_LIMITS.NAME_MAX, 'My Brand'),
        industry: sanitizeText(payload.dealerInput.industry, 100, 'Consumer Electronics & Smart Tech'),
        website: sanitizeText(payload.dealerInput.website, BLUEPRINT_LIMITS.URL_MAX, 'https://example.com'),
        tagline: sanitizeText(payload.dealerInput.tagline, BLUEPRINT_LIMITS.TAGLINE_MAX, 'Brand Partner'),
        description: sanitizeText(payload.dealerInput.description, BLUEPRINT_LIMITS.DESCRIPTION_MAX, 'Brand profile'),
        avatar: sanitizeText(authUser.photoURL, BLUEPRINT_LIMITS.AVATAR_MAX, '/src/assets/images/product_launch_device_1794494846556.jpg'),
        defaultBudget: Math.max(0, Number(payload.dealerInput.defaultBudget) || 25000),
        targetAgeRange: sanitizeText(payload.dealerInput.targetAgeRange, 40, '18-34'),
        primaryRegion: sanitizeText(payload.dealerInput.primaryRegion, 80, 'India'),
        brandValues: ['Quality', 'Integrity', 'Innovation'],
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (payload.role === 'creator' && payload.creatorInput) {
      createdCreatorId = sanitizeId(`creator_${uid}`);
      userDocData.creatorProfileId = createdCreatorId;
      batch.set(doc(db, 'creators', createdCreatorId), {
        id: createdCreatorId,
        ownerUid: uid,
        name: sanitizeText(payload.creatorInput.name, BLUEPRINT_LIMITS.NAME_MAX, 'Creator'),
        handle: sanitizeText(payload.creatorInput.handle, BLUEPRINT_LIMITS.HANDLE_MAX, '@creator'),
        channelUrl: sanitizeText(payload.creatorInput.channelUrl, BLUEPRINT_LIMITS.URL_MAX, 'https://youtube.com'),
        platform: 'YouTube',
        niche: payload.creatorInput.niche,
        subNiches: ['Verified Account', 'YouTube'],
        bio: sanitizeText(payload.creatorInput.bio, BLUEPRINT_LIMITS.DESCRIPTION_MAX, 'Content Creator'),
        avatar: sanitizeText(authUser.photoURL, BLUEPRINT_LIMITS.AVATAR_MAX, '/src/assets/images/creator_avatar_tech_1794494846107.jpg'),
        subscribers: Math.max(0, Number(payload.creatorInput.subscribers) || 0),
        avgViews: Math.max(0, Number(payload.creatorInput.avgViews) || 0),
        engagementRate: Math.min(100, Math.max(0, Number(payload.creatorInput.engagementRate) || 3.2)),
        rateDedicated: Math.max(0, Number(payload.creatorInput.rateDedicated) || 20000),
        rateIntegrated: Math.max(0, Number(payload.creatorInput.rateIntegrated) || 10000),
        rateShorts: Math.max(0, Number(payload.creatorInput.rateShorts) || 5000),
        credibilityScore: 94,
        riskLevel: 'VERIFIED_SAFE',
        fakeFollowersEstimatePct: 2.5,
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    batch.set(doc(db, 'users', uid), userDocData);

    try {
      await batch.commit();
      setUserAccount({
        uid,
        email: String(userDocData.email),
        displayName: String(userDocData.displayName),
        photoURL: String(userDocData.photoURL),
        role: payload.role,
        dealerProfileId: createdDealerId,
        creatorProfileId: createdCreatorId,
      });
      setActiveRoleState(payload.role);
      if (createdDealerId) setCurrentDealerId(createdDealerId);
      if (createdCreatorId) setCurrentCreatorId(createdCreatorId);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
    }
  };

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    if (authUser && userAccount) {
      updateDoc(doc(db, 'users', authUser.uid), {
        role,
        updatedAt: serverTimestamp(),
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${authUser.uid}`));
    }
  };

  const switchDealer = (dealerId: string) => {
    setCurrentDealerId(dealerId);
    setActiveRole('business');
  };

  const switchCreator = (creatorId: string) => {
    setCurrentCreatorId(creatorId);
    setActiveRole('creator');
  };

  const createCampaign = (campaignData: Omit<ProductCampaign, 'id' | 'createdAt'>): string => {
    const newId = sanitizeId(`camp_${Date.now()}`);
    const newCamp: CampaignWithOwner = {
      ...campaignData,
      id: newId,
      ownerUid: authUser?.uid,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setLocalCampaigns(prev => [newCamp, ...prev]);
    setSelectedCampaignId(newId);

    if (authUser) {
      (async () => {
        const dealerOwner = await ensureDealerProfileInFirestore();
        try {
          await setDoc(doc(db, 'campaigns', newId), {
            id: newId,
            ownerUid: authUser.uid,
            dealerId: dealerOwner.id,
            dealerName: sanitizeText(dealerOwner.companyName, BLUEPRINT_LIMITS.NAME_MAX, 'Brand'),
            productName: sanitizeText(campaignData.productName, BLUEPRINT_LIMITS.TITLE_MAX, 'Product Launch'),
            productTagline: sanitizeText(campaignData.productTagline, BLUEPRINT_LIMITS.TAGLINE_MAX, ''),
            productCategory: sanitizeText(campaignData.productCategory, 80, 'Tech & Gadgets'),
            description: sanitizeText(campaignData.description, BLUEPRINT_LIMITS.DESCRIPTION_MAX, ''),
            targetAudience: sanitizeText(campaignData.targetAudience, 200, '18-34 India'),
            budget: Math.max(0, Number(campaignData.budget) || 0),
            deliverableNeeded: campaignData.deliverableNeeded,
            status: campaignData.status || 'Active',
            deadline: sanitizeText(campaignData.deadline, 40, '2026-12-31'),
            keyTalkingPoints: (campaignData.keyTalkingPoints || []).slice(0, BLUEPRINT_LIMITS.LIST_MAX).map(t => sanitizeText(t, 160)),
            isPublic: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `campaigns/${newId}`);
        }
      })();
    }

    return newId;
  };

  const initiateConnection = (creatorId: string, campaignId?: string, message?: string): string => {
    const targetCreator = creators.find(c => c.id === creatorId) as CreatorWithOwner | undefined;
    const targetCamp = campaigns.find(c => c.id === campaignId);
    const existing = connections.find(c => c.dealerId === currentDealer.id && c.creatorId === creatorId);

    if (existing) {
      if (message) {
        sendMessage(existing.id, message);
      }
      return existing.id;
    }

    const newId = sanitizeId(`conn_${Date.now()}`);
    const initialText = sanitizeText(
      message ||
        `Hello ${targetCreator?.name || 'there'}! We are interested in partnering with you for ${targetCamp?.productName || 'our brand'}.`,
      BLUEPRINT_LIMITS.MESSAGE_MAX
    );

    const dealerUid = authUser?.uid || 'local_dealer';
    const creatorUid = targetCreator?.ownerUid || authUser?.uid || 'local_creator';

    const newConn: ConnectionWithOwners = {
      id: newId,
      dealerUid,
      creatorUid,
      dealerId: currentDealer.id,
      dealerName: currentDealer.companyName,
      creatorId,
      creatorName: targetCreator?.name || 'Creator',
      creatorHandle: targetCreator?.handle || '@creator',
      campaignId,
      campaignTitle: targetCamp?.productName,
      status: 'Connected',
      createdAt: new Date().toISOString().split('T')[0],
      lastMessage: initialText,
      lastMessageTime: 'Just now',
      messages: [
        {
          id: `m_${Date.now()}`,
          senderId: currentDealer.id,
          senderRole: 'business',
          text: initialText,
          timestamp: 'Just now',
        },
      ],
    };

    setLocalConnections(prev => [newConn, ...prev]);

    if (authUser) {
      (async () => {
        try {
          const payload: Record<string, unknown> = {
            id: newId,
            dealerUid: authUser.uid,
            creatorUid,
            dealerId: sanitizeId(currentDealer.id),
            dealerName: sanitizeText(currentDealer.companyName, BLUEPRINT_LIMITS.NAME_MAX, 'Brand'),
            creatorId: sanitizeId(creatorId),
            creatorName: sanitizeText(targetCreator?.name, BLUEPRINT_LIMITS.NAME_MAX, 'Creator'),
            creatorHandle: sanitizeText(targetCreator?.handle, BLUEPRINT_LIMITS.HANDLE_MAX, '@creator'),
            status: 'Connected',
            lastMessage: initialText,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          if (campaignId) payload.campaignId = sanitizeId(campaignId);
          if (targetCamp?.productName) payload.campaignTitle = sanitizeText(targetCamp.productName, BLUEPRINT_LIMITS.TITLE_MAX);

          await setDoc(doc(db, 'connections', newId), payload);

          const msgId = sanitizeId(`msg_${Date.now()}`);
          const batch = writeBatch(db);
          batch.set(doc(db, 'connections', newId, 'messages', msgId), {
            id: msgId,
            dealerUid: authUser.uid,
            creatorUid,
            senderUid: authUser.uid,
            senderRole: 'business',
            text: initialText,
            createdAt: serverTimestamp(),
          });
          batch.update(doc(db, 'connections', newId), {
            lastMessage: initialText,
            updatedAt: serverTimestamp(),
          });
          await batch.commit();
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `connections/${newId}`);
        }
      })();
    }

    return newId;
  };

  const sendMessage = (connectionId: string, text: string) => {
    const cleanText = sanitizeText(text, BLUEPRINT_LIMITS.MESSAGE_MAX);
    if (!cleanText) return;

    const senderRole = activeRole;
    const senderId = activeRole === 'business' ? currentDealer.id : currentCreator.id;
    const msgId = sanitizeId(`msg_${Date.now()}`);

    const newMsg: MessageLog = {
      id: msgId,
      senderId,
      senderRole,
      text: cleanText,
      timestamp: 'Just now',
    };

    setLocalConnections(prev =>
      prev.map(c =>
        c.id === connectionId
          ? { ...c, lastMessage: cleanText, lastMessageTime: 'Just now', messages: [...c.messages, newMsg] }
          : c
      )
    );

    const targetFsConn = mergedFsConnections.find(c => c.id === connectionId);
    if (authUser && targetFsConn) {
      const batch = writeBatch(db);
      batch.set(doc(db, 'connections', connectionId, 'messages', msgId), {
        id: msgId,
        dealerUid: targetFsConn.dealerUid || authUser.uid,
        creatorUid: targetFsConn.creatorUid || authUser.uid,
        senderUid: authUser.uid,
        senderRole,
        text: cleanText,
        createdAt: serverTimestamp(),
      });
      batch.update(doc(db, 'connections', connectionId), {
        lastMessage: cleanText,
        updatedAt: serverTimestamp(),
      });
      batch.commit().catch(err =>
        handleFirestoreError(err, OperationType.WRITE, `connections/${connectionId}/messages/${msgId}`)
      );
    }
  };

  const createContract = (
    contractData: Omit<DealContract, 'id' | 'createdAt' | 'updatedAt' | 'dealerSignature' | 'creatorSignature'>
  ): string => {
    const newId = sanitizeId(`contract_${Date.now()}`);
    const hash = generateDigitalContractHash(
      newId,
      contractData.dealerName,
      contractData.creatorName,
      contractData.feeAmount
    );
    const targetCreator = creators.find(c => c.id === contractData.creatorId) as CreatorWithOwner | undefined;
    const creatorUid = targetCreator?.ownerUid || authUser?.uid || 'local_creator';

    const newContract: ContractWithOwners = {
      ...contractData,
      id: newId,
      dealerUid: authUser?.uid,
      creatorUid,
      escrowStatus: 'ESCROW_FUNDED_ACTIVE',
      dealerSignature: {
        signed: true,
        signatoryName: `${contractData.dealerName} Authorized Representative`,
        signedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        digitalHash: hash,
      },
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setLocalContracts(prev => [newContract, ...prev]);

    if (authUser) {
      setDoc(doc(db, 'contracts', newId), {
        id: newId,
        dealerUid: authUser.uid,
        creatorUid,
        dealerId: sanitizeId(contractData.dealerId),
        dealerName: sanitizeText(contractData.dealerName, BLUEPRINT_LIMITS.NAME_MAX, 'Dealer'),
        creatorId: sanitizeId(contractData.creatorId),
        creatorName: sanitizeText(contractData.creatorName, BLUEPRINT_LIMITS.NAME_MAX, 'Creator'),
        creatorHandle: sanitizeText(contractData.creatorHandle, BLUEPRINT_LIMITS.HANDLE_MAX, '@creator'),
        campaignId: sanitizeId(contractData.campaignId),
        campaignTitle: sanitizeText(contractData.campaignTitle, BLUEPRINT_LIMITS.TITLE_MAX, 'Campaign'),
        feeAmount: Math.max(1, Number(contractData.feeAmount) || 1000),
        deliverable: sanitizeText(contractData.deliverable, BLUEPRINT_LIMITS.DELIVERABLE_MAX, 'Sponsored Deliverable'),
        escrowStatus: 'ESCROW_FUNDED_ACTIVE',
        dealerSigned: true,
        dealerSignatoryName: sanitizeText(`${contractData.dealerName} Authorized Representative`, BLUEPRINT_LIMITS.NAME_MAX),
        dealerDigitalHash: sanitizeText(hash, 128),
        creatorSigned: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, `contracts/${newId}`));
    }

    initiateConnection(
      contractData.creatorId,
      contractData.campaignId,
      `Formal Escrow Agreement drafted and ₹${contractData.feeAmount.toLocaleString()} funded into escrow.`
    );

    return newId;
  };

  const signContractAsDealer = (contractId: string, signatoryName: string) => {
    const target = contracts.find(c => c.id === contractId);
    const hash = target
      ? generateDigitalContractHash(contractId, signatoryName, target.creatorName, target.feeAmount)
      : 'CB-SIG-DEALER';
    const nextStatus = target?.creatorSignature?.signed
      ? 'ESCROW_FUNDED_ACTIVE'
      : 'SIGNED_BY_DEALER_PENDING_CREATOR';

    setLocalContracts(prev =>
      prev.map(c =>
        c.id !== contractId
          ? c
          : {
              ...c,
              dealerSignature: {
                signed: true,
                signatoryName,
                signedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
                digitalHash: hash,
              },
              escrowStatus: nextStatus,
              updatedAt: new Date().toISOString().split('T')[0],
            }
      )
    );

    if (authUser && [...fsDealerContracts, ...fsCreatorContracts].some(c => c.id === contractId)) {
      updateDoc(doc(db, 'contracts', contractId), {
        dealerSigned: true,
        dealerSignatoryName: sanitizeText(signatoryName, BLUEPRINT_LIMITS.NAME_MAX),
        dealerDigitalHash: sanitizeText(hash, 128),
        escrowStatus: nextStatus,
        updatedAt: serverTimestamp(),
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `contracts/${contractId}`));
    }
  };

  const signContractAsCreator = (contractId: string, signatoryName: string) => {
    const target = contracts.find(c => c.id === contractId);
    const hash = target
      ? generateDigitalContractHash(contractId, target.dealerName, signatoryName, target.feeAmount)
      : 'CB-SIG-CREATOR';

    setLocalContracts(prev =>
      prev.map(c =>
        c.id !== contractId
          ? c
          : {
              ...c,
              creatorSignature: {
                signed: true,
                signatoryName,
                signedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
                digitalHash: hash,
              },
              escrowStatus: 'ESCROW_FUNDED_ACTIVE',
              milestones: c.milestones.map(m =>
                m.title.includes('Signed')
                  ? { ...m, status: 'Completed', timestamp: new Date().toISOString().split('T')[0] }
                  : m
              ),
              updatedAt: new Date().toISOString().split('T')[0],
            }
      )
    );

    if (authUser && [...fsDealerContracts, ...fsCreatorContracts].some(c => c.id === contractId)) {
      updateDoc(doc(db, 'contracts', contractId), {
        creatorSigned: true,
        creatorSignatoryName: sanitizeText(signatoryName, BLUEPRINT_LIMITS.NAME_MAX),
        creatorDigitalHash: sanitizeText(hash, 128),
        escrowStatus: 'ESCROW_FUNDED_ACTIVE',
        updatedAt: serverTimestamp(),
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `contracts/${contractId}`));
    }
  };

  const submitDeliverableProof = (contractId: string, url: string, notes?: string) => {
    setLocalContracts(prev =>
      prev.map(c =>
        c.id !== contractId
          ? c
          : {
              ...c,
              escrowStatus: 'DELIVERABLE_SUBMITTED',
              submissionProof: {
                url,
                submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
                notes,
              },
              milestones: c.milestones.map(m =>
                m.title.includes('Review') || m.title.includes('Submission') || m.title.includes('Draft')
                  ? { ...m, status: 'In Review', timestamp: new Date().toISOString().split('T')[0] }
                  : m
              ),
              updatedAt: new Date().toISOString().split('T')[0],
            }
      )
    );

    if (authUser && [...fsDealerContracts, ...fsCreatorContracts].some(c => c.id === contractId)) {
      const updateData: Record<string, unknown> = {
        submissionUrl: sanitizeText(url, BLUEPRINT_LIMITS.AVATAR_MAX),
        escrowStatus: 'DELIVERABLE_SUBMITTED',
        updatedAt: serverTimestamp(),
      };
      if (notes && notes.trim()) {
        updateData.submissionNotes = sanitizeText(notes, BLUEPRINT_LIMITS.AVATAR_MAX);
      }
      updateDoc(doc(db, 'contracts', contractId), updateData).catch(err =>
        handleFirestoreError(err, OperationType.UPDATE, `contracts/${contractId}`)
      );
    }
  };

  const approveAndReleaseEscrow = (contractId: string) => {
    setLocalContracts(prev =>
      prev.map(c =>
        c.id !== contractId
          ? c
          : {
              ...c,
              escrowStatus: 'APPROVED_PAYOUT_RELEASED',
              milestones: c.milestones.map(m => ({
                ...m,
                status: 'Completed',
                timestamp: new Date().toISOString().split('T')[0],
              })),
              updatedAt: new Date().toISOString().split('T')[0],
            }
      )
    );

    if (authUser && [...fsDealerContracts, ...fsCreatorContracts].some(c => c.id === contractId)) {
      updateDoc(doc(db, 'contracts', contractId), {
        escrowStatus: 'APPROVED_PAYOUT_RELEASED',
        updatedAt: serverTimestamp(),
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `contracts/${contractId}`));
    }
  };

  const updateCreatorProfile = (updated: Partial<CreatorProfile>) => {
    setLocalCreators(prev =>
      prev.map(c => (c.id === currentCreator.id ? { ...c, ...updated } : c))
    );

    const ownedFs = fsCreators.find(c => c.id === currentCreator.id && authUser && c.ownerUid === authUser.uid);
    if (authUser && ownedFs) {
      const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (updated.rates) {
        patch.rateDedicated = Math.max(0, Number(updated.rates.dedicatedVideo) || 0);
        patch.rateIntegrated = Math.max(0, Number(updated.rates.integrated60s) || 0);
        patch.rateShorts = Math.max(0, Number(updated.rates.shortsReels) || 0);
      }
      if (updated.bio !== undefined) patch.bio = sanitizeText(updated.bio, BLUEPRINT_LIMITS.DESCRIPTION_MAX);
      updateDoc(doc(db, 'creators', currentCreator.id), patch).catch(err =>
        handleFirestoreError(err, OperationType.UPDATE, `creators/${currentCreator.id}`)
      );
    }
  };

  const updateDealerProfile = (updated: Partial<BusinessDealerProfile>) => {
    setLocalDealers(prev =>
      prev.map(d => (d.id === currentDealer.id ? { ...d, ...updated } : d))
    );

    const ownedFs = fsDealers.find(d => d.id === currentDealer.id && authUser && d.ownerUid === authUser.uid);
    if (authUser && ownedFs) {
      const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (updated.companyName !== undefined) patch.companyName = sanitizeText(updated.companyName, BLUEPRINT_LIMITS.NAME_MAX);
      if (updated.tagline !== undefined) patch.tagline = sanitizeText(updated.tagline, BLUEPRINT_LIMITS.TAGLINE_MAX);
      if (updated.description !== undefined) patch.description = sanitizeText(updated.description, BLUEPRINT_LIMITS.DESCRIPTION_MAX);
      if (updated.defaultBudget !== undefined) patch.defaultBudget = Math.max(0, Number(updated.defaultBudget) || 0);
      updateDoc(doc(db, 'dealers', currentDealer.id), patch).catch(err =>
        handleFirestoreError(err, OperationType.UPDATE, `dealers/${currentDealer.id}`)
      );
    }
  };

  const registerNewCreator = (
    creator: Omit<CreatorProfile, 'id' | 'authenticityReport' | 'pastDealsCompleted' | 'avgDealerRating' | 'sampleVideos'>
  ): string => {
    const newId = sanitizeId(`creator_${Date.now()}`);
    const newProfile: CreatorWithOwner = {
      ...creator,
      id: newId,
      ownerUid: authUser?.uid,
      authenticityReport: {
        riskLevel: 'VERIFIED_SAFE',
        credibilityScore: 94,
        fakeFollowersEstimatePct: 2.8,
        engagementAnomaly: 'Normal',
        botPatternCount: 0,
        growthCurveType: 'Organic Continuous',
        commentAuthenticityScore: 95,
        auditFlags: ['Registered Creator Account', 'Organic audience metrics'],
        scanDate: new Date().toISOString().split('T')[0],
      },
      pastDealsCompleted: 0,
      avgDealerRating: 5.0,
      sampleVideos: [
        { title: 'Channel Introduction & Review Showcase', views: '12K', uploadDate: 'Recent', duration: '10:00' },
      ],
    };

    setLocalCreators(prev => [newProfile, ...prev]);
    setCurrentCreatorId(newId);
    setActiveRole('creator');

    if (authUser) {
      setDoc(doc(db, 'creators', newId), {
        id: newId,
        ownerUid: authUser.uid,
        name: sanitizeText(creator.name, BLUEPRINT_LIMITS.NAME_MAX, 'Creator'),
        handle: sanitizeText(creator.handle, BLUEPRINT_LIMITS.HANDLE_MAX, '@creator'),
        channelUrl: sanitizeText(creator.channelUrl, BLUEPRINT_LIMITS.URL_MAX, 'https://youtube.com'),
        platform: creator.platform === 'Multi-platform' ? 'YouTube' : creator.platform,
        niche: creator.niche,
        subNiches: (creator.subNiches || []).slice(0, BLUEPRINT_LIMITS.LIST_MAX).map(s => sanitizeText(s, 60)),
        bio: sanitizeText(creator.bio, BLUEPRINT_LIMITS.DESCRIPTION_MAX, 'Creator'),
        avatar: sanitizeText(creator.avatar, BLUEPRINT_LIMITS.AVATAR_MAX, '/src/assets/images/creator_avatar_tech_1794494846107.jpg'),
        subscribers: Math.max(0, Number(creator.subscribers) || 0),
        avgViews: Math.max(0, Number(creator.avgViews) || 0),
        engagementRate: Math.min(100, Math.max(0, Number(creator.engagementRate) || 0)),
        rateDedicated: Math.max(0, Number(creator.rates.dedicatedVideo) || 0),
        rateIntegrated: Math.max(0, Number(creator.rates.integrated60s) || 0),
        rateShorts: Math.max(0, Number(creator.rates.shortsReels) || 0),
        credibilityScore: 94,
        riskLevel: 'VERIFIED_SAFE',
        fakeFollowersEstimatePct: 2.8,
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, `creators/${newId}`));
    }

    return newId;
  };

  const registerNewDealer = (dealer: Omit<BusinessDealerProfile, 'id'>): string => {
    const newId = sanitizeId(`dealer_${Date.now()}`);
    const newProfile: DealerWithOwner = {
      ...dealer,
      id: newId,
      ownerUid: authUser?.uid,
    };
    setLocalDealers(prev => [newProfile, ...prev]);
    setCurrentDealerId(newId);
    setActiveRole('business');

    if (authUser) {
      setDoc(doc(db, 'dealers', newId), {
        id: newId,
        ownerUid: authUser.uid,
        companyName: sanitizeText(dealer.companyName, BLUEPRINT_LIMITS.NAME_MAX, 'Brand'),
        industry: sanitizeText(dealer.industry, 100, 'Consumer Electronics & Smart Tech'),
        website: sanitizeText(dealer.website, BLUEPRINT_LIMITS.URL_MAX, 'https://example.com'),
        tagline: sanitizeText(dealer.tagline, BLUEPRINT_LIMITS.TAGLINE_MAX, 'Brand'),
        description: sanitizeText(dealer.description, BLUEPRINT_LIMITS.DESCRIPTION_MAX, 'Brand'),
        avatar: sanitizeText(dealer.avatar, BLUEPRINT_LIMITS.AVATAR_MAX, '/src/assets/images/product_launch_device_1794494846556.jpg'),
        defaultBudget: Math.max(0, Number(dealer.defaultBudget) || 0),
        targetAgeRange: sanitizeText(dealer.targetDemographics?.ageRange, 40, '18-34'),
        primaryRegion: sanitizeText(dealer.targetDemographics?.primaryRegion, 80, 'India'),
        brandValues: (dealer.brandValues || []).slice(0, BLUEPRINT_LIMITS.LIST_MAX).map(s => sanitizeText(s, 60)),
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, `dealers/${newId}`));
    }

    return newId;
  };

  const importLiveYouTubeCreator = (audit: LiveChannelAuditPayload): string => {
    const id = sanitizeId(`yt_${audit.channelId}`);
    const countryName = audit.country === 'IN' ? 'India' : audit.country === 'US' ? 'United States' : audit.country || 'India';
    const mappedProfile: CreatorWithOwner = {
      id,
      ownerUid: authUser?.uid,
      name: audit.name,
      handle: audit.handle,
      avatar: audit.avatar || '/src/assets/images/creator_avatar_tech_1794494846107.jpg',
      channelUrl: audit.channelUrl,
      platform: 'YouTube',
      niche: audit.inferredNiche,
      subNiches: ['Live YouTube API', countryName, 'Audited Channel'],
      bio: audit.description || `Live audited YouTube channel (${audit.handle}) synced via YouTube Data API v3.`,
      subscribers: audit.subscribers,
      avgViews: audit.avgViews,
      engagementRate: audit.engagementRate,
      rates: audit.suggestedRatesInr,
      demographics: {
        topCountries: [
          { country: countryName, percent: 72 },
          { country: 'Global', percent: 28 },
        ],
        ageDistribution: [
          { range: '18-24', percent: 36 },
          { range: '25-34', percent: 44 },
          { range: '35-44', percent: 15 },
          { range: '45+', percent: 5 },
        ],
        genderRatio: { male: 60, female: 40 },
      },
      authenticityReport: audit.authenticityReport,
      pastDealsCompleted: 0,
      avgDealerRating: 4.9,
      sampleVideos: audit.recentVideos.slice(0, 4).map(v => ({
        title: v.title,
        views:
          v.views >= 1000000
            ? `${(v.views / 1000000).toFixed(1)}M`
            : v.views >= 1000
            ? `${(v.views / 1000).toFixed(1)}K`
            : String(v.views),
        uploadDate: v.publishedAt ? v.publishedAt.split('T')[0] : 'Recent',
        duration: 'YouTube',
      })),
    };

    setLocalCreators(prev => {
      const idx = prev.findIndex(c => c.id === mappedProfile.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = mappedProfile;
        return copy;
      }
      return [mappedProfile, ...prev];
    });

    if (authUser) {
      const existingFs = fsCreators.find(c => c.id === id);
      if (existingFs && existingFs.ownerUid === authUser.uid) {
        updateDoc(doc(db, 'creators', id), {
          name: sanitizeText(audit.name, BLUEPRINT_LIMITS.NAME_MAX, 'YouTube Creator'),
          handle: sanitizeText(audit.handle, BLUEPRINT_LIMITS.HANDLE_MAX, '@creator'),
          channelUrl: sanitizeText(audit.channelUrl, BLUEPRINT_LIMITS.URL_MAX, 'https://youtube.com'),
          niche: audit.inferredNiche,
          subNiches: ['Live YouTube API', countryName],
          bio: sanitizeText(audit.description, BLUEPRINT_LIMITS.DESCRIPTION_MAX, 'Audited YouTube Channel'),
          avatar: sanitizeText(audit.avatar, BLUEPRINT_LIMITS.AVATAR_MAX, '/src/assets/images/creator_avatar_tech_1794494846107.jpg'),
          subscribers: Math.max(0, Number(audit.subscribers) || 0),
          avgViews: Math.max(0, Number(audit.avgViews) || 0),
          engagementRate: Math.min(100, Math.max(0, Number(audit.engagementRate) || 0)),
          rateDedicated: Math.max(0, Number(audit.suggestedRatesInr.dedicatedVideo) || 0),
          rateIntegrated: Math.max(0, Number(audit.suggestedRatesInr.integrated60s) || 0),
          rateShorts: Math.max(0, Number(audit.suggestedRatesInr.shortsReels) || 0),
          credibilityScore: Math.min(100, Math.max(0, Number(audit.authenticityReport.credibilityScore) || 90)),
          riskLevel: audit.authenticityReport.riskLevel,
          fakeFollowersEstimatePct: Math.min(100, Math.max(0, Number(audit.authenticityReport.fakeFollowersEstimatePct) || 0)),
          updatedAt: serverTimestamp(),
        }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `creators/${id}`));
      } else if (!existingFs) {
        setDoc(doc(db, 'creators', id), {
          id,
          ownerUid: authUser.uid,
          name: sanitizeText(audit.name, BLUEPRINT_LIMITS.NAME_MAX, 'YouTube Creator'),
          handle: sanitizeText(audit.handle, BLUEPRINT_LIMITS.HANDLE_MAX, '@creator'),
          channelUrl: sanitizeText(audit.channelUrl, BLUEPRINT_LIMITS.URL_MAX, 'https://youtube.com'),
          platform: 'YouTube',
          niche: audit.inferredNiche,
          subNiches: ['Live YouTube API', countryName],
          bio: sanitizeText(audit.description, BLUEPRINT_LIMITS.DESCRIPTION_MAX, 'Audited YouTube Channel'),
          avatar: sanitizeText(audit.avatar, BLUEPRINT_LIMITS.AVATAR_MAX, '/src/assets/images/creator_avatar_tech_1794494846107.jpg'),
          subscribers: Math.max(0, Number(audit.subscribers) || 0),
          avgViews: Math.max(0, Number(audit.avgViews) || 0),
          engagementRate: Math.min(100, Math.max(0, Number(audit.engagementRate) || 0)),
          rateDedicated: Math.max(0, Number(audit.suggestedRatesInr.dedicatedVideo) || 0),
          rateIntegrated: Math.max(0, Number(audit.suggestedRatesInr.integrated60s) || 0),
          rateShorts: Math.max(0, Number(audit.suggestedRatesInr.shortsReels) || 0),
          credibilityScore: Math.min(100, Math.max(0, Number(audit.authenticityReport.credibilityScore) || 90)),
          riskLevel: audit.authenticityReport.riskLevel,
          fakeFollowersEstimatePct: Math.min(100, Math.max(0, Number(audit.authenticityReport.fakeFollowersEstimatePct) || 0)),
          isPublic: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `creators/${id}`));
      }
    }

    return mappedProfile.id;
  };

  const resetAllData = () => {
    setLocalDealers(SAMPLE_DEALERS);
    setLocalCreators(SAMPLE_CREATORS);
    setLocalCampaigns(INITIAL_CAMPAIGNS);
    setLocalContracts(INITIAL_CONTRACTS);
    setLocalConnections(INITIAL_CONNECTIONS);
    setCurrentDealerId(SAMPLE_DEALERS[0].id);
    setCurrentCreatorId(SAMPLE_CREATORS[0].id);
  };

  const needsOnboarding = Boolean(authUser && userAccountLoaded && !userAccount);

  return (
    <AppContext.Provider
      value={{
        authUser,
        authLoading,
        needsOnboarding,
        userAccount,
        signInWithGoogle,
        logout,
        completeUserOnboarding,
        activeRole,
        setActiveRole,
        currentDealer,
        currentCreator,
        dealers,
        creators,
        campaigns,
        contracts,
        connections,
        trendingTopics,
        selectedCampaignId,
        setSelectedCampaignId,
        showMethodologyModal,
        setShowMethodologyModal,
        showPersonaModal,
        setShowPersonaModal,
        switchDealer,
        switchCreator,
        createCampaign,
        createContract,
        signContractAsDealer,
        signContractAsCreator,
        submitDeliverableProof,
        approveAndReleaseEscrow,
        initiateConnection,
        sendMessage,
        updateCreatorProfile,
        updateDealerProfile,
        registerNewCreator,
        registerNewDealer,
        importLiveYouTubeCreator,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
