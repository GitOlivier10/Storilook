import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { canonicalManifestString, FeedComment, ManifestEntry, SessionManifest, sortManifestEntries } from './manifestUtils';

const MAX_IMAGE_DIMENSION = 1920;
const IMAGE_COMPRESSION_QUALITY = 0.8;

const STORAGE_ROOT = `${FileSystem.documentDirectory}storilook`;
const sessionDir = (sessionId: string) => `${STORAGE_ROOT}/${sessionId}`;
const mediaDir = (sessionId: string) => `${sessionDir(sessionId)}/media`;
const manifestFile = (sessionId: string) => `${sessionDir(sessionId)}/manifest.json`;
const registryFile = `${STORAGE_ROOT}/sessions.json`;

async function ensureDir(path: string) {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}

type SessionRegistryEntry = {
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

async function checksumFromString(payload: string): Promise<string> {
  const tempPath = `${FileSystem.cacheDirectory}storilook-manifest-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(tempPath, payload, { encoding: FileSystem.EncodingType.UTF8 });
  const info = await FileSystem.getInfoAsync(tempPath, { md5: true });
  await FileSystem.deleteAsync(tempPath, { idempotent: true });
  if (!info.md5) {
    throw new Error('Impossible de calculer le checksum local.');
  }
  return info.md5;
}

export const generateSessionId = () => `SL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

export async function initSession(eventName: string): Promise<SessionManifest> {
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

async function compressImage(sourceUri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      sourceUri,
      [{ resize: { width: MAX_IMAGE_DIMENSION } }],
      { compress: IMAGE_COMPRESSION_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
    );
    return result.uri;
  } catch (error) {
    console.warn('Compression image échouée, fallback sur original', error);
    return sourceUri;
  }
}

export async function addLocalCapture(input: CaptureInput): Promise<ManifestEntry> {
  const { sessionId, sourceUri, comment, tags, capturedAt } = input;
  await ensureDir(STORAGE_ROOT);
  await ensureDir(sessionDir(sessionId));
  await ensureDir(mediaDir(sessionId));

  const timestamp = capturedAt ?? new Date().toISOString();
  const fileName = `photo-${timestamp}-${Math.random().toString(36).substring(2, 8)}.jpg`;
  const targetUri = `${mediaDir(sessionId)}/${fileName}`;

  const compressedUri = await compressImage(sourceUri);
  await FileSystem.copyAsync({ from: compressedUri, to: targetUri });

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

export async function addFeedComment(
  sessionId: string,
  entryId: string,
  comment: FeedComment,
): Promise<ManifestEntry> {
  const manifest = await loadManifest(sessionId);
  const entryIndex = manifest.entries.findIndex((e) => e.id === entryId);
  if (entryIndex === -1) {
    throw new Error(`Entry ${entryId} introuvable dans la session ${sessionId}`);
  }
  const updatedEntry: ManifestEntry = {
    ...manifest.entries[entryIndex],
    feedComments: [...(manifest.entries[entryIndex].feedComments ?? []), comment],
  };
  const updatedEntries = [...manifest.entries];
  updatedEntries[entryIndex] = updatedEntry;
  const updatedManifest: SessionManifest = { ...manifest, entries: updatedEntries };
  await writeManifest(updatedManifest);
  await upsertSessionMetadata(updatedManifest);
  return updatedEntry;
}

export async function deletePhoto(sessionId: string, entryId: string): Promise<SessionManifest> {
  const manifest = await loadManifest(sessionId);
  const entry = manifest.entries.find((e) => e.id === entryId);
  if (!entry) {
    throw new Error(`Entry ${entryId} introuvable dans la session ${sessionId}`);
  }
  try {
    await FileSystem.deleteAsync(entry.fileUri, { idempotent: true });
  } catch (error) {
    console.warn('Impossible de supprimer le fichier photo', error);
  }
  const updatedEntries = manifest.entries.filter((e) => e.id !== entryId);
  const updatedManifest: SessionManifest = { ...manifest, entries: updatedEntries };
  await writeManifest(updatedManifest);
  await upsertSessionMetadata(updatedManifest);
  return updatedManifest;
}

export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(sessionDir(sessionId), { idempotent: true });
  } catch (error) {
    console.warn(`Impossible de supprimer le dossier de session ${sessionId}`, error);
  }
  const registry = await loadRegistry();
  registry.sessions = registry.sessions.filter((s) => s.sessionId !== sessionId);
  if (registry.lastSessionId === sessionId) {
    registry.lastSessionId = registry.sessions.length > 0 ? registry.sessions[0].sessionId : null;
  }
  await writeRegistry(registry);
}

export async function clearAllData(): Promise<void> {
  await FileSystem.deleteAsync(STORAGE_ROOT, { idempotent: true });
}
