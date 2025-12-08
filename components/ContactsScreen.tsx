import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// --- Constantes de l'Identité Storilook ---
const COLORS = {
  primary: '#FF1493',      // Magenta (pour les accents)
  secondary: '#FF6347',    // Orange vif (pour l'action/invitation)
  background: '#FAFAFA',   // Fond blanc cassé
  text: '#333',
  lightGray: '#f0f0f0',
  onlineGreen: '#28a745',  // Vert pour le statut "Connecté / Proche"
};

// --- Structure de Données Simulant les Contacts ---
interface ContactData {
    id: string;
    name: string;
    lastEvent: string;
    isNearby: boolean; // Simule la détection P2P
}

const MOCK_CONTACTS: ContactData[] = [
    { id: 'c1', name: 'Amicia', lastEvent: 'Anniversaire Bruce', isNearby: true },
    { id: 'c2', name: 'Olivier M.', lastEvent: 'Week-end Ski', isNearby: false },
    { id: 'c3', name: 'Gérard V.', lastEvent: 'Table Ronde', isNearby: false },
    { id: 'c4', name: 'Éliott V.', lastEvent: 'Projet EPFL', isNearby: true },
];

// --- Composant pour une Ligne de Contact ---
const ContactItem = ({ contact }: { contact: ContactData }) => (
    <View style={styles.contactItem}>
        
        {/* Icône/Avatar */}
        <View style={[styles.avatar, contact.isNearby && styles.avatarNearby]}>
            <Text style={styles.avatarText}>{contact.name.charAt(0)}</Text>
        </View>

        {/* Détails */}
        <View style={styles.contactDetails}>
            <Text style={styles.contactName}>{contact.name}</Text>
            <Text style={styles.contactLastEvent}>
                {contact.lastEvent}
            </Text>
        </View>

        {/* Statut P2P */}
        <View style={styles.contactStatus}>
            {contact.isNearby ? (
                <Text style={styles.statusNearby}>✅ Proche</Text>
            ) : (
                <Text style={styles.statusOffline}>Distant</Text>
            )}
        </View>
    </View>
);

// --- Composant Principal de l'écran Contacts ---
export default function ContactsScreen() {

    const handleInvite = () => {
        Alert.alert("Inviter un ami", "Fonctionnalité d'invitation par lien ou QR code en cours de développement (pour V2).");
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Mes Contacts Storilook</Text>

            {/* Barre de Recherche et d'Invitation */}
            <View style={styles.searchBar}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher un contact..."
                    placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.inviteButton} onPress={handleInvite}>
                    <Ionicons name="person-add-outline" size={20} color="white" />
                </TouchableOpacity>
            </View>
            
            <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Amis ({MOCK_CONTACTS.length})</Text>
                <Text style={styles.sectionTitleHint}>Le statut "Proche" est mis à jour en local.</Text>
            </View>

            {/* Liste des Contacts */}
            <View style={styles.contactList}>
                {MOCK_CONTACTS.map(contact => (
                    <ContactItem key={contact.id} contact={contact} />
                ))}
            </View>

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
    
    // Barres de recherche et d'invitation
    searchBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        padding: 12,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        fontSize: 16,
        marginRight: 10,
    },
    inviteButton: {
        backgroundColor: COLORS.secondary,
        width: 44,
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Liste et Items
    sectionTitleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    sectionTitleHint: {
        fontSize: 12,
        color: '#999',
    },
    contactList: {
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderColor: '#ddd',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderColor: COLORS.lightGray,
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: COLORS.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarNearby: {
        borderWidth: 2,
        borderColor: COLORS.onlineGreen,
    },
    avatarText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 18,
    },
    contactDetails: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    contactLastEvent: {
        fontSize: 13,
        color: '#999',
    },
    contactStatus: {
        padding: 5,
        borderRadius: 5,
    },
    statusNearby: {
        color: COLORS.onlineGreen,
        fontWeight: 'bold',
        fontSize: 13,
    },
    statusOffline: {
        color: '#999',
        fontSize: 13,
    },
});