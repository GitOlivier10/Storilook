import { Ionicons } from '@expo/vector-icons'; // Utilisé pour les icônes (à installer si non fait)
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { listSessionMetadata, SessionRegistryEntry } from '../services/manifest';

// --- Constantes de l'Identité Storilook ---
const COLORS = {
  primary: '#FF1493',      // Magenta
  secondary: '#FF6347',    // Orange vif
  background: '#FAFAFA',   // Fond blanc cassé
  text: '#333',
  lightGray: '#f0f0f0',
};

// --- Composant pour une Carte d'Album ---
const AlbumCard = ({ album }: { album: SessionRegistryEntry }) => (
    <View style={styles.albumCard}>
        <View style={styles.cardHeader}>
            <Text style={styles.albumName}>{album.eventName}</Text>
            <Text style={styles.activeTag}>Local</Text>
        </View>

        <View style={styles.cardDetails}>
            <Text style={styles.detailText}><Ionicons name="calendar-outline" size={14} color="#6c757d" /> Créé le {new Date(album.createdAt).toLocaleDateString()}</Text>
            <Text style={styles.detailText}><Ionicons name="time-outline" size={14} color="#6c757d" /> Dernière mise à jour {new Date(album.lastUpdated).toLocaleString()}</Text>
            <Text style={styles.detailText}><Ionicons name="key-outline" size={14} color="#6c757d" /> {album.sessionId}</Text>
        </View>
    </View>
);


// --- Composant Principal de l'écran Albums Passés ---
export default function PastAlbumsScreen() {
    const [sessions, setSessions] = useState<SessionRegistryEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const storedSessions = await listSessionMetadata();
                setSessions(storedSessions);
            } catch (error) {
                console.warn('Impossible de lister les sessions Storilook', error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Albums Passés</Text>

            {loading && (
                <View style={styles.infoBox}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.infoText}>Lecture des albums locaux...</Text>
                </View>
            )}

            {!loading && sessions.length === 0 && (
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>Aucun album n'a encore été synchronisé ou créé sur cet appareil.</Text>
                </View>
            )}

            <View style={styles.albumList}>
                {sessions.map(album => (
                    <AlbumCard key={album.sessionId} album={album} />
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
    activeTag: {
        color: '#28a745', // Vert pour Actif
        fontWeight: 'bold',
        fontSize: 12,
    },
    cardDetails: {
        gap: 4,
        marginTop: 5,
    },
    detailText: {
        fontSize: 13,
        color: '#6c757d',
    }
});