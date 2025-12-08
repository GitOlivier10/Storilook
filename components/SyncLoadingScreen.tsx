import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

// --- Constantes de l'Identité Storilook ---
const COLORS = {
  primary: '#FF1493',      // Magenta
  secondary: '#FF6347',    // Orange vif
  background: '#FAFAFA',   
  text: '#333',
  lightGray: '#f0f0f0',
    onlineGreen: '#28a745',
};

// Les étapes du Protocole Storilook
const SYNC_STEPS = [
    { key: 'init', label: '1. Initialisation du Réseau Local...', icon: 'wifi-outline' },
    { key: 'negotiate', label: '2. Négociation : Échange des Manifestes Photos (PMH)', icon: 'swap-horizontal-outline' },
    { key: 'transfer', label: '3. Transfert des Fichiers Manquants (Via Hotspot)', icon: 'cloud-download-outline' },
    { key: 'validate', label: '4. Validation : Vérification de la Qualité (Checksums)', icon: 'shield-checkmark-outline' },
    { key: 'complete', label: '5. Synchronisation Terminée !', icon: 'checkmark-circle-outline' },
];

export default function SyncLoadingScreen({ onComplete }: { onComplete: () => void }) {
    
    // État local de la simulation
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const progressAnim = useState(new Animated.Value(0))[0];

    // Simuler le processus de synchronisation
    useEffect(() => {
        if (currentStep < SYNC_STEPS.length) {
            const timer = setTimeout(() => {
                // Progression de la barre
                Animated.timing(progressAnim, {
                    toValue: (currentStep + 1) / SYNC_STEPS.length,
                    duration: 1000,
                    useNativeDriver: false,
                }).start();
                
                // Passage à l'étape suivante
                setCurrentStep(prev => prev + 1);
            }, 1500); // 1.5s par étape de simulation
            return () => clearTimeout(timer);
        } else {
            // Une fois toutes les étapes terminées
            setTimeout(onComplete, 1000); // Déclenche la révélation de l'album
        }
    }, [currentStep]);

    return (
        <View style={styles.container}>
            <View style={styles.contentBox}>
                <Text style={styles.title}>Synchronisation Finale en Cours</Text>
                
                {/* Indicateur de Confiance */}
                <View style={styles.confidentialityBanner}>
                    <Ionicons name="lock-closed-outline" size={20} color="white" />
                    <Text style={styles.confidentialityText}>100% Privé. Aucune donnée sur le Cloud Storilook.</Text>
                </View>

                {/* Barre de Progression */}
                <View style={styles.progressBarContainer}>
                    <Animated.View 
                        style={[
                            styles.progressBar, 
                            { 
                                width: progressAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%'],
                                }),
                            }
                        ]} 
                    />
                </View>
                
                {/* Statut de l'Étape */}
                <View style={styles.stepsList}>
                    {SYNC_STEPS.map((step, index) => (
                        <View key={step.key} style={styles.stepItem}>
                            <Ionicons 
                                name={step.icon as any} 
                                size={18} 
                                color={index < currentStep ? COLORS.onlineGreen : (index === currentStep ? COLORS.secondary : '#999')} 
                            />
                            <Text 
                                style={[
                                    styles.stepLabel, 
                                    index === currentStep && styles.stepActive,
                                    index < currentStep && styles.stepDone,
                                ]}
                            >
                                {step.label}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Animation de Chargement */}
                {currentStep < SYNC_STEPS.length && (
                    <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 20 }} />
                )}

            </View>
        </View>
    );
}

// --- Styles ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentBox: {
        width: '85%',
        backgroundColor: 'white',
        padding: 30,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 20,
    },
    confidentialityBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        padding: 8,
        borderRadius: 8,
        marginBottom: 30,
    },
    confidentialityText: {
        color: 'white',
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '600',
    },
    progressBarContainer: {
        height: 10,
        width: '100%',
        backgroundColor: COLORS.lightGray,
        borderRadius: 5,
        marginBottom: 20,
    },
    progressBar: {
        height: '100%',
        backgroundColor: COLORS.secondary,
        borderRadius: 5,
    },
    stepsList: {
        width: '100%',
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    stepLabel: {
        marginLeft: 10,
        fontSize: 14,
        color: '#999',
    },
    stepActive: {
        color: COLORS.secondary,
        fontWeight: 'bold',
    },
    stepDone: {
        color: COLORS.onlineGreen,
    },
});