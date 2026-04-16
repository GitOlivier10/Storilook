import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStorilookP2P } from '../hooks/useStorilookP2P';

const COLORS = {
  primary: '#FF1493',
  secondary: '#FF6347',
  background: '#FAFAFA',
  text: '#333',
  lightGray: '#EAEAEA',
  gold: '#FFD700',
};

const PREMIUM_BENEFITS = [
  'Gérer plusieurs événements en parallèle',
  'Photos illimitées par événement',
  'Participants illimités',
  'Albums archivés en accès permanent',
];

export default function OtherEventsScreen() {
  const { eventData } = useStorilookP2P();
  const hasActiveEvent = eventData.syncStatus !== 'idle';

  const handleUpgrade = () => {
    Alert.alert(
      'Storilook Premium',
      'La version Premium sera disponible prochainement. Elle débloquera la gestion multi-événements.',
      [{ text: 'OK' }],
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Mes événements</Text>

      {/* ── Événement en cours ── */}
      <Text style={styles.sectionTitle}>En cours</Text>
      {hasActiveEvent ? (
        <View style={styles.activeCard}>
          <View style={styles.activeCardLeft}>
            <Ionicons name="flash" size={22} color={COLORS.primary} />
            <View>
              <Text style={styles.activeCardName} numberOfLines={1}>
                {eventData.eventName}
              </Text>
              <Text style={styles.activeCardMeta}>
                {eventData.myPhotos.length} photo{eventData.myPhotos.length > 1 ? 's' : ''} · {eventData.participants.length} participant{eventData.participants.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Actif</Text>
          </View>
        </View>
      ) : (
        <View style={styles.noEventCard}>
          <Ionicons name="calendar-outline" size={32} color="#CCC" />
          <Text style={styles.noEventText}>Aucun événement en cours</Text>
          <Text style={styles.noEventSub}>Créez-en un depuis l'onglet "En cours".</Text>
        </View>
      )}

      {/* ── Paywall multi-événements ── */}
      <Text style={styles.sectionTitle}>Autres événements</Text>
      <View style={styles.paywallCard}>
        <Ionicons name="lock-closed" size={32} color={COLORS.gold} />
        <Text style={styles.paywallTitle}>Fonctionnalité Premium</Text>
        <Text style={styles.paywallSub}>
          Participez à plusieurs événements simultanément avec Storilook Premium.
        </Text>
        <View style={styles.benefitsList}>
          {PREMIUM_BENEFITS.map((benefit, i) => (
            <View key={i} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
          <Text style={styles.upgradeBtnText}>Découvrir Premium</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 60 },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#AAA',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 10,
  },
  activeCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  activeCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  activeCardName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  activeCardMeta: { fontSize: 13, color: '#AAA', marginTop: 2 },
  activeBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeBadgeText: { fontSize: 12, color: '#2E7D32', fontWeight: '700' },
  noEventCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  noEventText: { fontSize: 16, fontWeight: '600', color: '#CCC' },
  noEventSub: { fontSize: 13, color: '#CCC', textAlign: 'center' },
  paywallCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    gap: 12,
  },
  paywallTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  paywallSub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
  benefitsList: { width: '100%', gap: 8 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitText: { fontSize: 14, color: COLORS.text, flex: 1 },
  upgradeBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  upgradeBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
