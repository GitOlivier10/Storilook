import { Ionicons } from '@expo/vector-icons'; // Utilisé pour les icônes (à installer si non fait)
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- Constantes de l'Identité Storilook ---
const COLORS = {
  primary: '#FF1493',      // Magenta
  secondary: '#FF6347',    // Orange vif
  background: '#FAFAFA',   // Fond blanc cassé
  text: '#333',
  lightGray: '#f0f0f0',
  premiumGold: '#FFD700',  // Or pour le Premium
};

// --- Structure de Données Simulant les Anciens Albums ---
interface AlbumData {
    id: string;
    name: string;
    date: string;
    photos: number;
    participants: number;
    isArchived: boolean; // Vrai si plus de 7 jours (Archivé = Verrouillé en Free)
}

const MOCK_ALBUMS: AlbumData[] = [
    { id: 'a1', name: 'Anniversaire Bruce', date: '01 Déc 2025', photos: 95, participants: 8, isArchived: true },
    { id: 'a2', name: 'Weekend Ski', date: '04 Déc 2025', photos: 120, participants: 12, isArchived: true },
    { id: 'a3', name: 'Dernière Soirée', date: 'Hier (07 Déc 2025)', photos: 45, participants: 6, isArchived: false },
];

// --- Composant pour une Carte d'Album ---
const AlbumCard = ({ album }: { album: AlbumData }) => {
    
    const handlePress = () => {
        if (album.isArchived) {
            Alert.alert(
                "Album Archivé (Premium)",
                `L'album "${album.name}" a été archivé après 7 jours dans la version Free. Passez à Premium pour le revoir et débloquer l'archivage permanent !`,
                [{ text: "Passer à Premium", onPress: () => console.log("Vers écran Premium") }, { text: "Annuler", style: 'cancel' }]
            );
        } else {
            // Dans la vraie app, on naviguerait vers le Feed Storilook de cet album
            Alert.alert("Album Actif", `Ouverture de l'album "${album.name}"...`);
        }
    };

    return (
        <TouchableOpacity 
            style={[styles.albumCard, album.isArchived && styles.archivedCard]} 
            onPress={handlePress}
            activeOpacity={album.isArchived ? 0.8 : 0.6}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.albumName}>{album.name}</Text>
                {album.isArchived && (
                    <View style={styles.premiumBadge}>
                        <Ionicons name="lock-closed" size={14} color={COLORS.text} />
                        <Text style={styles.premiumText}>Archivé</Text>
                    </View>
                )}
                {!album.isArchived && (
                    <Text style={styles.activeTag}>Actif</Text>
                )}
            </View>

            <View style={styles.cardDetails}>
                <Text style={styles.detailText}><Ionicons name="calendar-outline" size={14} color="#6c757d" /> {album.date}</Text>
                <Text style={styles.detailText}><Ionicons name="images-outline" size={14} color="#6c757d" /> {album.photos} Photos</Text>
                <Text style={styles.detailText}><Ionicons name="people-outline" size={14} color="#6c757d" /> {album.participants} Part.</Text>
            </View>
        </TouchableOpacity>
    );
};


// --- Composant Principal de l'écran Albums Passés ---
export default function PastAlbumsScreen() {
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Albums Passés</Text>
            
            {/* Liste des Albums */}
            <View style={styles.albumList}>
                {MOCK_ALBUMS.map(album => (
                    <AlbumCard key={album.id} album={album} />
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
    infoBox: {
        backgroundColor: COLORS.lightGray,
        padding: 15,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 8,
    },
    infoText: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 5,
    },
    infoLink: {
        marginTop: 5,
    },
    infoLinkText: {
        fontSize: 14,
        color: COLORS.secondary, // Orange pour le lien Premium
        fontWeight: 'bold',
    },
    albumList: {
        paddingHorizontal: 20,
    },
    albumCard: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    archivedCard: {
        backgroundColor: COLORS.lightGray,
        opacity: 0.8,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.premiumGold, // Bande Or pour attirer l'oeil
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    albumName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.premiumGold,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    premiumText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    activeTag: {
        color: '#28a745', // Vert pour Actif
        fontWeight: 'bold',
        fontSize: 12,
    },
    cardDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    detailText: {
        fontSize: 13,
        color: '#6c757d',
    }
});