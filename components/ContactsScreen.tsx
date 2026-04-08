import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStorilookP2P } from '../hooks/useStorilookP2P';

const COLORS = {
  primary: '#FF1493',
  secondary: '#FF6347',
  background: '#FAFAFA',
  text: '#333',
  lightGray: '#EAEAEA',
  green: '#28a745',
};

interface ParticipantItemProps {
  name: string;
  isMe: boolean;
}

const ParticipantItem: React.FC<ParticipantItemProps> = ({ name, isMe }) => (
  <View style={styles.item}>
    <View style={[styles.avatar, isMe && styles.avatarMe]}>
      <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
    </View>
    <View style={styles.itemBody}>
      <Text style={styles.itemName}>{name}{isMe ? ' (vous)' : ''}</Text>
      <Text style={styles.itemSub}>Participant à cet événement</Text>
    </View>
    <View style={styles.badge}>
      <Ionicons name="wifi" size={12} color={COLORS.green} />
      <Text style={styles.badgeText}>Local</Text>
    </View>
  </View>
);

export default function ContactsScreen() {
  const { eventData } = useStorilookP2P();
  const hasActiveEvent = eventData.syncStatus !== 'idle';
  const participants = eventData.participants;

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Participants</Text>
        {hasActiveEvent && (
          <Text style={styles.headerEvent} numberOfLines={1}>
            {eventData.eventName}
          </Text>
        )}
      </View>

      {!hasActiveEvent ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={64} color={COLORS.lightGray} />
          <Text style={styles.emptyTitle}>Aucun événement actif</Text>
          <Text style={styles.emptySub}>
            Les participants apparaissent ici une fois que vous avez rejoint ou créé un événement.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            {participants.map((name, index) => (
              <ParticipantItem key={index} name={name} isMe={index === 0} />
            ))}
          </View>

          {/* Bloc info P2P */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color="#AAA" />
            <Text style={styles.infoText}>
              La détection automatique des participants à proximité sera disponible lorsque la synchronisation P2P sera activée.
            </Text>
          </View>

          {/* CTA inviter via QR */}
          <View style={styles.inviteBox}>
            <Ionicons name="qr-code-outline" size={28} color={COLORS.primary} />
            <View style={styles.inviteContent}>
              <Text style={styles.inviteTitle}>Inviter des participants</Text>
              <Text style={styles.inviteSub}>
                Partagez le QR code affiché dans l'onglet "En cours" pour que vos invités rejoignent l'événement.
              </Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  headerEvent: { fontSize: 13, color: COLORS.primary, marginTop: 2, fontWeight: '600' },
  empty: {
    alignItems: 'center',
    padding: 48,
    gap: 12,
    marginTop: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#CCC' },
  emptySub: { fontSize: 14, color: '#CCC', textAlign: 'center', lineHeight: 20 },
  section: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.lightGray,
    marginTop: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    gap: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMe: { backgroundColor: '#FFF0F8', borderWidth: 2, borderColor: COLORS.primary },
  avatarText: { color: COLORS.primary, fontWeight: '700', fontSize: 18 },
  itemBody: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  itemSub: { fontSize: 12, color: '#AAA', marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, color: COLORS.green, fontWeight: '600' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 14,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  infoText: { flex: 1, fontSize: 13, color: '#AAA', lineHeight: 18 },
  inviteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    backgroundColor: '#FFF0F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD6EC',
  },
  inviteContent: { flex: 1 },
  inviteTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  inviteSub: { fontSize: 13, color: '#888', marginTop: 4, lineHeight: 18 },
});
