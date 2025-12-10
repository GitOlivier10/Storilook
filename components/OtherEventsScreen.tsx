import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { listSessionMetadata, SessionRegistryEntry } from '../services/manifest';

// --- Constantes de l'Identité Storilook ---
const COLORS = {
  primary: '#FF1493',      // Magenta
  secondary: '#FF6347',    // Orange vif (Bouton Premium)
  background: '#FAFAFA',
  text: '#333',
  lightGray: '#f0f0f0',
};

// --- Composant Principal ---
export default function OtherEventsScreen() {
    const [sessions, setSessions] = useState<SessionRegistryEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const storedSessions = await listSessionMetadata();
                setSessions(storedSessions);
            } catch (error) {
                console.warn('Impossible de charger les sessions Storilook', error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Vos autres histoires</Text>

            {loading && (
                <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Chargement des sessions locales...</Text>
                </View>
            )}

            {!loading && sessions.length === 0 && (
                <View style={styles.emptyCard}>
                    <Ionicons name="flash-off" size={24} color={COLORS.text} style={{ marginRight: 10 }} />
                    <Text style={styles.emptyText}>Aucun autre album local pour l'instant.</Text>
                </View>
            )}

            {!loading && sessions.length > 0 && sessions.map((session) => (
                <View key={session.sessionId} style={styles.sessionCard}>
                    <View style={styles.sessionHeader}>
                        <Ionicons name="flash-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.sessionName}>{session.eventName}</Text>
                    </View>
                    <Text style={styles.sessionMeta}>Session : {session.sessionId}</Text>
                    <Text style={styles.sessionMeta}>Créé le {new Date(session.createdAt).toLocaleString()}</Text>
                    <Text style={styles.sessionMeta}>Dernière mise à jour : {new Date(session.lastUpdated).toLocaleString()}</Text>
                </View>
            ))}
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
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    loadingText: {
        marginLeft: 10,
        color: COLORS.text,
    },
    emptyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 15,
        marginHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        marginBottom: 25,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.text,
    },
    sessionCard: {
        backgroundColor: 'white',
        padding: 15,
        marginHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
        marginBottom: 15,
    },
    sessionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    sessionName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    sessionMeta: {
        fontSize: 13,
        color: '#555',
        marginTop: 2,
    },
});