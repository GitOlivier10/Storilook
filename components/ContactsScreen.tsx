import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// --- Constantes de l'Identité Storilook ---
const COLORS = {
  primary: '#FF1493',      // Magenta (pour les accents)
  secondary: '#FF6347',    // Orange vif (pour l'action/invitation)
  background: '#FAFAFA',   // Fond blanc cassé
  text: '#333',
  lightGray: '#f0f0f0',
};

// --- Composant Principal de l'écran Contacts ---
export default function ContactsScreen() {
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Mes Contacts Storilook</Text>

            {/* Barre de Recherche (placeholder pour V2/V3) */}
            <View style={styles.searchBar}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher un contact..."
                    placeholderTextColor="#999"
                    editable={false}
                />
                <TouchableOpacity style={styles.inviteButton} disabled>
                    <Ionicons name="person-add-outline" size={20} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Détection locale</Text>
                <Text style={styles.sectionTitleHint}>Le carnet d'adresses sera alimenté par les pairs P2P sur place.</Text>
            </View>

            <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={32} color={COLORS.text} />
                <Text style={styles.emptyTitle}>Aucun pair détecté</Text>
                <Text style={styles.emptyText}>
                    Lancez un événement depuis l'onglet "En Cours" et demandez aux invités de scanner le QR pour apparaître ic
                    i.
                </Text>
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
    emptyState: {
        padding: 20,
        marginHorizontal: 20,
        marginTop: 10,
        backgroundColor: 'white',
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    emptyText: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
    },
});