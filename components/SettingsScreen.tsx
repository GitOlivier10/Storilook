import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { clearAllData } from '../services/manifest';
import { getStorageInfo, loadUserProfile, saveUserProfile } from '../services/userProfile';

const COLORS = {
  primary: '#FF1493',
  secondary: '#FF6347',
  background: '#FAFAFA',
  text: '#333',
  lightGray: '#EAEAEA',
  red: '#dc3545',
};

interface SettingRowProps {
  title: string;
  value?: string;
  onPress?: () => void;
  isDestructive?: boolean;
  showChevron?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  title,
  value,
  onPress,
  isDestructive = false,
  showChevron = false,
}) => (
  <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
    <Text style={[styles.rowTitle, isDestructive && styles.rowDestructive]}>{title}</Text>
    <View style={styles.rowRight}>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {showChevron && <Ionicons name="chevron-forward" size={16} color="#CCC" />}
    </View>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const [userName, setUserName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [storageInfo, setStorageInfo] = useState<{ sessionCount: number; photoCount: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [profile, storage] = await Promise.all([loadUserProfile(), getStorageInfo()]);
      setUserName(profile.name);
      setNameDraft(profile.name);
      setStorageInfo(storage);
      setLoading(false);
    })();
  }, []);

  const handleSaveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    await saveUserProfile({ name: trimmed });
    setUserName(trimmed);
    setEditingName(false);
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Tout effacer ?',
      'Tous les événements, photos et commentaires seront supprimés définitivement. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout effacer',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              const info = await getStorageInfo();
              setStorageInfo(info);
              Alert.alert('Terminé', 'Toutes les données locales ont été effacées. Redémarrez l\'application pour recommencer.');
            } catch (error) {
              console.error('clearAllData', error);
              Alert.alert('Erreur', 'Impossible d\'effacer les données.');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Réglages</Text>

      {/* ── Profil ── */}
      <Text style={styles.sectionTitle}>Profil</Text>
      <View style={styles.section}>
        {editingName ? (
          <View style={styles.nameEditRow}>
            <TextInput
              style={styles.nameInput}
              value={nameDraft}
              onChangeText={setNameDraft}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
              placeholder="Votre prénom"
              placeholderTextColor="#BBB"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName}>
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SettingRow
            title="Prénom affiché"
            value={userName}
            onPress={() => {
              setNameDraft(userName);
              setEditingName(true);
            }}
            showChevron
          />
        )}
        <SettingRow title="Statut" value="Free" onPress={() =>
          Alert.alert(
            'Storilook Premium',
            'La version Premium sera disponible prochainement. Elle débloquera les événements multiples et l\'archivage illimité.',
            [{ text: 'OK' }],
          )
        } showChevron />
      </View>

      {/* ── Stockage ── */}
      <Text style={styles.sectionTitle}>Stockage local</Text>
      <View style={styles.section}>
        <SettingRow
          title="Événements stockés"
          value={storageInfo ? `${storageInfo.sessionCount}` : '—'}
        />
        <SettingRow
          title="Photos totales"
          value={storageInfo ? `${storageInfo.photoCount}` : '—'}
        />
        <SettingRow
          title="Effacer les données"
          onPress={handleClearAllData}
          isDestructive
          showChevron
        />
      </View>

      {/* ── À propos ── */}
      <Text style={styles.sectionTitle}>À propos</Text>
      <View style={styles.section}>
        <SettingRow title="Version" value="1.0.0" />
        <SettingRow
          title="Politique de confidentialité"
          onPress={() =>
            Alert.alert('Confidentialité', 'Storilook ne transmet aucune donnée à des serveurs externes. Toutes vos photos restent sur vos appareils.')
          }
          showChevron
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#AAA',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  section: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.lightGray,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  rowTitle: { fontSize: 16, color: COLORS.text },
  rowDestructive: { color: COLORS.red },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 15, color: '#AAA' },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
});
