import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import {auth, db, handleFirestoreError, OperationType} from '../firebase';

const CTA_LOCKS_COLLECTION = 'ctaLocks';
const LOCAL_DEVICE_KEY_STORAGE = 'nice_device_fallback_key_v1';
const SESSION_IP_CACHE_KEY = 'nice_device_ip_v1';
const LOCAL_LOCK_RECORD_PREFIX = 'nice_cta_lock_record_v1:';
const LOCAL_ADMIN_UNLOCK_KEY = 'nice_cta_local_admin_unlock_v1';

export interface DeviceCtaLockState {
  deviceKey: string;
  firstSeenAtMs: number;
  epoch: number;
  adminUnlocked: boolean;
}

export interface AdminCtaLockEntry extends DeviceCtaLockState {
  updatedAtMs: number;
}

async function sha256Hex(input: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(input);
    const digest = await window.crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function getOrCreateFallbackDeviceKey(): string {
  try {
    const saved = localStorage.getItem(LOCAL_DEVICE_KEY_STORAGE);
    if (saved && /^[a-zA-Z0-9_-]{8,128}$/.test(saved)) {
      return saved;
    }
    const generated = `dev_${crypto.randomUUID().replace(/-/g, '')}`;
    localStorage.setItem(LOCAL_DEVICE_KEY_STORAGE, generated);
    return generated;
  } catch {
    return `dev_${Date.now().toString(36)}`;
  }
}

async function fetchPublicIpWithTimeout(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 3200);
  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) return '';
    const json = (await res.json()) as {ip?: string};
    return typeof json.ip === 'string' ? json.ip.trim() : '';
  } catch {
    return '';
  } finally {
    window.clearTimeout(timer);
  }
}

export async function resolveDeviceIpLockKey(): Promise<string> {
  try {
    const cachedIp = sessionStorage.getItem(SESSION_IP_CACHE_KEY);
    if (cachedIp) {
      const digest = await sha256Hex(`nice-cta-lock:${cachedIp}`);
      return `ip_${digest.slice(0, 32)}`;
    }
  } catch {
    // Ignore storage read errors
  }

  let ip = await fetchPublicIpWithTimeout('https://api64.ipify.org?format=json');
  if (!ip) {
    ip = await fetchPublicIpWithTimeout('https://api.ipify.org?format=json');
  }

  if (ip) {
    try {
      sessionStorage.setItem(SESSION_IP_CACHE_KEY, ip);
    } catch {
      // Ignore storage write errors
    }
    const digest = await sha256Hex(`nice-cta-lock:${ip}`);
    return `ip_${digest.slice(0, 32)}`;
  }

  return getOrCreateFallbackDeviceKey();
}

function readLocalLockRecord(deviceKey: string): DeviceCtaLockState | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_LOCK_RECORD_PREFIX}${deviceKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DeviceCtaLockState>;
    if (
      typeof parsed.firstSeenAtMs === 'number' &&
      Number.isFinite(parsed.firstSeenAtMs)
    ) {
      return {
        deviceKey,
        firstSeenAtMs: parsed.firstSeenAtMs,
        epoch: typeof parsed.epoch === 'number' ? parsed.epoch : 0,
        adminUnlocked: Boolean(parsed.adminUnlocked),
      };
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveLocalLockRecord(record: DeviceCtaLockState): void {
  try {
    localStorage.setItem(
      `${LOCAL_LOCK_RECORD_PREFIX}${record.deviceKey}`,
      JSON.stringify(record)
    );
  } catch {
    // Ignore storage errors
  }
}

export function getLocalAdminUnlockEpoch(): number {
  try {
    const raw = localStorage.getItem(LOCAL_ADMIN_UNLOCK_KEY);
    const val = raw ? Number(raw) : 0;
    return Number.isFinite(val) && val > 0 ? val : 0;
  } catch {
    return 0;
  }
}

export function setLocalAdminUnlockEpoch(epoch: number): void {
  try {
    if (epoch > 0) {
      localStorage.setItem(LOCAL_ADMIN_UNLOCK_KEY, String(epoch));
    } else {
      localStorage.removeItem(LOCAL_ADMIN_UNLOCK_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export async function syncDeviceCtaLock(
  deviceKey: string,
  adminEpoch: number
): Promise<DeviceCtaLockState> {
  const now = Date.now();
  const path = `${CTA_LOCKS_COLLECTION}/${deviceKey}`;
  const docRef = doc(db, CTA_LOCKS_COLLECTION, deviceKey);
  const localCached = readLocalLockRecord(deviceKey);

  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<DeviceCtaLockState>;
      const remoteFirstSeen =
        typeof data.firstSeenAtMs === 'number' &&
        Number.isFinite(data.firstSeenAtMs)
          ? data.firstSeenAtMs
          : now;
      const remoteEpoch =
        typeof data.epoch === 'number' && Number.isFinite(data.epoch)
          ? data.epoch
          : 0;

      // If an admin triggered a global unlock epoch newer than this device's lock record,
      // preserve unlocked status immediately when previously locked, or start fresh cleanly.
      if (adminEpoch > remoteEpoch) {
        const refreshed: DeviceCtaLockState = {
          deviceKey,
          firstSeenAtMs: now,
          epoch: adminEpoch,
          adminUnlocked: false,
        };
        try {
          await updateDoc(docRef, {
            firstSeenAtMs: now,
            epoch: adminEpoch,
            adminUnlocked: false,
            updatedAt: serverTimestamp(),
          });
        } catch {
          // Non-fatal if siteContent/main doc isn't published yet
        }
        saveLocalLockRecord(refreshed);
        return refreshed;
      }

      const state: DeviceCtaLockState = {
        deviceKey,
        firstSeenAtMs: remoteFirstSeen,
        epoch: remoteEpoch,
        adminUnlocked: Boolean(data.adminUnlocked),
      };
      saveLocalLockRecord(state);
      return state;
    }

    const initial: DeviceCtaLockState = {
      deviceKey,
      firstSeenAtMs: localCached?.firstSeenAtMs ?? now,
      epoch: adminEpoch,
      adminUnlocked: false,
    };

    try {
      await setDoc(docRef, {
        deviceKey,
        firstSeenAtMs: initial.firstSeenAtMs,
        epoch: adminEpoch,
        adminUnlocked: false,
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Keep local record operational if network/rules disallow write
    }

    saveLocalLockRecord(initial);
    return initial;
  } catch (err) {
    if (localCached) {
      return localCached;
    }
    const fallback: DeviceCtaLockState = {
      deviceKey,
      firstSeenAtMs: now,
      epoch: adminEpoch,
      adminUnlocked: false,
    };
    saveLocalLockRecord(fallback);
    if (
      err instanceof Error &&
      err.message.toLowerCase().includes('permission')
    ) {
      try {
        handleFirestoreError(err, OperationType.GET, path);
      } catch {
        // Fallback already returned cleanly for visitor resiliency
      }
    }
    return fallback;
  }
}

export async function adminUnlockDeviceLock(
  deviceKey: string,
  epoch: number
): Promise<void> {
  if (!auth.currentUser) {
    saveLocalLockRecord({
      deviceKey,
      firstSeenAtMs: Date.now(),
      epoch,
      adminUnlocked: true,
    });
    return;
  }
  const path = `${CTA_LOCKS_COLLECTION}/${deviceKey}`;
  const docRef = doc(db, CTA_LOCKS_COLLECTION, deviceKey);
  try {
    await setDoc(docRef, {
      deviceKey,
      firstSeenAtMs: Date.now(),
      epoch,
      adminUnlocked: true,
      updatedAt: serverTimestamp(),
    });
    saveLocalLockRecord({
      deviceKey,
      firstSeenAtMs: Date.now(),
      epoch,
      adminUnlocked: true,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function adminResetDeviceLock(deviceKey: string): Promise<void> {
  try {
    localStorage.removeItem(`${LOCAL_LOCK_RECORD_PREFIX}${deviceKey}`);
    localStorage.removeItem(LOCAL_ADMIN_UNLOCK_KEY);
  } catch {
    // Ignore storage errors
  }

  if (!auth.currentUser) {
    return;
  }

  const path = `${CTA_LOCKS_COLLECTION}/${deviceKey}`;
  try {
    await deleteDoc(doc(db, CTA_LOCKS_COLLECTION, deviceKey));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeToAdminCtaLocks(
  onData: (locks: AdminCtaLockEntry[]) => void
): Unsubscribe {
  const q = query(
    collection(db, CTA_LOCKS_COLLECTION),
    orderBy('updatedAt', 'desc'),
    limit(25)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const entries: AdminCtaLockEntry[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as {
          deviceKey?: string;
          firstSeenAtMs?: number;
          epoch?: number;
          adminUnlocked?: boolean;
          updatedAt?: {toMillis?: () => number};
        };
        return {
          deviceKey: data.deviceKey || docSnap.id,
          firstSeenAtMs:
            typeof data.firstSeenAtMs === 'number'
              ? data.firstSeenAtMs
              : Date.now(),
          epoch: typeof data.epoch === 'number' ? data.epoch : 0,
          adminUnlocked: Boolean(data.adminUnlocked),
          updatedAtMs:
            typeof data.updatedAt?.toMillis === 'function'
              ? data.updatedAt.toMillis()
              : Date.now(),
        };
      });
      onData(entries);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, CTA_LOCKS_COLLECTION);
      } catch {
        // Non-fatal in listener when user is not yet signed in with Google
      }
    }
  );
}
