/**
 * Phase 0 Adversarial Security Rules Test Suite Specification
 * Documents all 12 "Dirty Dozen" negative test cases for CreatorBridge Firestore Rules.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update';
  expected: 'PERMISSION_DENIED';
  payloadOrQuery: Record<string, unknown>;
}

export const DIRTY_DOZEN_TESTS: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on /users/{userId}',
    collectionPath: '/users/victim_uid',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payloadOrQuery: { uid: 'victim_uid', email: 'attacker@example.com', role: 'business' },
  },
  {
    id: 2,
    name: 'Shadow Admin Field Injection on /users/{userId}',
    collectionPath: '/users/attacker_uid',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payloadOrQuery: { uid: 'attacker_uid', isAdmin: true, role: 'business' },
  },
  {
    id: 3,
    name: 'Unverified Email Spoof Test',
    collectionPath: '/dealers/dealer_spoof',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payloadOrQuery: { authEmail: 'pk7973731@gmail.com', email_verified: false },
  },
  {
    id: 4,
    name: 'PII Blanket Read on /users',
    collectionPath: '/users',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
    payloadOrQuery: { query: 'collection(db, "users")' },
  },
  {
    id: 5,
    name: 'Owner Spoofing on Campaign Create',
    collectionPath: '/campaigns/camp_spoof',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payloadOrQuery: { id: 'camp_spoof', ownerUid: 'someone_else' },
  },
  {
    id: 6,
    name: 'Resource Poisoning via >128 Char Document ID',
    collectionPath: `/campaigns/${'a'.repeat(160)}`,
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payloadOrQuery: { id: 'a'.repeat(160) },
  },
  {
    id: 7,
    name: 'Shadow Field Update on Dealer Profile',
    collectionPath: '/dealers/dealer_1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payloadOrQuery: { companyName: 'Updated', ghostPrivilege: true },
  },
  {
    id: 8,
    name: 'Type Poisoning on Contract Fee Amount',
    collectionPath: '/contracts/contract_1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payloadOrQuery: { feeAmount: 'not-a-number' },
  },
  {
    id: 9,
    name: 'Terminal State Mutation After APPROVED_PAYOUT_RELEASED',
    collectionPath: '/contracts/contract_released',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payloadOrQuery: { escrowStatus: 'DRAFT' },
  },
  {
    id: 10,
    name: 'Creator Self-Release of Escrow Funds',
    collectionPath: '/contracts/contract_1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payloadOrQuery: { actor: 'creatorUid', escrowStatus: 'APPROVED_PAYOUT_RELEASED' },
  },
  {
    id: 11,
    name: 'Non-Atomic Message Create Without Parent Thread Sync',
    collectionPath: '/connections/conn_1/messages/msg_1',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payloadOrQuery: { batchIncludesParentUpdate: false, text: 'Bypassed lastMessage sync' },
  },
  {
    id: 12,
    name: 'Unfiltered List Query on /contracts',
    collectionPath: '/contracts',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
    payloadOrQuery: { query: 'collection(db, "contracts") without participant where()' },
  },
];
