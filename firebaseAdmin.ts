import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore, Firestore, Timestamp } from "firebase-admin/firestore";

/**
 * Firebase Admin bootstrap.
 *
 * Supported auth methods:
 *  1) GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 *  2) FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' (stringified JSON)
 *
 * The app will use FIREBASE_PROJECT_ID to target the correct project.
 */

let _firestore: Firestore | null = null;

export function getFirestoreAdmin(): Firestore {
  if (_firestore) return _firestore;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      "Missing FIREBASE_PROJECT_ID. Set it in your environment (.env / platform env vars)."
    );
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  const apps = getApps();
  if (apps.length === 0) {
    if (serviceAccountJson) {
      const creds = JSON.parse(serviceAccountJson);
      initializeApp({ credential: cert(creds), projectId });
    } else {
      // Uses GOOGLE_APPLICATION_CREDENTIALS or other ADC providers.
      initializeApp({ credential: applicationDefault(), projectId });
    }
  }

  _firestore = getFirestore();
  return _firestore;
}

// --------- Helpers for Date/Timestamp compatibility ---------

function isTimestamp(v: unknown): v is Timestamp {
  return !!v && typeof v === "object" && (v as any).toDate && (v as any).seconds !== undefined;
}

/**
 * Convert Firestore Timestamps to JS Date recursively (keeps other values unchanged).
 */
export function convertTimestampsToDates(value: any): any {
  if (isTimestamp(value)) return value.toDate();
  if (Array.isArray(value)) return value.map(v => convertTimestampsToDates(v));
  if (value && typeof value === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = convertTimestampsToDates(v);
    }
    return out;
  }
  return value;
}
