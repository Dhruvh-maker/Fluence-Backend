import admin from 'firebase-admin';

let initialized = false;

export function initFirebase() {
  if (initialized) return;
  const credJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!credJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not set');
  }
  
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(credJson);
  } catch (error) {
    throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT_JSON: ${error.message}`);
  }
  
  const credential = admin.credential.cert(serviceAccount);
  admin.initializeApp({ credential });
  initialized = true;
}

export async function verifyFirebaseIdToken(idToken) {
  if (!initialized) initFirebase();
  const decoded = await admin.auth().verifyIdToken(idToken);
  // decoded contains uid, email, name, phone_number, firebase.sign_in_provider
  return decoded;
}

