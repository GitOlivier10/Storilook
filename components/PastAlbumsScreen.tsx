import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { loadManifest, listSessionMetadata } from '../services/manifest';

const COLORS = {
  primary: '#FF1493',
  secondary: '#FF6347',
  background: '#FAFAFA',
  text: '#333',
  lightGray: '#EAEAEA',
};

interface AlbumItem {
  sessionId: string;
  eventName: string;
  createdAt: string;
  photoCount: number;
}

export default function PastAlbumsScreen() {
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlbums = useCallback(async () => {
    try {
      const sessions = await listSessionMetadata();
      const items: AlbumItem[] = await Promise.all(
        sessions.map(async (session) => {
          let photoCount = 0;
          try {
            const manifest = await loadManifest(session.sessionId);
            photoCount = manifest.entries.length;
          } catch {
            // manifest absent
          }
          return {
            sessionId: session.sessionId,
            eventName: session.eventName,
            createdAt: session.createdAt,
            photoCount,
          };
        }),
      );
      setAlbums(items);
    } catch (error) {
      console.error('Erreur chargement albums', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAlbums();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Albums Passés</Text>
        <Text style={styles.headerSub}>
          {albums.length} événement{albums.length > 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={albums}
        keyExtractor={(item) => item.sessionId}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        contentContainerStyle={albums.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={64} color={COLORS.lightGray} />
            <Text style={styles.emptyTitle}>Aucun album</Text>
            <Text style={styles.emptySub}>
              Créez votre premier événement dans l'onglet "En cours".
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.85}>
            <View style={styles.cardIcon}>
              <Ionicons name="images" size={28} color={COLORS.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.eventName}
              </Text>
              <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
              <View style={styles.cardMeta}>
                <Ionicons name="camera-outline" size={13} color="#AAA" />
                <Text style={styles.cardMetaText}>
                  {item.photoCount} photo{item.photoCount > 1 ? 's' : ''}
                </Text>
                <Text style={styles.cardId}>{item.sessionId}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  headerSub: { fontSize: 13, color: '#AAA', marginTop: 2 },
  list: { padding: 16, gap: 10 },
  emptyContainer: { flex: 1 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#CCC' },
  emptySub: { fontSize: 14, color: '#CCC', textAlign: 'center', lineHeight: 20 },
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFF0F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  cardDate: { fontSize: 13, color: '#888', marginTop: 2 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  cardMetaText: { fontSize: 12, color: '#AAA' },
  cardId: { fontSize: 11, color: COLORS.lightGray, marginLeft: 8 },
});
