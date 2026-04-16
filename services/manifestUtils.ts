export type ManifestEntryStatus = 'local' | 'synced';

export interface FeedComment {
  id: string;
  authorName: string;
  text: string;
  timestamp: string;
}

export interface ManifestEntry {
  id: string;
  fileName: string;
  fileUri: string;
  captureTimestamp: string;
  comment?: string;
  tags?: string[];
  feedComments?: FeedComment[];
  checksum: string;
  status: ManifestEntryStatus;
}

export interface SessionManifest {
  sessionId: string;
  eventName: string;
  createdAt: string;
  entries: ManifestEntry[];
}

export const sortManifestEntries = (entries: ManifestEntry[]): ManifestEntry[] =>
  [...entries].sort((a, b) => {
    if (a.captureTimestamp === b.captureTimestamp) {
      return a.id.localeCompare(b.id);
    }
    return a.captureTimestamp.localeCompare(b.captureTimestamp);
  });

export const canonicalizeManifest = (manifest: SessionManifest): SessionManifest => ({
  ...manifest,
  entries: sortManifestEntries(manifest.entries).map((entry) => ({
    ...entry,
    comment: entry.comment ?? '',
    tags: entry.tags ?? [],
  })),
});

export const canonicalManifestString = (manifest: SessionManifest): string =>
  JSON.stringify(canonicalizeManifest(manifest));
