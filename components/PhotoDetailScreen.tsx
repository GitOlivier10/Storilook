import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { FeedComment, ManifestEntry } from '../services/manifestUtils';

const COLORS = {
  primary: '#FF1493',
  text: '#333',
  lightGray: '#EAEAEA',
  red: '#dc3545',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PhotoDetailScreenProps {
  photos: ManifestEntry[];
  initialIndex: number;
  onClose: () => void;
  onAddComment: (entryId: string, text: string) => void;
  onDelete: (entryId: string) => void;
  onShare?: (entry: ManifestEntry) => void;
  onSave?: (entry: ManifestEntry) => void;
}

export default function PhotoDetailScreen({
  photos,
  initialIndex,
  onClose,
  onAddComment,
  onDelete,
  onShare,
  onSave,
}: PhotoDetailScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<ManifestEntry>>(null);

  const currentPhoto = photos[currentIndex];

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const handleSubmit = () => {
    const trimmed = draft.trim();
    if (!trimmed || !currentPhoto) return;
    onAddComment(currentPhoto.id, trimmed);
    setDraft('');
  };

  const handleDelete = () => {
    if (!currentPhoto) return;
    Alert.alert(
      'Supprimer la photo ?',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            onDelete(currentPhoto.id);
            if (photos.length <= 1) onClose();
          },
        },
      ],
    );
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `il y a ${hrs} h`;
    return new Date(iso).toLocaleDateString('fr-FR');
  };

  if (!currentPhoto) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Aucune photo à afficher</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {currentIndex + 1} / {photos.length}
          </Text>
          <View style={styles.headerActions}>
            {onSave && (
              <TouchableOpacity onPress={() => onSave(currentPhoto)} style={styles.iconBtn}>
                <Ionicons name="download-outline" size={24} color="white" />
              </TouchableOpacity>
            )}
            {onShare && (
              <TouchableOpacity onPress={() => onShare(currentPhoto)} style={styles.iconBtn}>
                <Ionicons name="share-outline" size={24} color="white" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Carrousel photos */}
        <FlatList
          ref={listRef}
          data={photos}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item }) => (
            <View style={styles.photoContainer}>
              <Image source={{ uri: item.fileUri }} style={styles.photo} resizeMode="contain" />
            </View>
          )}
        />

        {/* Panneau infos + commentaires */}
        <View style={styles.panel}>
          <ScrollView style={styles.panelScroll} contentContainerStyle={styles.panelContent}>
            <Text style={styles.photoTime}>{formatTime(currentPhoto.captureTimestamp)}</Text>

            {currentPhoto.comment ? (
              <Text style={styles.caption}>{currentPhoto.comment}</Text>
            ) : null}

            {currentPhoto.tags && currentPhoto.tags.length > 0 && (
              <Text style={styles.tags}>
                {currentPhoto.tags.map((t) => `#${t}`).join(' ')}
              </Text>
            )}

            {(currentPhoto.feedComments ?? []).map((c: FeedComment) => (
              <View key={c.id} style={styles.commentRow}>
                <Text style={styles.commentAuthor}>{c.authorName}</Text>
                <Text style={styles.commentText}> {c.text}</Text>
              </View>
            ))}

            {(currentPhoto.feedComments?.length ?? 0) === 0 && !currentPhoto.comment && (
              <Text style={styles.noComment}>Aucun commentaire. Soyez le premier !</Text>
            )}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Ajouter un commentaire…"
              placeholderTextColor="#999"
              value={draft}
              onChangeText={setDraft}
              returnKeyType="send"
              onSubmitEditing={handleSubmit}
              blurOnSubmit={false}
            />
            {draft.trim().length > 0 && (
              <TouchableOpacity onPress={handleSubmit}>
                <Text style={styles.sendBtn}>Publier</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black' },
  safe: { flex: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
  emptyText: { color: 'white', fontSize: 16 },
  closeBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.primary, borderRadius: 8 },
  closeBtnText: { color: 'white', fontWeight: '700' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconBtn: { padding: 6 },
  headerTitle: { color: 'white', fontSize: 15, fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 4 },

  photoContainer: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.1 },

  panel: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: 280,
  },
  panelScroll: { maxHeight: 220 },
  panelContent: { padding: 16 },
  photoTime: { fontSize: 12, color: '#AAA', marginBottom: 8 },
  caption: { fontSize: 15, color: COLORS.text, lineHeight: 21, marginBottom: 6 },
  tags: { fontSize: 14, color: COLORS.primary, marginBottom: 8 },
  commentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 3,
  },
  commentAuthor: { fontWeight: '700', fontSize: 13, color: COLORS.text },
  commentText: { fontSize: 13, color: COLORS.text, flex: 1 },
  noComment: { fontSize: 13, color: '#BBB', fontStyle: 'italic' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 0,
  },
  sendBtn: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
});
