import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  addLocalCapture,
  computeManifestChecksum,
  initSession,
  listEntries,
} from '../services/manifest';
import { ManifestEntry } from '../services/manifestUtils';

type SyncStatus = 'idle' | 'advertising' | 'negotiating' | 'transferring' | 'complete' | 'error';

interface EventState {
  id: string | null;
  eventName: string;
  participants: string[];
  myPhotos: ManifestEntry[];
  albumFeed: ManifestEntry[];
  syncStatus: SyncStatus;
}

const INITIAL_STATE: EventState = {
  id: null,
  eventName: '',
  participants: ['Vous'],
  myPhotos: [],
  albumFeed: [],
  syncStatus: 'idle',
};

export const useStorilookP2P = () => {
  const [eventState, setEventState] = useState<EventState>(INITIAL_STATE);
  const [isP2PActive, setIsP2PActive] = useState(false);

  const hasActiveSession = useMemo(() => eventState.id !== null, [eventState.id]);

  const startEvent = useCallback(async (name: string) => {
    try {
      const manifest = await initSession(name);
      setEventState({
        id: manifest.sessionId,
        eventName: manifest.eventName,
        participants: ['Vous'],
        myPhotos: manifest.entries,
        albumFeed: [],
        syncStatus: 'advertising',
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
        setEventState((prev) => ({ ...prev, myPhotos: [...prev.myPhotos, entry] }));
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
      }));

      Alert.alert('Succès', `Album synchronisé. Checksum manifest: ${checksum.slice(0, 8)}…`);
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

  return {
    eventData: eventState,
    isP2PActive,
    startEvent,
    triggerSynchronization,
    addLocalPhoto,
  };
};
