# CreatorBridge Firestore Security Specification (Phase 0)

## Data Invariants
1. **User PII Isolation**: `/users/{userId}` contains user email and auth metadata. Only `request.auth.uid == userId` (or an admin) can read/write a user document. Blanket `list` queries on `/users` are strictly denied.
2. **Verified Identity & Anti-Spoofing**: All standard writes require `request.auth != null && request.auth.token.email_verified == true`. Creator/dealer/campaign owners cannot spoof `ownerUid` or `dealerUid` to impersonate another user.
3. **Immutable Ownership & Creation Timestamps**: `ownerUid`, `dealerUid`, and `createdAt` cannot be modified after creation. `createdAt` and `updatedAt` must equal `request.time`.
4. **Action-Based Contract Transitions & Terminal Locking**: Contracts progress from `ESCROW_FUNDED_ACTIVE` / `SIGNED_BY_DEALER_PENDING_CREATOR` -> `DELIVERABLE_SUBMITTED` -> `APPROVED_PAYOUT_RELEASED`. Once `APPROVED_PAYOUT_RELEASED`, non-admin updates are permanently blocked.
5. **Relational Master Gate & Atomic Message Sync**: Messages under `/connections/{connectionId}/messages/{messageId}` require parent connection existence and participant membership (`dealerUid` or `creatorUid`), and must atomically update the parent connection's `lastMessage` and `updatedAt` in the same batch (`getAfter()`).
6. **Zero Unbounded Lists & Strict Key Allowlists**: Every document uses `hasAll` + `hasOnly` on create, `affectedKeys().hasOnly(...)` on update, bounded arrays (`<= 10`), and explicit string `.size()` caps.

## Dirty Dozen Adversarial Payloads (Must All Return `PERMISSION_DENIED`)
1. **Identity Spoofing on User Profile**: Authenticated as `user_A`, attempt `setDoc('/users/user_B', { uid: 'user_B', ... })`.
2. **Privilege Escalation / Ghost Field on User**: Attempt `setDoc('/users/user_A', { ..., isAdmin: true })` (rejected by `hasOnly`).
3. **Unverified Email Spoof**: Attempt write with `email: 'pk7973731@gmail.com'` while `email_verified: false`.
4. **Cross-User PII Read**: Authenticated as `user_A`, attempt `getDoc('/users/user_B')` or `getDocs('/users')`.
5. **Owner Spoofing on Campaign Create**: Authenticated as `dealer_A`, attempt `setDoc('/campaigns/camp_1', { ownerUid: 'dealer_B', ... })`.
6. **Resource Poisoning via Oversized Doc ID**: Attempt `setDoc('/campaigns/' + 'x'.repeat(200), ...)` (rejected by `isValidId`).
7. **Shadow Field Injection on Update**: Owner attempts `updateDoc('/dealers/d_1', { companyName: 'Legit', verifiedBadgeOverride: true })`.
8. **Type Poisoning on Fee Amount**: Attempt `updateDoc('/contracts/c_1', { feeAmount: 'free' })`.
9. **Terminal State Violation on Escrow Contract**: After `escrowStatus == 'APPROVED_PAYOUT_RELEASED'`, dealer attempts to revert `escrowStatus` back to `'DRAFT'`.
10. **State Shortcutting / Unauthorized Payout Release**: Creator attempts `updateDoc('/contracts/c_1', { escrowStatus: 'APPROVED_PAYOUT_RELEASED' })` (only `dealerUid` can release escrow).
11. **Orphaned / Non-Atomic Message Write**: Participant creates `/connections/conn_1/messages/msg_1` without updating `/connections/conn_1.lastMessage` in the same batch (rejected by `getAfter`).
12. **Blanket Unfiltered List Query**: User queries `/contracts` without `where('dealerUid', '==', uid)` or `where('creatorUid', '==', uid)`.
