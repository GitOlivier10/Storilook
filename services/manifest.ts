import * as FileSystem from 'expo-file-system';
import { canonicalManifestString, ManifestEntry, SessionManifest, sortManifestEntries } from './manifestUtils';

const STORAGE_ROOT = `${FileSystem.documentDirectory}storilook`;
const sessionDir = (sessionId: string) => `${STORAGE_ROOT}/${sessionId}`;
const mediaDir = (sessionId: string) => `${sessionDir(sessionId)}/media`;
const manifestFile = (sessionId: string) => `${sessionDir(sessionId)}/manifest.json`;

async function ensureDir(path: string) {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
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
  return updatedManifest;
}

export async function computeManifestChecksum(sessionId: string): Promise<string> {
  const manifest = await loadManifest(sessionId);
  const canonical = canonicalManifestString(manifest);
  return checksumFromString(canonical);
}
