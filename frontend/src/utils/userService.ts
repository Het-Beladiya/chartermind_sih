import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { User as FirebaseUser } from "firebase/auth";

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  company: string;
  role: string;
  avatarUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Called after every successful Firebase sign-in.
 * - First login  => creates a new Firestore document under users/{uid}
 * - Later logins => refreshes avatar/name without overwriting company/role
 * Includes a 5-second timeout so it never hangs authentication if Firestore is unreachable.
 */
export async function syncUserToFirestore(
  firebaseUser: FirebaseUser,
  extra?: { name?: string; company?: string; role?: string }
): Promise<AppUser> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Firestore sync timed out")), 5000)
  );

  const syncPromise = (async () => {
    const userRef = doc(db, "users", firebaseUser.uid);
    let snapshot = null;
    try {
      snapshot = await getDoc(userRef);
    } catch (err) {
      console.warn("Firestore getDoc check notice:", err);
    }

    const baseProfile: AppUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? "",
      name:
        extra?.name ??
        firebaseUser.displayName ??
        firebaseUser.email?.split("@")[0] ??
        "Maritime User",
      company: extra?.company ?? "Maritime Logistics Corp",
      role: extra?.role ?? "charterer",
      avatarUrl: firebaseUser.photoURL ?? undefined,
    };

    if (!snapshot || !snapshot.exists()) {
      await setDoc(userRef, {
        ...baseProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return baseProfile;
    } else {
      const updates: Record<string, any> = { updatedAt: serverTimestamp() };
      if (firebaseUser.photoURL) updates.avatarUrl = firebaseUser.photoURL;
      if (firebaseUser.displayName) updates.name = firebaseUser.displayName;
      if (extra?.company) updates.company = extra.company;
      if (extra?.role) updates.role = extra.role;
      await setDoc(userRef, updates, { merge: true });
      return { ...(snapshot.data() as AppUser), ...updates };
    }
  })();

  return Promise.race([syncPromise, timeoutPromise]);
}

/**
 * Fetch a user profile from Firestore by UID.
 */
export async function getUserProfile(uid: string): Promise<AppUser | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? (snap.data() as AppUser) : null;
  } catch (err) {
    console.warn("Firestore getUserProfile error:", err);
    return null;
  }
}

/**
 * Persist the user's active voyage plan / cargo request in Cloud Firestore.
 */
export async function saveUserPlanToFirestore(uid: string, cargoRequest: any): Promise<void> {
  if (!uid || uid.startsWith("demo-")) return;
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(
      userRef,
      {
        activeCargoRequest: cargoRequest,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not persist voyage plan to Firestore:", err);
  }
}

/**
 * Fetch the user's saved active voyage plan from Cloud Firestore.
 */
export async function getUserPlanFromFirestore(uid: string): Promise<any | null> {
  if (!uid || uid.startsWith("demo-")) return null;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      return snap.data()?.activeCargoRequest || null;
    }
  } catch (err) {
    console.warn("Could not fetch voyage plan from Firestore:", err);
  }
  return null;
}
