import { Ionicons } from '@expo/vector-icons';
import * as ExpoCamera from 'expo-camera'; // Nécessite l'installation : npx expo install expo-camera
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- Constantes de l'Identité Storilook ---
const COLORS = {
  primary: '#FF1493',      // Magenta
  secondary: '#FF6347',    // Orange vif pour les boutons
  text: '#333',
};

// Props que ce composant recevra du Feed
interface CameraHandlerProps {
    onPhotoCaptured: (uri: string) => void; // Fonction pour passer à l'écran d'annotation
}

export default function CameraHandler({ onPhotoCaptured }: CameraHandlerProps) {
    
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const cameraRef = useRef<any>(null);
    const CameraAny: any = (ExpoCamera as any).Camera || (ExpoCamera as any);

    // --- 1. Gérer les Permissions de l'Appareil Photo ---
    useEffect(() => {
        (async () => {
            const cameraStatus = await (ExpoCamera as any).requestCameraPermissionsAsync();
            setHasPermission(cameraStatus.status === 'granted');
        })();
    }, []);

    // --- 2. Gérer la Capture ---
    const handleCapture = async () => {
        if (cameraRef.current && isCameraReady) {
            try {
                // Cette fonction simule l'appel natif pour prendre la photo
                const photo = await cameraRef.current.takePictureAsync({ 
                    quality: 1, // Qualité maximale pour Storilook
                    base64: false,
                    exif: true, // Pour garder le timestamp exact
                });
                
                // Si la capture est réussie, on appelle la fonction pour annoter
                onPhotoCaptured(photo.uri); 
            } catch (error) {
                console.error("Erreur de capture photo:", error);
                Alert.alert("Erreur Caméra", "Impossible de prendre la photo.");
            }
        }
    };


    // --- 3. Gestion des États UX (Affichage conditionnel) ---
    if (hasPermission === null) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.statusText}>Demande d'accès à la caméra...</Text>
            </View>
        );
    }
    if (hasPermission === false) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name={"camera-off" as any} size={60} color={COLORS.secondary} />
                <Text style={styles.statusText}>Accès refusé.</Text>
                <Text style={styles.tipText}>Veuillez autoriser l'accès à la caméra dans les réglages de votre téléphone pour Storilook.</Text>
            </View>
        );
    }

    // --- 4. Caméra Prête (Interface Principale) ---
    return (
        <View style={styles.container}>
            <CameraAny 
                style={styles.camera} 
                type={'back' as any}
                ref={cameraRef}
                onCameraReady={() => setIsCameraReady(true)}
            />
            
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
                    <Ionicons name="scan-circle" size={80} color="white" />
                </TouchableOpacity>
            </View>
            
            {!isCameraReady && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="white" />
                </View>
            )}
        </View>
    );
}

// --- Styles ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
        aspectRatio: 3 / 4, 
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 5,
        borderColor: 'white',
        shadowColor: 'black',
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
    },
    statusText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 10,
    },
    tipText: {
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
        marginTop: 10,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});