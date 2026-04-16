import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SessionSharePayload } from '../services/sessionShare';

const COLORS = {
  primary: '#FF1493',
  secondary: '#FF6347',
  text: '#333',
};

interface QRScannerScreenProps {
  onJoin: (payload: SessionSharePayload) => void;
  onCancel: () => void;
}

export default function QRScannerScreen({ onJoin, onCancel }: QRScannerScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScan = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    try {
      const payload = JSON.parse(data) as SessionSharePayload;
      if (payload.version === 1 && payload.sessionId && payload.eventName) {
        onJoin(payload);
      } else {
        Alert.alert('QR invalide', "Ce QR code n'est pas un événement Storilook.", [
          { text: 'Réessayer', onPress: () => setScanned(false) },
          { text: 'Annuler', onPress: onCancel },
        ]);
      }
    } catch {
      Alert.alert('QR invalide', 'Impossible de lire ce QR code.', [
        { text: 'Réessayer', onPress: () => setScanned(false) },
        { text: 'Annuler', onPress: onCancel },
      ]);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Storilook a besoin d'accéder à la caméra pour scanner le QR code.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Autoriser la caméra</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelLink} onPress={onCancel}>
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={handleBarcodeScan}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Overlay avec viseur */}
      <View style={styles.overlay}>
        <View style={styles.topDim} />
        <View style={styles.middleRow}>
          <View style={styles.sideDim} />
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.sideDim} />
        </View>
        <View style={styles.bottomDim}>
          <Text style={styles.instruction}>Pointez vers le QR code de l'organisateur</Text>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const VIEWFINDER_SIZE = 240;
const CORNER_SIZE = 24;
const CORNER_BORDER = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { ...StyleSheet.absoluteFillObject },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'white',
  },
  permText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  permBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  permBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelLink: { marginTop: 20 },
  cancelText: { color: '#888', fontSize: 15 },

  // Overlay
  overlay: { ...StyleSheet.absoluteFillObject },
  topDim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  middleRow: { flexDirection: 'row', height: VIEWFINDER_SIZE },
  sideDim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
  },
  bottomDim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  instruction: {
    color: 'white',
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  cancelBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },

  // Coins du viseur
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: 'white',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_BORDER, borderLeftWidth: CORNER_BORDER },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_BORDER, borderRightWidth: CORNER_BORDER },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_BORDER, borderLeftWidth: CORNER_BORDER },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_BORDER, borderRightWidth: CORNER_BORDER },
});
