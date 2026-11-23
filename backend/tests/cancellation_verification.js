import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { db } = await import('../src/config/firebase.js');
const { cancelBorrowingRequest } = await import('../src/controllers/borrowingRequestController.js');

async function runTest() {
  console.log('--- Starting Cancellation Controller Verification ---');

  const testResourceId = 'res-test-cancel-unit';
  const testRequestId = 'req-test-cancel-unit';
  const clubId = 'club-unit-test';

  // 1. Setup Resource: total: 5, available: 3, reserved: 2
  await db.collection('Resources').doc(testResourceId).set({
    resourceId: testResourceId,
    clubId,
    itemName: 'Cancel Test Speaker',
    category: 'Audio & Visual',
    totalQuantity: 5,
    availableQuantity: 3,
    reservedQuantity: 2,
    borrowedQuantity: 0,
    condition: 'Good',
    status: 'Available',
    updatedAt: new Date().toISOString()
  });

  // 2. Setup BorrowingRequest: status: Approved, quantity: 2
  await db.collection('BorrowingRequests').doc(testRequestId).set({
    requestId: testRequestId,
    resourceId: testResourceId,
    ownerClubId: clubId,
    requesterClubId: clubId,
    quantity: 2,
    status: 'Approved',
    pickupDate: '2026-11-25',
    expectedReturnDate: '2026-11-27',
    updatedAt: new Date().toISOString()
  });

  // Mock req and res
  const req = {
    params: { requestId: testRequestId },
    body: { reason: 'Event cancelled due to bad weather' },
    user: { role: 'club', clubId }
  };

  let responseData = null;
  const res = {
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      responseData = data;
      return this;
    }
  };

  await cancelBorrowingRequest(req, res);

  console.log('Response:', responseData);
  if (!responseData?.success) {
    throw new Error('Cancellation failed: ' + JSON.stringify(responseData));
  }

  // Verify Firestore state
  const reqSnap = await db.collection('BorrowingRequests').doc(testRequestId).get();
  const reqData = reqSnap.data();
  console.log('Updated Request Status:', reqData.status);
  console.log('Cancellation Reason:', reqData.cancellationReason);

  if (reqData.status !== 'Cancelled') {
    throw new Error(`Expected status Cancelled, got ${reqData.status}`);
  }

  const resSnap = await db.collection('Resources').doc(testResourceId).get();
  const resData = resSnap.data();
  console.log('Updated Resource available:', resData.availableQuantity, 'reserved:', resData.reservedQuantity);

  if (resData.availableQuantity !== 5 || resData.reservedQuantity !== 0) {
    throw new Error(`Expected available 5 and reserved 0, got avail ${resData.availableQuantity}, res ${resData.reservedQuantity}`);
  }

  // 3. Test invalid transition: try cancelling an already cancelled request
  let invalidResponse = null;
  const res2 = {
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      invalidResponse = data;
      return this;
    }
  };

  await cancelBorrowingRequest(req, res2);
  console.log('Invalid transition response code:', res2.statusCode, 'data:', invalidResponse);
  if (res2.statusCode !== 409) {
    throw new Error(`Expected 409 on re-cancelling, got ${res2.statusCode}`);
  }

  // Clean up
  await db.collection('Resources').doc(testResourceId).delete();
  await db.collection('BorrowingRequests').doc(testRequestId).delete();

  console.log('--- ALL CANCELLATION TESTS PASSED! ---');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
