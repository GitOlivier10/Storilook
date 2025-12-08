// Fichier: app/(tabs)/index.tsx

import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// L'importation de QRCode a été retirée de la logique par défaut
import StorilookFeed from '../../components/StorilookFeed';
import { useStorilookP2P } from '../../hooks/useStorilookP2P';

// --- Constantes de l'Identité Storilook ---
const COLORS = {
  primary: '#FF1493',      
  secondary: '#FF6347',    
  background: '#FAFAFA',   
  warning: '#721c24',      
  warningBg: '#f8d7da',    
  text: '#333',
};


// --- Composant Création d'Événement (Formulaire) ---
interface CreateFormProps {
    eventName: string;
    setEventName: (v: string) => void;
    handleCreateEvent: () => void;
    isLaunched: boolean;
}

const CreateForm: React.FC<CreateFormProps> = ({ eventName, setEventName, handleCreateEvent, isLaunched }) => (
    <>
        <Text style={styles.label}>Nom de l'événement</Text>
        <TextInput
            style={styles.input}
            onChangeText={setEventName}
            value={eventName}
            placeholder="Ex: Soirée Amicia"
            editable={!isLaunched}
        />
        <TouchableOpacity style={styles.button} onPress={handleCreateEvent}>
            <Text style={styles.buttonText}>Créer un Album Storilook Privé</Text>
        </TouchableOpacity>
    </>
);


// --- Composant Principal du Tab Index ---
export default function IndexScreen() {
    const [eventName, setEventName] = useState('');
    const { eventData, startEvent } = useStorilookP2P();
    
    // Si le syncStatus n'est pas 'idle', l'événement est considéré comme actif
    const isEventActive = eventData.syncStatus !== 'idle'; 

    const handleCreateEvent = () => {
        if (!eventName) {
            Alert.alert("Erreur", "Veuillez donner un nom à votre événement Storilook.");
            return;
        }
        startEvent(eventName);
    };

    // --- LOGIQUE CONDITIONNELLE CLÉ : Affiche le Feed si l'événement est actif ---
    if (isEventActive) {
        return <StorilookFeed />;
    }

    // Sinon, on affiche l'écran de création (Accueil par défaut)
    return (
        <View style={styles.container}>
            <View style={styles.contentBox}>
                <Text style={styles.title}>Storilook</Text>
                <Text style={styles.slogan}>Racontez votre histoire</Text>

                {/* Bloc d'Avertissement Hotspot */}
                <View style={styles.hotspotInfo}>
                    <Text style={styles.hotspotText}>
                        ⚠️ **Préparation :** Activez le **Partage de Connexion Wi-Fi** de votre téléphone avant de commencer.
                    </Text>
                </View>
                
                <CreateForm 
                    eventName={eventName} 
                    setEventName={setEventName} 
                    handleCreateEvent={handleCreateEvent} 
                    isLaunched={isEventActive} 
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        paddingTop: 40,
    },
    contentBox: {
        width: '90%',
        maxWidth: 400,
        backgroundColor: 'white',
        padding: 30,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        alignItems: 'center',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 5,
    },
    slogan: {
        color: '#6c757d',
        marginBottom: 25,
        fontStyle: 'italic',
        fontSize: 15,
    },
    hotspotInfo: {
        backgroundColor: COLORS.warningBg,
        borderColor: COLORS.warning,
        borderWidth: 1,
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        width: '100%',
    },
    hotspotText: {
        fontSize: 13,
        color: COLORS.warning,
        lineHeight: 18,
    },
    label: {
        alignSelf: 'flex-start',
        marginBottom: 5,
        fontWeight: '600',
        fontSize: 16,
        color: COLORS.text,
    },
    input: {
        width: '100%',
        padding: 12,
        borderWidth: 2,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 25,
        fontSize: 16,
    },
    button: {
        backgroundColor: COLORS.secondary,
        padding: 14,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Les styles de QR code sont conservés au cas où vous souhaiteriez les réutiliser
    qrCodeContainer: { 
        width: '100%',
        padding: 20,
        backgroundColor: '#FFC300', 
        borderRadius: 10,
        alignItems: 'center',
    },
    qrTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 5,
    },
    qrSubTitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 15,
        color: COLORS.text,
    },
    qrCodeWrapper: {
        backgroundColor: 'white',
        padding: 5,
        borderRadius: 5,
        borderWidth: 3,
        borderColor: COLORS.text,
    },
    sessionIdText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 15,
        color: COLORS.text,
    }, 
    statusText: { // Bloc où l'erreur de syntaxe se produisait
        fontSize: 13,
        color: '#555',
        marginTop: 10 
    },
});