import { SessionManifest } from './manifestUtils';

export interface SessionSharePayload {
  version: 1;
  sessionId: string;
  eventName: string;
  createdAt: string;
  manifestChecksum?: string;
}

export const buildSessionSharePayload = (
  manifest: Pick<SessionManifest, 'sessionId' | 'eventName' | 'createdAt'>,
  manifestChecksum?: string | null,
): SessionSharePayload => ({
  version: 1,
  sessionId: manifest.sessionId,
  eventName: manifest.eventName,
  createdAt: manifest.createdAt,
  ...(manifestChecksum ? { manifestChecksum } : {}),
});

export const serializeSessionSharePayload = (
  manifest: Pick<SessionManifest, 'sessionId' | 'eventName' | 'createdAt'>,
  manifestChecksum?: string | null,
) => JSON.stringify(buildSessionSharePayload(manifest, manifestChecksum));
