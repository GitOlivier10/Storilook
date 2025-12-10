import * as FileSystem from 'expo-file-system';
import { canonicalManifestString, ManifestEntry, SessionManifest, sortManifestEntries } from './manifestUtils';

const STORAGE_ROOT = `${FileSystem.documentDirectory}storilook`;
const sessionDir = (sessionId: string) => `${STORAGE_ROOT}/${sessionId}`;
const mediaDir = (sessionId: string) => `${sessionDir(sessionId)}/media`;
const manifestFile = (sessionId: string) => `${sessionDir(sessionId)}/manifest.json`;
const registryFile = `${STORAGE_ROOT}/sessions.json`;

async function ensureStoragePermission() {
  const { granted } = await FileSystem.getPermissionsAsync();
  if (granted) {
    return;
  }

  const request = await FileSystem.requestPermissionsAsync();
  if (!request.granted) {
    throw new Error('Permission de stockage refusée');
  }
}

async function ensureDir(path: string) {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}

export type SessionRegistryEntry = {
  sessionId: string;
  eventName: string;
  createdAt: string;
  lastUpdated: string;
};

type SessionRegistry = {
  lastSessionId: string | null;
  sessions: SessionRegistryEntry[];
};

async function loadRegistry(): Promise<SessionRegistry> {
  await ensureStoragePermission();
  const info = await FileSystem.getInfoAsync(registryFile);
  if (!info.exists) {
    return { lastSessionId: null, sessions: [] };
  }
  const raw = await FileSystem.readAsStringAsync(registryFile, { encoding: FileSystem.EncodingType.UTF8 });
  return JSON.parse(raw) as SessionRegistry;
}

async function writeRegistry(registry: SessionRegistry) {
  await ensureDir(STORAGE_ROOT);
  const canonical = JSON.stringify(registry);
  await FileSystem.writeAsStringAsync(registryFile, canonical, { encoding: FileSystem.EncodingType.UTF8 });
}

export async function purgeAllSessions() {
  await ensureStoragePermission();
  const info = await FileSystem.getInfoAsync(STORAGE_ROOT);
  if (info.exists) {
    await FileSystem.deleteAsync(STORAGE_ROOT, { idempotent: true });
  }
}

async function upsertSessionMetadata(manifest: SessionManifest, lastUpdated?: string) {
  const registry = await loadRegistry();
  const updateTimestamp = lastUpdated ?? manifest.createdAt;
  const nextEntry: SessionRegistryEntry = {
    sessionId: manifest.sessionId,
    eventName: manifest.eventName,
    createdAt: manifest.createdAt,
    lastUpdated: updateTimestamp,
  };

  const existingIndex = registry.sessions.findIndex((session) => session.sessionId === manifest.sessionId);
  if (existingIndex >= 0) {
    registry.sessions[existingIndex] = { ...registry.sessions[existingIndex], ...nextEntry };
  } else {
    registry.sessions.push(nextEntry);
  }

  registry.lastSessionId = manifest.sessionId;
  await writeRegistry(registry);
}

async function writeManifest(manifest: SessionManifest) {
  const canonical = canonicalManifestString(manifest);
  await FileSystem.writeAsStringAsync(manifestFile(manifest.sessionId), canonical, { encoding: FileSystem.EncodingType.UTF8 });
}

export function fallbackChecksum(payload: string): string {
  // Fallback déterministe sans dépendance native (dérivé d'un hash 32 bits non cryptographique)
  let hash = 0;
  for (let i = 0; i < payload.length; i += 1) {
    const code = payload.charCodeAt(i);
    hash = (hash << 5) - hash + code;
    hash |= 0; // Force sur 32 bits
  }

  // Normalise en hexadécimal sur 8 caractères pour un affichage cohérent
  return `fallback-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

async function checksumFromString(payload: string): Promise<string> {
  const tempPath = `${FileSystem.cacheDirectory}storilook-manifest-${Date.now()}.json`;
  try {
    await FileSystem.writeAsStringAsync(tempPath, payload, { encoding: FileSystem.EncodingType.UTF8 });
    const info = await FileSystem.getInfoAsync(tempPath, { md5: true });
    await FileSystem.deleteAsync(tempPath, { idempotent: true });
    if (!info.md5) {
      return fallbackChecksum(payload);
    }
    return info.md5;
  } catch (error) {
    console.warn('Checksum natif indisponible, utilisation du fallback JS', error);
    try {
      await FileSystem.deleteAsync(tempPath, { idempotent: true });
    } catch {
      // ignore cleanup failure
    }
    return fallbackChecksum(payload);
  }
}

export const generateSessionId = () => `SL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

export async function initSession(eventName: string): Promise<SessionManifest> {
  await ensureStoragePermission();
  const sessionId = generateSessionId();
  await ensureDir(STORAGE_ROOT);
  await ensureDir(sessionDir(sessionId));
  await ensureDir(mediaDir(sessionId));

  const manifest: SessionManifest = {
    sessionId,
    eventName,
    createdAt: new Date().toISOString(),
    entries: [],
  };

  await writeManifest(manifest);
  await upsertSessionMetadata(manifest);
  return manifest;
}

export async function loadManifest(sessionId: string): Promise<SessionManifest> {
  const path = manifestFile(sessionId);
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    throw new Error(`Manifest introuvable pour la session ${sessionId}`);
  }
  const raw = await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.UTF8 });
  const parsed: SessionManifest = JSON.parse(raw);
  return { ...parsed, entries: sortManifestEntries(parsed.entries) };
}

export interface CaptureInput {
  sessionId: string;
  sourceUri: string;
  comment?: string;
  tags?: string[];
  capturedAt?: string;
}

const buildEntryChecksum = async (entry: Omit<ManifestEntry, 'checksum'>): Promise<string> => {
  const payload = `${entry.fileName}|${entry.captureTimestamp}|${entry.comment ?? ''}|${(entry.tags ?? []).join(',')}|${entry.status}`;
  return checksumFromString(payload);
};

export async function addLocalCapture(input: CaptureInput): Promise<ManifestEntry> {
  const { sessionId, sourceUri, comment, tags, capturedAt } = input;
  await ensureStoragePermission();
  await ensureDir(STORAGE_ROOT);
  await ensureDir(sessionDir(sessionId));
  await ensureDir(mediaDir(sessionId));

  const timestamp = capturedAt ?? new Date().toISOString();
  const fileName = `photo-${timestamp}-${Math.random().toString(36).substring(2, 8)}.jpg`;
  const targetUri = `${mediaDir(sessionId)}/${fileName}`;

  await FileSystem.copyAsync({ from: sourceUri, to: targetUri });

  const entryBase: Omit<ManifestEntry, 'checksum'> = {
    id: fileName,
    fileName,
    fileUri: targetUri,
    captureTimestamp: timestamp,
    comment,
    tags,
    status: 'local',
  };

  const checksum = await buildEntryChecksum(entryBase);
  const entry: ManifestEntry = { ...entryBase, checksum };

  const manifest = await loadManifest(sessionId);
  const updatedManifest: SessionManifest = { ...manifest, entries: [...manifest.entries, entry] };
  await writeManifest(updatedManifest);
  await upsertSessionMetadata(updatedManifest, entry.captureTimestamp);

  return entry;
}

export async function listEntries(sessionId: string): Promise<ManifestEntry[]> {
  const manifest = await loadManifest(sessionId);
  return sortManifestEntries(manifest.entries);
}

export async function markSynced(sessionId: string, entryIds: string[]): Promise<SessionManifest> {
  const manifest = await loadManifest(sessionId);
  const ids = new Set(entryIds);
  const updatedEntries = manifest.entries.map((entry) =>
    ids.has(entry.id) ? { ...entry, status: 'synced' as const } : entry,
  );
  const updatedManifest: SessionManifest = { ...manifest, entries: updatedEntries };
  await writeManifest(updatedManifest);
  await upsertSessionMetadata(updatedManifest);
  return updatedManifest;
}

export async function computeManifestChecksum(sessionId: string): Promise<string> {
  const manifest = await loadManifest(sessionId);
  const canonical = canonicalManifestString(manifest);
  return checksumFromString(canonical);
}

export async function loadLastSessionManifest(): Promise<SessionManifest | null> {
  const registry = await loadRegistry();
  if (!registry.lastSessionId) {
    return null;
  }

  try {
    return await loadManifest(registry.lastSessionId);
  } catch (error) {
    console.warn('Impossible de charger la dernière session Storilook', error);
    return null;
  }
}

export async function listSessionMetadata(): Promise<SessionRegistryEntry[]> {
  const registry = await loadRegistry();
  return registry.sessions.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
}
