import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import app from '../src/server.js';
import { auth, db } from '../src/config/firebase.js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const API_KEY = process.env.FIREBASE_WEB_API_KEY || 'AIzaSyCuxj4pY_b0wDq298coBMXtVm-FdDrLRuQ';
const TEST_PORT = 5056;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  \x1b[32m[PASS]\x1b[0m ${testName}`);
    passedCount++;
  } else {
    console.error(`  \x1b[31m[FAIL]\x1b[0m ${testName} ${details ? `(${details})` : ''}`);
    failedCount++;
  }
}

async function getIdTokenForUid(uid) {
  const customToken = await auth.createCustomToken(uid);
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true })
  });
  const data = await res.json();
  if (!data.idToken) {
    throw new Error(`Token exchange failed for ${uid}: ${JSON.stringify(data)}`);
  }
  return data.idToken;
}

async function runTests() {
  console.log('\n============================================================');
  console.log('    EventPool Borrowing Lifecycle & Access Control Tests    ');
  console.log('============================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));

  // Tracking arrays for guaranteed teardown cleanup
  const createdRequestIds = [];
  const createdResourceIds = [];
  const createdEventIds = [];
  const createdClubIds = [];
  const createdAuthUids = [];

  try {
    const ts = Date.now();

    // Setup temporary Owner, Borrower, and Third-Party Clubs
    const ownerAuth = await auth.createUser({
      email: `test_owner_${ts}@eventpool.test`,
      password: 'Password123!',
      displayName: 'Test Owner Club'
    });
    createdAuthUids.push(ownerAuth.uid);

    const borrowerAuth = await auth.createUser({
      email: `test_borrower_${ts}@eventpool.test`,
      password: 'Password123!',
      displayName: 'Test Borrower Club'
    });
    createdAuthUids.push(borrowerAuth.uid);

    const thirdAuth = await auth.createUser({
      email: `test_third_${ts}@eventpool.test`,
      password: 'Password123!',
      displayName: 'Test Third Club'
    });
    createdAuthUids.push(thirdAuth.uid);

    const ownerClubId = `test-owner-${ts}`;
    const borrowerClubId = `test-borrower-${ts}`;
    const thirdClubId = `test-third-${ts}`;
    createdClubIds.push(ownerClubId, borrowerClubId, thirdClubId);

    const now = new Date().toISOString();
    await db.collection('Clubs').doc(ownerClubId).set({
      clubId: ownerClubId,
      clubName: 'Test Owner Society',
      contactEmail: ownerAuth.email,
      authUId: ownerAuth.uid,
      authUid: ownerAuth.uid,
      isActive: true,
      createdAt: now
    });
    await db.collection('Clubs').doc(borrowerClubId).set({
      clubId: borrowerClubId,
      clubName: 'Test Borrower Society',
      contactEmail: borrowerAuth.email,
      authUId: borrowerAuth.uid,
      authUid: borrowerAuth.uid,
      isActive: true,
      createdAt: now
    });
    await db.collection('Clubs').doc(thirdClubId).set({
      clubId: thirdClubId,
      clubName: 'Test Third Society',
      contactEmail: thirdAuth.email,
      authUId: thirdAuth.uid,
      authUid: thirdAuth.uid,
      isActive: true,
      createdAt: now
    });

    const ownerToken = await getIdTokenForUid(ownerAuth.uid);
    const borrowerToken = await getIdTokenForUid(borrowerAuth.uid);
    const thirdToken = await getIdTokenForUid(thirdAuth.uid);

    // 1. BUG-003 Option A: Verify Public Read Endpoints & Auth Boundaries
    console.log('--- Step 1: Public Read Access (BUG-003 Option A) & Auth Guard ---');
    const pubResources = await fetch(`${BASE_URL}/resources`);
    assert(pubResources.status === 200, 'Anonymous GET /api/resources returns 200 OK');

    const pubSearch = await fetch(`${BASE_URL}/resources/search?q=Projector`);
    assert(pubSearch.status === 200, 'Anonymous GET /api/resources/search returns 200 OK');

    const pubClubs = await fetch(`${BASE_URL}/clubs`);
    assert(pubClubs.status === 200, 'Anonymous GET /api/clubs returns 200 OK');

    const pubMetrics = await fetch(`${BASE_URL}/sustainability`);
    assert(pubMetrics.status === 200, 'Anonymous GET /api/sustainability returns 200 OK');

    const anonBorrow = await fetch(`${BASE_URL}/borrowing-requests`, { method: 'POST', body: '{}' });
    assert(anonBorrow.status === 401, 'Anonymous POST /api/borrowing-requests blocked with 401');

    // 2. Seed Resource & Event for Tests
    const resCreate = await fetch(`${BASE_URL}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        itemName: 'Test Wireless Mic Set',
        category: 'Audio Equipment',
        totalQuantity: 10,
        condition: 'Good',
        location: 'Test Store',
        estimatedUnitCost: 200,
        estimatedUnitWeight: 1.5
      })
    });
    const resBody = await resCreate.json();
    const resourceId = resBody.data?.resourceId;
    if (resourceId) createdResourceIds.push(resourceId);
    assert(resCreate.status === 201 && Boolean(resourceId), 'Owner creates test resource (10 units)');

    const pubSingleRes = await fetch(`${BASE_URL}/resources/${resourceId}`);
    assert(pubSingleRes.status === 200, 'Anonymous GET /api/resources/:id returns 200 OK');

    const evtCreate = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${borrowerToken}` },
      body: JSON.stringify({
        eventName: 'Test Tech Forum',
        eventDate: '2026-12-20',
        purpose: 'Panel discussion'
      })
    });
    const evtBody = await evtCreate.json();
    const eventId = evtBody.data?.eventId;
    if (eventId) createdEventIds.push(eventId);
    assert(evtCreate.status === 201 && Boolean(eventId), 'Borrower creates test event');

    // 3. Borrowing Creation Validations & Access Control
    console.log('\n--- Step 2: Borrowing Request Validation & Access Control ---');
    const selfBorrow = await fetch(`${BASE_URL}/borrowing-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        resourceId,
        eventId,
        quantity: 2,
        purpose: 'Self borrow test',
        pickupDate: '2026-12-01',
        expectedReturnDate: '2026-12-05',
        wouldHavePurchased: true
      })
    });
    assert(selfBorrow.status === 403, 'Owner blocked from borrowing own resource (403 FORBIDDEN)');

    const overBorrow = await fetch(`${BASE_URL}/borrowing-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${borrowerToken}` },
      body: JSON.stringify({
        resourceId,
        eventId,
        quantity: 15,
        purpose: 'Over-request test',
        pickupDate: '2026-12-01',
        expectedReturnDate: '2026-12-05',
        wouldHavePurchased: true
      })
    });
    assert(overBorrow.status === 409, 'Request exceeding available stock rejected (409 INSUFFICIENT_QUANTITY)');

    const badDate = await fetch(`${BASE_URL}/borrowing-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${borrowerToken}` },
      body: JSON.stringify({
        resourceId,
        eventId,
        quantity: 2,
        purpose: 'Invalid date range',
        pickupDate: '2026-12-05',
        expectedReturnDate: '2026-12-01',
        wouldHavePurchased: true
      })
    });
    assert(badDate.status === 400, 'Return date <= pickup date rejected (400 INVALID_DATE_RANGE)');

    // 4. Full Lifecycle: Pending -> Approved -> Borrowed -> Return Pending -> Completed
    console.log('\n--- Step 3: Lifecycle (Approve -> Borrow -> Initiate Return -> Verify) ---');
    const req1Res = await fetch(`${BASE_URL}/borrowing-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${borrowerToken}` },
      body: JSON.stringify({
        resourceId,
        eventId,
        quantity: 4,
        purpose: 'Keynote speakers audio',
        pickupDate: '2026-12-10',
        expectedReturnDate: '2026-12-14',
        wouldHavePurchased: true
      })
    });
    const req1Body = await req1Res.json();
    const req1Id = req1Body.data?.requestId;
    if (req1Id) createdRequestIds.push(req1Id);
    assert(req1Res.status === 201 && req1Body.data?.status === 'Pending', 'Borrower creates request in Pending (4 units)');

    // Access control: Third party cannot view; Borrower cannot approve
    const thirdView = await fetch(`${BASE_URL}/borrowing-requests/${req1Id}`, {
      headers: { Authorization: `Bearer ${thirdToken}` }
    });
    assert(thirdView.status === 403, 'Uninvolved third-party club blocked from viewing request (403)');

    const borrowerApprove = await fetch(`${BASE_URL}/borrowing-requests/${req1Id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    assert(borrowerApprove.status === 403, 'Borrower blocked from self-approving request (403)');

    // Owner approves -> stock moves: avail 6, reserved 4
    const approveRes = await fetch(`${BASE_URL}/borrowing-requests/${req1Id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    assert(approveRes.status === 200, 'Owner approves request (200 OK)');

    const afterApprove = await (await fetch(`${BASE_URL}/resources/${resourceId}`)).json();
    assert(
      afterApprove.data?.availableQuantity === 6 && afterApprove.data?.reservedQuantity === 4,
      'Atomic transaction reserved 4 units (avail=6, reserved=4)'
    );

    // Owner marks collected -> reserved 0, borrowed 4
    const borrowRes = await fetch(`${BASE_URL}/borrowing-requests/${req1Id}/borrow`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    assert(borrowRes.status === 200, 'Owner marks request Borrowed (200 OK)');

    const afterBorrow = await (await fetch(`${BASE_URL}/resources/${resourceId}`)).json();
    assert(
      afterBorrow.data?.reservedQuantity === 0 && afterBorrow.data?.borrowedQuantity === 4,
      'Atomic transaction moved 4 units to borrowed (reserved=0, borrowed=4)'
    );

    // Borrower initiates return -> Return Pending
    const initReturn = await fetch(`${BASE_URL}/borrowing-requests/${req1Id}/initiate-return`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    assert(initReturn.status === 200, 'Borrower initiates return (Return Pending)');

    // Owner tries invalid return sum -> 400
    const badReturn = await fetch(`${BASE_URL}/borrowing-requests/${req1Id}/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ reusable: 2, damaged: 0, missing: 0 })
    });
    assert(badReturn.status === 400, 'Mismatched return inspection count rejected (400 INVALID_INPUT)');

    // Owner verifies return: 3 reusable, 1 damaged -> total drops to 9, avail becomes 9
    const verifyRes = await fetch(`${BASE_URL}/borrowing-requests/${req1Id}/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ reusable: 3, damaged: 1, missing: 0 })
    });
    assert(verifyRes.status === 200, 'Owner verifies return (3 reusable, 1 damaged -> Completed)');

    const afterReturn = await (await fetch(`${BASE_URL}/resources/${resourceId}`)).json();
    assert(
      afterReturn.data?.totalQuantity === 9 &&
        afterReturn.data?.availableQuantity === 9 &&
        afterReturn.data?.borrowedQuantity === 0,
      'Return verification restored 3 reusable units and deducted 1 damaged unit (total=9, avail=9)'
    );

    // 5. Cancel Flow & Stock Restoration
    console.log('\n--- Step 4: Cancel Approved Request & Reject Pending Request ---');
    const req2Res = await fetch(`${BASE_URL}/borrowing-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${borrowerToken}` },
      body: JSON.stringify({
        resourceId,
        eventId,
        quantity: 3,
        purpose: 'Backup speakers',
        pickupDate: '2026-12-10',
        expectedReturnDate: '2026-12-14',
        wouldHavePurchased: false
      })
    });
    const req2Id = (await req2Res.json()).data?.requestId;
    if (req2Id) createdRequestIds.push(req2Id);

    await fetch(`${BASE_URL}/borrowing-requests/${req2Id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    const ownerCancel = await fetch(`${BASE_URL}/borrowing-requests/${req2Id}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    assert(ownerCancel.status === 403, 'Owner blocked from cancelling borrower request (403)');

    const borrowerCancel = await fetch(`${BASE_URL}/borrowing-requests/${req2Id}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${borrowerToken}` }
    });
    assert(borrowerCancel.status === 200, 'Borrower cancels approved request (200 OK)');

    const afterCancel = await (await fetch(`${BASE_URL}/resources/${resourceId}`)).json();
    assert(
      afterCancel.data?.availableQuantity === 9 && afterCancel.data?.reservedQuantity === 0,
      'Cancellation released reserved stock back to available (avail=9, reserved=0)'
    );

    // Reject flow
    const req3Res = await fetch(`${BASE_URL}/borrowing-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${borrowerToken}` },
      body: JSON.stringify({
        resourceId,
        eventId,
        quantity: 2,
        purpose: 'Small meeting',
        pickupDate: '2026-12-10',
        expectedReturnDate: '2026-12-14',
        wouldHavePurchased: true
      })
    });
    const req3Id = (await req3Res.json()).data?.requestId;
    if (req3Id) createdRequestIds.push(req3Id);

    const rejectRes = await fetch(`${BASE_URL}/borrowing-requests/${req3Id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ reason: 'Maintenance scheduled' })
    });
    assert(rejectRes.status === 200, 'Owner rejects pending request (200 OK)');

    // 6. Simultaneous Double-Approval Concurrency Test (NFR6)
    console.log('\n--- Step 5: Simultaneous Approval Concurrency Test (NFR6) ---');
    const cReq1 = await (await fetch(`${BASE_URL}/borrowing-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${borrowerToken}` },
      body: JSON.stringify({
        resourceId,
        eventId,
        quantity: 6,
        purpose: 'Concurrent test A',
        pickupDate: '2026-12-10',
        expectedReturnDate: '2026-12-14',
        wouldHavePurchased: true
      })
    })).json();
    const cReq2 = await (await fetch(`${BASE_URL}/borrowing-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${borrowerToken}` },
      body: JSON.stringify({
        resourceId,
        eventId,
        quantity: 6,
        purpose: 'Concurrent test B',
        pickupDate: '2026-12-10',
        expectedReturnDate: '2026-12-14',
        wouldHavePurchased: true
      })
    })).json();
    if (cReq1.data?.requestId) createdRequestIds.push(cReq1.data.requestId);
    if (cReq2.data?.requestId) createdRequestIds.push(cReq2.data.requestId);

    const [r1, r2] = await Promise.all([
      fetch(`${BASE_URL}/borrowing-requests/${cReq1.data.requestId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ownerToken}` }
      }),
      fetch(`${BASE_URL}/borrowing-requests/${cReq2.data.requestId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ownerToken}` }
      })
    ]);
    const statuses = [r1.status, r2.status].sort();
    assert(
      statuses[0] === 200 && statuses[1] === 409,
      `Simultaneous approvals on 9 units (6+6=12): one 200 OK, one 409 conflict (got ${statuses.join(', ')})`
    );
    const afterConcurrent = await (await fetch(`${BASE_URL}/resources/${resourceId}`)).json();
    assert(
      afterConcurrent.data?.availableQuantity === 3 && afterConcurrent.data?.reservedQuantity === 6,
      'Available quantity stayed >= 0 after concurrent transaction (avail=3, reserved=6)'
    );

    console.log('\n============================================================');
    console.log(`BORROWING TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('============================================================\n');
  } catch (err) {
    console.error('\nFatal borrowing test execution error:', err);
    failedCount++;
  } finally {
    console.log('[CLEANUP] Deleting all temporary borrowing test records and Auth users...');
    for (const id of createdRequestIds) {
      await db.collection('BorrowingRequests').doc(id).delete().catch(() => {});
    }
    for (const id of createdEventIds) {
      await db.collection('Events').doc(id).delete().catch(() => {});
    }
    for (const id of createdResourceIds) {
      await db.collection('Resources').doc(id).delete().catch(() => {});
    }
    for (const id of createdClubIds) {
      await db.collection('Clubs').doc(id).delete().catch(() => {});
    }
    for (const uid of createdAuthUids) {
      await auth.deleteUser(uid).catch(() => {});
    }
    console.log('[CLEANUP] Clean! Zero pollution left in Firebase.');
    server.close();
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTests();
