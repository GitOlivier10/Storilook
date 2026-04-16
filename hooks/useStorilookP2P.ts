import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  addFeedComment,
  addLocalCapture,
  computeManifestChecksum,
  deletePhoto as deletePhotoService,
  initSession,
  loadLastSessionManifest,
  listEntries,
} from '../services/manifest';
import { FeedComment, ManifestEntry } from '../services/manifestUtils';
import { SessionSharePayload } from '../services/sessionShare';

type SyncStatus = 'idle' | 'advertising' | 'negotiating' | 'transferring' | 'complete' | 'error';

interface EventState {
  id: string | null;
  eventName: string;
  createdAt: string;
  participants: string[];
  myPhotos: ManifestEntry[];
  albumFeed: ManifestEntry[];
  syncStatus: SyncStatus;
  manifestChecksum: string | null;
  hostSessionId: string | null;
}

const INITIAL_STATE: EventState = {
  id: null,
  eventName: '',
  createdAt: '',
  participants: ['Vous'],
  myPhotos: [],
  albumFeed: [],
  syncStatus: 'idle',
  manifestChecksum: null,
  hostSessionId: null,
};

export const useStorilookP2P = () => {
  const [eventState, setEventState] = useState<EventState>(INITIAL_STATE);
  const [isP2PActive, setIsP2PActive] = useState(false);

  const hasActiveSession = useMemo(() => eventState.id !== null, [eventState.id]);

  const startEvent = useCallback(async (name: string) => {
    try {
      const manifest = await initSession(name);
      const checksum = await computeManifestChecksum(manifest.sessionId);
      setEventState({
        id: manifest.sessionId,
        eventName: manifest.eventName,
        createdAt: manifest.createdAt,
        participants: ['Vous'],
        myPhotos: manifest.entries,
        albumFeed: [],
        syncStatus: 'advertising',
        manifestChecksum: checksum,
        hostSessionId: null,
      });
      setIsP2PActive(true);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', "Impossible de créer la session Storilook.");
    }
  }, []);

  const joinEvent = useCallback(async (payload: SessionSharePayload, guestName?: string) => {
    try {
      const manifest = await initSession(payload.eventName);
      const checksum = await computeManifestChecksum(manifest.sessionId);
      setEventState({
        id: manifest.sessionId,
        eventName: manifest.eventName,
        createdAt: manifest.createdAt,
        participants: [guestName ?? 'Vous'],
        myPhotos: manifest.entries,
        albumFeed: [],
        syncStatus: 'advertising',
        manifestChecksum: checksum,
        hostSessionId: payload.sessionId,
      });
      setIsP2PActive(true);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', "Impossible de rejoindre la session.");
    }
  }, []);

  const addLocalPhoto = useCallback(
    async (photoData: { uri: string; comment?: string; tags?: string[]; capturedAt?: string; timestamp?: string }) => {
      if (!eventState.id) return;
      try {
        const entry = await addLocalCapture({
          sessionId: eventState.id,
          sourceUri: photoData.uri,
          comment: photoData.comment,
          tags: photoData.tags,
          capturedAt: photoData.capturedAt ?? photoData.timestamp,
        });
        const checksum = await computeManifestChecksum(eventState.id);
        setEventState((prev) => ({
          ...prev,
          myPhotos: [...prev.myPhotos, entry],
          manifestChecksum: checksum,
        }));
      } catch (error) {
        console.error(error);
        Alert.alert('Erreur', 'Impossible de stocker la photo localement.');
      }
    },
    [eventState.id],
  );

  const addComment = useCallback(
    async (entryId: string, text: string, authorName = 'Vous') => {
      if (!eventState.id) return;
      try {
        const comment: FeedComment = {
          id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          authorName,
          text,
          timestamp: new Date().toISOString(),
        };
        const updatedEntry = await addFeedComment(eventState.id, entryId, comment);
        setEventState((prev) => ({
          ...prev,
          myPhotos: prev.myPhotos.map((e) => (e.id === entryId ? updatedEntry : e)),
          albumFeed: prev.albumFeed.map((e) => (e.id === entryId ? updatedEntry : e)),
        }));
      } catch (error) {
        console.error(error);
        Alert.alert('Erreur', "Impossible d'ajouter le commentaire.");
      }
    },
    [eventState.id],
  );

  const deletePhoto = useCallback(
    async (entryId: string) => {
      if (!eventState.id) return;
      try {
        await deletePhotoService(eventState.id, entryId);
        const checksum = await computeManifestChecksum(eventState.id);
        setEventState((prev) => ({
          ...prev,
          myPhotos: prev.myPhotos.filter((e) => e.id !== entryId),
          albumFeed: prev.albumFeed.filter((e) => e.id !== entryId),
          manifestChecksum: checksum,
        }));
      } catch (error) {
        console.error(error);
        Alert.alert('Erreur', 'Impossible de supprimer la photo.');
      }
    },
    [eventState.id],
  );

  const resetEvent = useCallback(() => {
    setEventState(INITIAL_STATE);
    setIsP2PActive(false);
  }, []);

  const triggerSynchronization = useCallback(async () => {
    if (!eventState.id || eventState.syncStatus !== 'advertising') return;

    setEventState((prev) => ({ ...prev, syncStatus: 'negotiating' }));

    try {
      const entries = await listEntries(eventState.id);
      const checksum = await computeManifestChecksum(eventState.id);

      setEventState((prev) => ({
        ...prev,
        albumFeed: entries,
        myPhotos: entries.filter((entry) => entry.status === 'local'),
        syncStatus: 'complete',
        manifestChecksum: checksum,
      }));
    } catch (error) {
      console.error(error);
      setEventState((prev) => ({ ...prev, syncStatus: 'error' }));
      Alert.alert('Erreur', 'La synchronisation a échoué.');
    }
  }, [eventState.id, eventState.syncStatus]);

  useEffect(() => () => {
    if (hasActiveSession) {
      console.log('Nettoyage : Arrêt du service P2P.');
    }
  }, [hasActiveSession]);

  useEffect(() => {
    (async () => {
      try {
        const lastSession = await loadLastSessionManifest();
        if (!lastSession) return;
        const checksum = await computeManifestChecksum(lastSession.sessionId);
        setEventState({
          id: lastSession.sessionId,
          eventName: lastSession.eventName,
          createdAt: lastSession.createdAt,
          participants: ['Vous'],
          myPhotos: lastSession.entries.filter((entry) => entry.status === 'local'),
          albumFeed: [],
          syncStatus: 'advertising',
          manifestChecksum: checksum,
          hostSessionId: null,
        });
        setIsP2PActive(true);
      } catch (error) {
        console.warn('Impossible de restaurer la dernière session Storilook', error);
      }
    })();
  }, []);

  return {
    eventData: eventState,
    isP2PActive,
    startEvent,
    joinEvent,
    triggerSynchronization,
    addLocalPhoto,
    addComment,
    deletePhoto,
    resetEvent,
  };
};
