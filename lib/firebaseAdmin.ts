// lib/firebaseAdmin.ts
import admin from 'firebase-admin';
import serviceAccount from '../service-account.json'; // Adjust path as needed

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
    });
    
    console.log('✅ Firebase Admin initialized successfully using service account file');
    
    // Optional verification test
    admin.firestore().collection('_test_').doc('_test_')
      .set({ timestamp: admin.firestore.FieldValue.serverTimestamp() })
      .then(() => console.log('✅ Firestore write test successful'))
      .catch(err => console.error('❌ Firestore write test failed:', err));
      
  } catch (error) {
    console.error('🔥 Firebase Admin initialization failed:', error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    throw error;
  }
}
const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };
export default admin;