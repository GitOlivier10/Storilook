import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  addLocalCapture,
  computeManifestChecksum,
  initSession,
  loadLastSessionManifest,
  listEntries,
  purgeAllSessions,
} from '../services/manifest';
import { ManifestEntry } from '../services/manifestUtils';

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
      });
      setIsP2PActive(true);
      Alert.alert('Succès', `L'événement '${name}' est lancé. ID: ${manifest.sessionId}`);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', "Impossible de créer la session Storilook. Vérifiez vos permissions de stockage.");
    }
  }, []);

  const addLocalPhoto = useCallback(
    async (photoData: { uri: string; comment?: string; tags?: string[]; capturedAt?: string; timestamp?: string }) => {
      if (!eventState.id) {
        return;
      }
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

  const triggerSynchronization = useCallback(async () => {
    if (!eventState.id || eventState.syncStatus !== 'advertising') return;

    setEventState((prev) => ({ ...prev, syncStatus: 'negotiating' }));
    Alert.alert('Synchro', 'Déclenchement du protocole PMH...');

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

      Alert.alert('Succès', `Album synchronisé. Checksum manifest: ${checksum.slice(0, 8)}…`);
    } catch (error) {
      console.error(error);
      setEventState((prev) => ({ ...prev, syncStatus: 'error' }));
      Alert.alert('Erreur', 'La synchronisation a échoué.');
    }
  }, [eventState.id, eventState.syncStatus]);

  const resetAllSessions = useCallback(async () => {
    await purgeAllSessions();
    setEventState(INITIAL_STATE);
    setIsP2PActive(false);
    Alert.alert('Réinitialisé', 'Toutes les sessions locales Storilook ont été supprimées.');
  }, []);

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
    triggerSynchronization,
    addLocalPhoto,
    resetAllSessions,
  };
};

export type StorilookP2PHandles = ReturnType<typeof useStorilookP2P>;
