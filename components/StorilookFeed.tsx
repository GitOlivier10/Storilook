import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useStorilookP2P } from '../hooks/useStorilookP2P';
import { FeedComment, ManifestEntry } from '../services/manifestUtils';
import { serializeSessionSharePayload } from '../services/sessionShare';
import AnnotationScreen from './AnnotationScreen';
import CameraHandler from './CameraHandler';
import PhotoDetailScreen from './PhotoDetailScreen';
import { saveEntryToGallery, shareEntry } from '../services/mediaShare';

const COLORS = {
  primary: '#FF1493',
  secondary: '#FF6347',
  background: '#FAFAFA',
  text: '#333',
  lightGray: '#EAEAEA',
  border: '#DDD',
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 3) / 2; // 2 colonnes avec 1px de gap

type ViewMode = 'album' | 'feed';
type CaptureState = 'dashboard' | 'camera' | 'annotation';

// ─── Vue Album : grille 2 colonnes ───────────────────────────────────────────

interface AlbumGridProps {
  photos: ManifestEntry[];
  onCapture: () => void;
  onOpenPhoto: (index: number) => void;
}

const AlbumGrid: React.FC<AlbumGridProps> = ({ photos, onCapture, onOpenPhoto }) => {
  if (photos.length === 0) {
    return (
      <View style={gridStyles.empty}>
        <Text style={gridStyles.emptyIcon}>📷</Text>
        <Text style={gridStyles.emptyText}>Aucune photo pour l'instant</Text>
        <TouchableOpacity style={gridStyles.emptyBtn} onPress={onCapture}>
          <Text style={gridStyles.emptyBtnText}>Prendre une photo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={photos}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 1 }}
      ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
      contentContainerStyle={{ paddingBottom: 120 }}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          style={gridStyles.cell}
          activeOpacity={0.8}
          onPress={() => onOpenPhoto(index)}
        >
          <Image source={{ uri: item.fileUri }} style={gridStyles.image} />
          {(item.feedComments?.length ?? 0) > 0 && (
            <View style={gridStyles.commentBadge}>
              <Text style={gridStyles.commentBadgeText}>
                💬 {item.feedComments!.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    />
  );
};

const gridStyles = StyleSheet.create({
  cell: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    backgroundColor: COLORS.lightGray,
  },
  image: { width: '100%', height: '100%' },
  commentBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  commentBadgeText: { color: 'white', fontSize: 11 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: '#AAA' },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  emptyBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
});

// ─── Vue Feed : style Instagram avec commentaires ─────────────────────────────

interface FeedPostProps {
  entry: ManifestEntry;
  onAddComment: (entryId: string, text: string) => void;
  onOpenPhoto: () => void;
}

const FeedPost: React.FC<FeedPostProps> = ({ entry, onAddComment, onOpenPhoto }) => {
  const [draft, setDraft] = useState('');

  const submitComment = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAddComment(entry.id, trimmed);
    setDraft('');
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'À l\'instant';
    if (mins < 60) return `il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `il y a ${hrs} h`;
    return `il y a ${Math.floor(hrs / 24)} j`;
  };

  return (
    <View style={feedStyles.post}>
      {/* En-tête */}
      <View style={feedStyles.header}>
        <View style={feedStyles.avatar}>
          <Text style={feedStyles.avatarText}>V</Text>
        </View>
        <View>
          <Text style={feedStyles.author}>Vous</Text>
          <Text style={feedStyles.time}>{timeAgo(entry.captureTimestamp)}</Text>
        </View>
      </View>

      {/* Photo */}
      <TouchableOpacity activeOpacity={0.95} onPress={onOpenPhoto}>
        <Image source={{ uri: entry.fileUri }} style={feedStyles.photo} resizeMode="cover" />
      </TouchableOpacity>

      {/* Légende (annotation de capture) */}
      {(entry.comment || (entry.tags && entry.tags.length > 0)) && (
        <View style={feedStyles.caption}>
          {entry.comment ? <Text style={feedStyles.captionText}>{entry.comment}</Text> : null}
          {entry.tags && entry.tags.length > 0 && (
            <Text style={feedStyles.tags}>{entry.tags.map((t) => `#${t}`).join(' ')}</Text>
          )}
        </View>
      )}

      {/* Commentaires existants */}
      {(entry.feedComments ?? []).map((c: FeedComment) => (
        <View key={c.id} style={feedStyles.commentRow}>
          <Text style={feedStyles.commentAuthor}>{c.authorName}</Text>
          <Text style={feedStyles.commentText}> {c.text}</Text>
        </View>
      ))}

      {/* Saisie commentaire */}
      <View style={feedStyles.inputRow}>
        <TextInput
          style={feedStyles.commentInput}
          placeholder="Ajouter un commentaire…"
          placeholderTextColor="#BBB"
          value={draft}
          onChangeText={setDraft}
          returnKeyType="send"
          onSubmitEditing={submitComment}
          blurOnSubmit={false}
        />
        {draft.trim().length > 0 && (
          <TouchableOpacity onPress={submitComment} style={feedStyles.sendBtn}>
            <Text style={feedStyles.sendText}>Publier</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const feedStyles = StyleSheet.create({
  post: {
    backgroundColor: 'white',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 15 },
  author: { fontWeight: '700', fontSize: 14, color: COLORS.text },
  time: { fontSize: 12, color: '#AAA' },
  photo: { width: '100%', aspectRatio: 1 },
  caption: { padding: 12, paddingBottom: 6 },
  captionText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  tags: { fontSize: 13, color: COLORS.primary, marginTop: 4 },
  commentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  commentAuthor: { fontWeight: '700', fontSize: 13, color: COLORS.text },
  commentText: { fontSize: 13, color: COLORS.text, flex: 1 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 0,
  },
  sendBtn: {},
  sendText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
});

// ─── Composant principal ──────────────────────────────────────────────────────

export default function StorilookFeed() {
  const { eventData, triggerSynchronization, addLocalPhoto, addComment, deletePhoto } = useStorilookP2P();
  const { syncStatus, eventName, albumFeed, myPhotos, id: sessionId, createdAt, manifestChecksum } = eventData;

  const [captureState, setCaptureState] = useState<CaptureState>('dashboard');
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('album');
  const [detailIndex, setDetailIndex] = useState<number | null>(null);

  const photosToShow = syncStatus === 'complete' ? albumFeed : myPhotos;

  const sharePayload = useMemo(
    () =>
      sessionId
        ? serializeSessionSharePayload(
            { sessionId, eventName, createdAt: createdAt || new Date().toISOString() },
            manifestChecksum,
          )
        : null,
    [sessionId, eventName, createdAt, manifestChecksum],
  );

  // ── Flux de capture ──────────────────────────────────────────────────────────

  if (captureState === 'camera') {
    return (
      <CameraHandler
        onPhotoCaptured={(uri) => {
          setCapturedPhotoUri(uri);
          setCaptureState('annotation');
        }}
      />
    );
  }

  if (captureState === 'annotation') {
    return (
      <AnnotationScreen
        imageUri={capturedPhotoUri ?? ''}
        onFinish={async (comment, tags) => {
          if (!capturedPhotoUri) return;
          await addLocalPhoto({ uri: capturedPhotoUri, comment, tags });
          setCapturedPhotoUri(null);
          setCaptureState('dashboard');
        }}
      />
    );
  }

  // ── Détail photo (plein écran) ──────────────────────────────────────────────
  if (detailIndex !== null && photosToShow[detailIndex]) {
    return (
      <PhotoDetailScreen
        photos={photosToShow}
        initialIndex={detailIndex}
        onClose={() => setDetailIndex(null)}
        onAddComment={(entryId, text) => addComment(entryId, text)}
        onDelete={(entryId) => deletePhoto(entryId)}
        onSave={(entry) => saveEntryToGallery(entry)}
        onShare={(entry) => shareEntry(entry)}
      />
    );
  }

  // ── Synchronisation en cours ─────────────────────────────────────────────────

  if (syncStatus === 'negotiating' || syncStatus === 'transferring') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.syncTitle}>Synchronisation en cours…</Text>
        <Text style={styles.syncSub}>Gardez l'app au premier plan.</Text>
      </View>
    );
  }

  // ── Dashboard principal ──────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* ── Header ── */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Text style={styles.eventName} numberOfLines={1}>{eventName}</Text>
          <Text style={styles.eventMeta}>
            {photosToShow.length} photo{photosToShow.length > 1 ? 's' : ''} · {eventData.participants.length} participant{eventData.participants.length > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Toggle Album / Feed */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'album' && styles.toggleActive]}
            onPress={() => setViewMode('album')}
          >
            <Text style={[styles.toggleText, viewMode === 'album' && styles.toggleTextActive]}>
              ⊞ Album
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'feed' && styles.toggleActive]}
            onPress={() => setViewMode('feed')}
          >
            <Text style={[styles.toggleText, viewMode === 'feed' && styles.toggleTextActive]}>
              ☰ Feed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Contenu ── */}
      <View style={styles.content}>
        {viewMode === 'album' ? (
          <AlbumGrid
            photos={photosToShow}
            onCapture={() => setCaptureState('camera')}
            onOpenPhoto={(index) => setDetailIndex(index)}
          />
        ) : (
          <FlatList
            data={photosToShow}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.syncSub}>Aucune photo pour l'instant.</Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <FeedPost
                entry={item}
                onAddComment={(entryId, text) => addComment(entryId, text)}
                onOpenPhoto={() => setDetailIndex(index)}
              />
            )}
          />
        )}
      </View>

      {/* ── Barre inférieure ── */}
      <View style={styles.bottomBar}>
        {/* QR Code compact */}
        {sharePayload && syncStatus !== 'complete' && (
          <TouchableOpacity
            style={styles.qrCompact}
            onPress={() =>
              Alert.alert(
                'QR de session',
                `ID : ${sessionId}\nPartagez ce QR pour que vos invités rejoignent l'événement.`,
              )
            }
          >
            <QRCode value={sharePayload} size={44} backgroundColor="white" />
          </TouchableOpacity>
        )}

        {/* Bouton capture */}
        <TouchableOpacity style={styles.captureBtn} onPress={() => setCaptureState('camera')}>
          <Text style={styles.captureBtnText}>📷</Text>
        </TouchableOpacity>

        {/* Bouton sync */}
        {syncStatus === 'advertising' && (
          <TouchableOpacity style={styles.syncBtn} onPress={triggerSynchronization}>
            <Text style={styles.syncBtnText}>Révéler l'album</Text>
          </TouchableOpacity>
        )}
        {syncStatus === 'complete' && (
          <View style={styles.syncDone}>
            <Text style={styles.syncDoneText}>✓ Album synchronisé</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },

  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerLeft: { flex: 1, marginRight: 12 },
  eventName: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  eventMeta: { fontSize: 12, color: '#AAA', marginTop: 2 },

  // Toggle
  toggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  toggleActive: { backgroundColor: 'white' },
  toggleText: { fontSize: 12, color: '#AAA', fontWeight: '600' },
  toggleTextActive: { color: COLORS.primary },

  // Contenu
  content: { flex: 1 },

  // Center
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  syncTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  syncSub: { fontSize: 14, color: '#AAA', marginTop: 8, textAlign: 'center' },

  // Barre inférieure
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    gap: 12,
  },
  qrCompact: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 2,
  },
  captureBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  captureBtnText: { fontSize: 24 },
  syncBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  syncBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  syncDone: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  syncDoneText: { color: '#2E7D32', fontWeight: '700', fontSize: 15 },
});
