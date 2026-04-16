import * as FileSystem from 'expo-file-system/legacy';

const STORAGE_ROOT = `${FileSystem.documentDirectory}storilook`;
const PROFILE_FILE = `${STORAGE_ROOT}/profile.json`;

export interface UserProfile {
  name: string;
}

const DEFAULT_PROFILE: UserProfile = { name: 'Moi' };

export async function loadUserProfile(): Promise<UserProfile> {
  try {
    const info = await FileSystem.getInfoAsync(PROFILE_FILE);
    if (!info.exists) return DEFAULT_PROFILE;
    const raw = await FileSystem.readAsStringAsync(PROFILE_FILE, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(STORAGE_ROOT);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(STORAGE_ROOT, { intermediates: true });
  }
  await FileSystem.writeAsStringAsync(PROFILE_FILE, JSON.stringify(profile), {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

export async function getStorageInfo(): Promise<{ sessionCount: number; photoCount: number }> {
  try {
    const registryPath = `${STORAGE_ROOT}/sessions.json`;
    const info = await FileSystem.getInfoAsync(registryPath);
    if (!info.exists) return { sessionCount: 0, photoCount: 0 };
    const raw = await FileSystem.readAsStringAsync(registryPath, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const registry = JSON.parse(raw) as { sessions: { sessionId: string }[] };
    const sessionCount = registry.sessions.length;

    let photoCount = 0;
    for (const session of registry.sessions) {
      const manifestPath = `${STORAGE_ROOT}/${session.sessionId}/manifest.json`;
      const mInfo = await FileSystem.getInfoAsync(manifestPath);
      if (mInfo.exists) {
        const mRaw = await FileSystem.readAsStringAsync(manifestPath, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const manifest = JSON.parse(mRaw) as { entries: unknown[] };
        photoCount += manifest.entries.length;
      }
    }
    return { sessionCount, photoCount };
  } catch {
    return { sessionCount: 0, photoCount: 0 };
  }
}
