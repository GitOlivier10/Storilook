import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- Constantes de l'Identité Storilook ---
const COLORS = {
  primary: '#FF1493',      // Magenta (pour les accents)
  secondary: '#FF6347',    // Orange vif (pour les boutons d'action)
  background: '#FAFAFA',   // Fond blanc cassé
  text: '#333',
  lightGray: '#f0f0f0',
  red: '#dc3545',          // Rouge pour la déconnexion
};

// Données de l'utilisateur simulées
const MOCK_USER = {
    name: "Bruce",
    email: "bruce@storilook.com",
    isPremium: false, // CLÉ DE LA MONÉTISATION
};

// Composant pour chaque ligne de paramètre
interface SettingItemProps {
    title: string;
    value?: React.ReactNode;
    onPress?: () => void;
    isDestructive?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({ title, value, onPress, isDestructive = false }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
        <Text style={[styles.itemTitle, isDestructive && styles.destructiveText]}>{title}</Text>
        {value && <Text style={styles.itemValue}>{value}</Text>}
    </TouchableOpacity>
);

// Composant principal de l'écran Paramètres
export default function SettingsScreen() {
    
    // Fonctionnalité de démonstration pour le clic Premium
    const handleUpgradePress = () => {
        Alert.alert(
            "Passer à Storilook Premium",
            "Débloquez les événements illimités, plus de 100 photos et l'archivage permanent ! (Simulé)",
            [{ text: "OK", style: 'cancel' }]
        );
        // Dans l'app réelle, cela mènerait à l'écran d'achat in-app (App Store/Google Play)
    };

    const handleLogout = () => {
        Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
            { text: "Annuler", style: 'cancel' },
            { text: "Déconnexion", onPress: () => console.log("Déconnexion effectuée"), style: 'destructive' },
        ]);
    };
    
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Réglages</Text>

            {/* --- SECTION PREMIUM (MONÉTISATION) --- */}
            

            {/* --- SECTION COMPTE --- */}
            <Text style={styles.sectionTitle}>Compte</Text>
            <View style={styles.section}>
                <SettingItem title="Nom d'utilisateur" value={MOCK_USER.name} onPress={() => {}} />
                <SettingItem title="E-mail" value={MOCK_USER.email} onPress={() => {}} />
                <SettingItem title="Statut" value={MOCK_USER.isPremium ? "Premium" : "Free (limité)"} onPress={handleUpgradePress} />
            </View>

            {/* --- SECTION APPLICATION & CONFIDENTIALITÉ --- */}
            <Text style={styles.sectionTitle}>Application & Confidentialité</Text>
            <View style={styles.section}>
                <SettingItem 
                    title="Nettoyer les données synchronisées" 
                    value="150 Mo" 
                    onPress={() => Alert.alert("Nettoyage", "Fonctionnalité en cours de développement.")} 
                />
                <SettingItem 
                    title="Gérer l'espace de stockage local" 
                    value="Utilisation actuelle" 
                    onPress={() => {}} 
                />
                <SettingItem 
                    title="Politique de confidentialité" 
                    onPress={() => console.log("Ouvrir la politique de confidentialité")} 
                />
            </View>
            
            {/* --- SECTION AIDE ET À PROPOS --- */}
            <Text style={styles.sectionTitle}>Aide & À Propos</Text>
            <View style={styles.section}>
                <SettingItem title="Version de l'application" value="V1.0.0" onPress={() => {}} />
                <SettingItem title="Contacter le support" onPress={() => {}} />
            </View>

            {/* --- BOUTON DÉCONNEXION --- */}
            <View style={styles.logoutContainer}>
                <SettingItem 
                    title="Déconnexion" 
                    onPress={handleLogout} 
                    isDestructive={true} 
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        padding: 20,
        paddingBottom: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 20,
        textTransform: 'uppercase',
    },
    section: {
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#ddd',
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderColor: COLORS.lightGray,
    },
    itemTitle: {
        fontSize: 16,
        color: COLORS.text,
    },
    itemValue: {
        fontSize: 16,
        color: '#999',
    },
    destructiveText: {
        color: COLORS.red,
    },
    
    // Style pour la carte PREMIUM
    premiumCard: {
        backgroundColor: COLORS.primary,
        margin: 20,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    premiumTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10,
        textAlign: 'center',
    },
    premiumText: {
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
    },
    upgradeButton: {
        backgroundColor: 'white',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    upgradeButtonText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    logoutContainer: {
        marginTop: 30,
        marginBottom: 50,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#ddd',
    }
});