import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

// --- Constantes de l'Identité Storilook ---
const COLORS = {
  primary: '#FF1493',      // Magenta
  secondary: '#FF6347',    // Orange vif (Bouton Premium)
  background: '#FAFAFA',   
  text: '#333',
  lightGray: '#f0f0f0',
  premiumGold: '#FFD700',  // Or pour le Premium
};

// --- Données Simulant l'état de l'utilisateur ---
const MOCK_USER_DATA = {
    currentEvent: 'Anniversaire Amicia',
    isPremium: false,
};

// Fonctionnalités débloquées par le Premium
const PREMIUM_BENEFITS = [
    "✅ Gérer et participer à plusieurs événements en même temps.",
    "✅ Archiver un nombre illimité de photos (plus de 100).",
    "✅ Supprimer les limites de 10 participants.",
    "✅ Accès illimité aux Albums Passés.",
];

// --- Composant Principal ---
export default function OtherEventsScreen() {
    
    const handleUpgradePress = () => {
        Alert.alert(
            "Passez à Storilook Premium",
            "Débloquez la gestion multi-événementielle et l'archivage permanent ! (Simulé)",
            [{ text: "Voir les Offres", style: 'default' }]
        );
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Vos autres histoires</Text>

            {/* Affiche le seul événement ACTIF */}
            <View style={styles.activeEventCard}>
                <Ionicons name="flash-outline" size={24} color={COLORS.primary} style={{ marginRight: 10 }} />
                <Text style={styles.activeEventText}>Album en cours : <Text style={{fontWeight: 'bold'}}>{MOCK_USER_DATA.currentEvent}</Text></Text>
            </View>

            {/* --- CARTE PAYWALL PREMIUM --- */}
            

        </ScrollView>
    );
}

// --- Styles ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        padding: 20,
    },
    activeEventCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 15,
        marginHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
        marginBottom: 25,
    },
    activeEventText: {
        fontSize: 16,
        color: COLORS.text,
    },
    
    // Style pour le Paywall
    paywallCard: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        padding: 25,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.premiumGold,
    },
    paywallTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 10,
        textAlign: 'center',
    },
    paywallSubText: {
        fontSize: 15,
        color: '#6c757d',
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 20,
    },
    benefitsList: {
        alignSelf: 'flex-start',
        width: '100%',
        marginBottom: 30,
    },
    benefitItem: {
        fontSize: 15,
        color: COLORS.text,
        paddingVertical: 4,
    },
    upgradeButton: {
        backgroundColor: COLORS.secondary,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 8,
        width: '100%',
    },
    upgradeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 17,
        textAlign: 'center',
    },
    smallPrint: {
        fontSize: 12,
        color: '#999',
        marginTop: 15,
        textAlign: 'center',
    }
});