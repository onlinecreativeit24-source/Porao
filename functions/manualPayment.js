const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase
admin.initializeApp();

const db = admin.firestore();

// ============================================
// 1. GET PAYMENT SETTINGS (Enable/Disable)
// ============================================
exports.getPaymentSettings = functions.https.onCall(async (data, context) => {
  try {
    const doc = await db.collection('settings').doc('payment').get();
    
    if (!doc.exists) {
      return {
        success: true,
        paymentEnabled: false,
        message: 'Payment system is currently disabled'
      };
    }

    return {
      success: true,
      paymentEnabled: doc.data().enabled,
      bkashNumber: doc.data().bkashNumber,
      message: doc.data().enabled ? 'Payment enabled' : 'Payment disabled - Free mode'
    };
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================
// 2. ADMIN: TOGGLE PAYMENT ON/OFF
// ============================================
exports.togglePaymentSystem = functions.https.onCall(async (data, context) => {
  try {
    // Verify admin
    if (!context.auth || !context.auth.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Check if user is admin
    const adminDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only admin can toggle payment');
    }

    const { enabled, bkashNumber } = data;

    await db.collection('settings').doc('payment').set({
      enabled: enabled,
      bkashNumber: bkashNumber || '01756648869',
      toggledAt: admin.firestore.FieldValue.serverTimestamp(),
      toggledBy: context.auth.uid
    });

    return {
      success: true,
      message: enabled ? '✅ Payment system enabled' : '✅ Payment system disabled - Free mode active',
      paymentEnabled: enabled
    };
  } catch (error) {
    console.error('Error toggling payment:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================
// 3. CREATE PAYMENT REQUEST (Student booking)
// ============================================
exports.createPaymentRequest = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { amount, teacherId, classId, studentName, studentPhone } = data;

    if (!amount || !teacherId || !classId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Get payment settings
    const settingsDoc = await db.collection('settings').doc('payment').get();
    const paymentEnabled = settingsDoc.exists ? settingsDoc.data().enabled : false;
    const bkashNumber = settingsDoc.exists ? settingsDoc.data().bkashNumber : '01756648869';

    // Create transaction record
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const paymentDoc = {
      transactionId: transactionId,
      studentId: context.auth.uid,
      studentName: studentName,
      studentPhone: studentPhone,
      teacherId: teacherId,
      classId: classId,
      amount: amount,
      bkashNumber: bkashNumber,
      paymentMethod: 'bKash Manual',
      status: 'pending', // pending, verified, rejected, cancelled
      paymentEnabled: paymentEnabled,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const paymentRef = await db.collection('payments').add(paymentDoc);

    return {
      success: true,
      paymentEnabled: paymentEnabled,
      transactionId: transactionId,
      amount: amount,
      bkashNumber: bkashNumber,
      message: paymentEnabled ? 'Payment required - Complete transfer' : 'Free mode - No payment needed',
      paymentDocId: paymentRef.id
    };
  } catch (error) {
    console.error('Error creating payment request:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================
// 4. SUBMIT PAYMENT PROOF (Screenshot)
// ============================================
exports.submitPaymentProof = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { paymentDocId, screenshotUrl, transactionId, remark } = data;

    if (!paymentDocId || !screenshotUrl) {
      throw new functions.https.HttpsError('invalid-argument', 'Screenshot URL required');
    }

    await db.collection('payments').doc(paymentDocId).update({
      screenshotUrl: screenshotUrl,
      bkashTransactionId: transactionId,
      remark: remark,
      status: 'pending_verification',
      submittedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      message: 'Payment proof submitted. Waiting for teacher verification.'
    };
  } catch (error) {
    console.error('Error submitting payment proof:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================
// 5. TEACHER: VERIFY PAYMENT
// ============================================
exports.verifyPayment = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { paymentDocId, approved, remark } = data;

    if (!paymentDocId) {
      throw new functions.https.HttpsError('invalid-argument', 'Payment ID required');
    }

    // Verify teacher owns the class
    const paymentDoc = await db.collection('payments').doc(paymentDocId).get();
    if (!paymentDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Payment not found');
    }

    if (paymentDoc.data().teacherId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Only teacher can verify');
    }

    const newStatus = approved ? 'verified' : 'rejected';

    await db.collection('payments').doc(paymentDocId).update({
      status: newStatus,
      verifiedBy: context.auth.uid,
      verificationRemark: remark,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // If approved, activate class booking
    if (approved) {
      const { classId, studentId } = paymentDoc.data();
      await db.collection('bookings').add({
        classId: classId,
        studentId: studentId,
        paymentId: paymentDocId,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return {
      success: true,
      status: newStatus,
      message: approved ? '✅ Payment verified! Class booking active.' : '❌ Payment rejected.'
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================
// 6. CHECK BOOKING STATUS (Free/Paid)
// ============================================
exports.checkBookingStatus = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { classId } = data;

    // Get payment settings
    const settingsDoc = await db.collection('settings').doc('payment').get();
    const paymentEnabled = settingsDoc.exists ? settingsDoc.data().enabled : false;

    if (!paymentEnabled) {
      return {
        success: true,
        canAccess: true,
        message: '✅ Free mode - No payment needed',
        paymentEnabled: false
      };
    }

    // Check if payment verified
    const paymentQuery = await db.collection('payments')
      .where('studentId', '==', context.auth.uid)
      .where('classId', '==', classId)
      .where('status', '==', 'verified')
      .limit(1)
      .get();

    const hasVerifiedPayment = !paymentQuery.empty;

    return {
      success: true,
      canAccess: hasVerifiedPayment,
      message: hasVerifiedPayment ? '✅ Access granted' : '⏳ Waiting for payment verification',
      paymentEnabled: true
    };
  } catch (error) {
    console.error('Error checking booking status:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================
// 7. GET ALL PENDING PAYMENTS (Teacher View)
// ============================================
exports.getPendingPayments = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Get teacher's pending payments
    const paymentsQuery = await db.collection('payments')
      .where('teacherId', '==', context.auth.uid)
      .where('status', 'in', ['pending_verification'])
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const payments = [];
    paymentsQuery.forEach(doc => {
      payments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      payments: payments,
      total: payments.length
    };
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
