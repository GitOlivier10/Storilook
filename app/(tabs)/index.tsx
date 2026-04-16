import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import StorilookFeed from '../../components/StorilookFeed';
import QRScannerScreen from '../../components/QRScannerScreen';
import { useStorilookP2P } from '../../hooks/useStorilookP2P';
import { SessionSharePayload } from '../../services/sessionShare';

const COLORS = {
  primary: '#FF1493',
  secondary: '#FF6347',
  background: '#FAFAFA',
  text: '#333',
  lightGray: '#EAEAEA',
  border: '#DDD',
};

type HomeState = 'home' | 'create' | 'join';

export default function IndexScreen() {
  const [homeState, setHomeState] = useState<HomeState>('home');
  const [eventName, setEventName] = useState('');
  const { eventData, startEvent, joinEvent } = useStorilookP2P();

  const isEventActive = eventData.syncStatus !== 'idle';

  if (isEventActive) {
    return <StorilookFeed />;
  }

  if (homeState === 'join') {
    return (
      <QRScannerScreen
        onJoin={(payload: SessionSharePayload) => {
          setHomeState('home');
          joinEvent(payload);
        }}
        onCancel={() => setHomeState('home')}
      />
    );
  }

  if (homeState === 'create') {
    return (
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.logo}>Storilook</Text>
          <Text style={styles.cardTitle}>Nouvel événement</Text>

          <Text style={styles.label}>Nom de l'événement</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex : Séminaire Mars, Mariage Julie…"
            placeholderTextColor="#AAA"
            value={eventName}
            onChangeText={setEventName}
            autoFocus
            returnKeyType="done"
          />

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={async () => {
              if (!eventName.trim()) return;
              await startEvent(eventName.trim());
            }}
          >
            <Text style={styles.btnText}>Créer →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnLink} onPress={() => setHomeState('home')}>
            <Text style={styles.btnLinkText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Écran d'accueil
  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.logo}>Storilook</Text>
        <Text style={styles.slogan}>Le partage d'événement, sans le cloud.</Text>
      </View>

      <View style={styles.card}>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => setHomeState('create')}
        >
          <Text style={styles.btnText}>📸  Créer un événement</Text>
        </TouchableOpacity>

        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>ou</Text>
          <View style={styles.separatorLine} />
        </View>

        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => setHomeState('join')}
        >
          <Text style={[styles.btnText, styles.btnTextDark]}>📷  Scanner un QR code</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Scannez le QR affiché par l'organisateur pour rejoindre un événement.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  slogan: {
    fontSize: 14,
    color: '#888',
    marginTop: 6,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
    backgroundColor: '#FAFAFA',
  },
  btn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
  },
  btnSecondary: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  btnText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  btnTextDark: {
    color: COLORS.text,
  },
  btnLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  btnLinkText: {
    color: '#888',
    fontSize: 15,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lightGray,
  },
  separatorText: {
    marginHorizontal: 12,
    color: '#AAA',
    fontSize: 13,
  },
  hint: {
    marginTop: 14,
    fontSize: 12,
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 18,
  },
});
