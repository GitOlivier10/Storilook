import { Ionicons } from '@expo/vector-icons';
import * as ExpoCamera from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStorilookP2P } from '../hooks/useStorilookP2P';

const { width } = Dimensions.get('window');

// --- Constantes Storilook ---
const COLORS = {
  primary: '#FF1493',      
  secondary: '#FF6347',    
  text: '#333',
};

// Interface Props pour la navigation (quitter l'écran de capture)
interface CaptureProps {
    onClose: () => void;
}

export default function CaptureScreen({ onClose }: CaptureProps) {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const cameraRef = useRef<any>(null);
    const CameraAny: any = (ExpoCamera as any).Camera || (ExpoCamera as any);
    const { addLocalPhoto } = useStorilookP2P();

    // Demande des permissions de la caméra au chargement
    useEffect(() => {
        (async () => {
            const { status } = await (ExpoCamera as any).requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                // 1. Simulation de la prise de photo
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 1, // Haute qualité pour Storilook
                    base64: false,
                    exif: true, // Pour conserver les métadonnées de temps
                });

                // 2. Préparation des données du Manifeste
                const photoData = {
                    uri: photo.uri,
                    timestamp: new Date().toISOString(),
                    // L'utilisateur sera redirigé vers l'écran d'annotation après cette étape
                };

                // 3. Appel de la logique du Hook (Stockage Local)
                await addLocalPhoto(photoData);
                
                Alert.alert("Photo Capturée", "Enregistrée dans le manifeste local.");

                // 4. Fermeture et retour à l'écran précédent
                onClose();

            } catch (error) {
                console.error("Erreur de capture:", error);
                Alert.alert("Erreur", "Impossible de prendre la photo.");
            }
        }
    };

    if (hasPermission === null) {
        return <View style={styles.permissionContainer} />;
    }
    if (hasPermission === false) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>L'accès à la caméra est refusé pour Storilook.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraAny 
                style={styles.camera} 
                type={'back' as any}
                ref={cameraRef}
            >
                {/* Bouton pour fermer la caméra */}
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Ionicons name="close" size={30} color="white" />
                </TouchableOpacity>

                {/* Bouton de Capture (Grand Cercle) */}
                <View style={styles.captureControls}>
                    <TouchableOpacity style={styles.captureButtonOuter} onPress={takePicture}>
                        <View style={styles.captureButtonInner} />
                    </TouchableOpacity>
                </View>
            </CameraAny>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#333',
    },
    permissionText: {
        color: 'white',
        fontSize: 18,
    },
    camera: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 5,
    },
    captureControls: {
        width: '100%',
        paddingBottom: 40,
        alignItems: 'center',
    },
    captureButtonOuter: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 5,
        borderColor: COLORS.secondary, // Orange vif pour le bouton
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.secondary,
    },
});