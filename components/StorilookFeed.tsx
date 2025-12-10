import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import AnnotationScreen from './AnnotationScreen'; // <-- NOUVEL IMPORT
import CameraHandler from './CameraHandler'; // <-- NOUVEL IMPORT
import { serializeSessionSharePayload } from '../services/sessionShare';
import { StorilookP2PHandles } from '../hooks/useStorilookP2P';

// --- Définitions de style (réutilisées) ---
const COLORS = {
  primary: '#FF1493',      // Magenta pour l'accent
  secondary: '#FF6347',    // Orange vif pour les boutons
  background: '#FAFAFA',   // Fond blanc cassé
  text: '#333',
  lightGray: '#EAEAEA',
};

// --- Types pour les posts ---
interface Post {
    id: string;
    user: string;
    timestamp: string;
    imageUri: string;
    comment?: string;
    tags?: string[];
}

// --- Composant Feed Item ---
const FeedItem: React.FC<{ post: Post }> = ({ post }) => (
    <View style={feedStyles.postContainer}>
        <View style={feedStyles.postHeader}>
            <Text style={feedStyles.postUsername}>{post.user}</Text>
            <Text style={feedStyles.postTimestamp}>{post.timestamp}</Text>
        </View>
        <Image source={{ uri: post.imageUri }} style={feedStyles.postImage} />
        <Text style={feedStyles.postComment}>
            <Text style={{ fontWeight: 'bold' }}>{post.user} : </Text>
            {post.comment}
        </Text>
    </View>
);

// --- L'écran principal Storilook Feed ---
type StorilookFeedProps = Pick<StorilookP2PHandles, 'eventData' | 'triggerSynchronization' | 'addLocalPhoto'>;

export default function StorilookFeed({ eventData, triggerSynchronization, addLocalPhoto }: StorilookFeedProps) {

    const { syncStatus, eventName, albumFeed, myPhotos, id: sessionId, createdAt, manifestChecksum } = eventData;
    
    // NOUVEAUX ÉTATS POUR LA GESTION DE LA CAPTURE
    const [captureState, setCaptureState] = useState<'dashboard' | 'camera' | 'annotation'>('dashboard');
    const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
    const [annotatedMetadata, setAnnotatedMetadata] = useState<any>(null);


    const feedPosts: Post[] = useMemo(() => (
        albumFeed.map((entry) => ({
            id: entry.id,
            user: 'Moi',
            timestamp: new Date(entry.captureTimestamp).toLocaleString(),
            imageUri: entry.fileUri,
            comment: entry.comment,
            tags: entry.tags,
        }))
    ), [albumFeed]);

    const sharePayload = useMemo(
        () =>
            sessionId
                ? serializeSessionSharePayload(
                    { sessionId, eventName, createdAt: createdAt || new Date().toISOString() },
                    manifestChecksum,
                )
                : null,
        [sessionId, eventName, createdAt, manifestChecksum],
    );

    // --- GESTION DU FLUX DE CAPTURE ---

    // 1. Passage à l'écran d'annotation après la prise de photo
    const handlePhotoTaken = (uri: string) => {
        setCapturedPhotoUri(uri);
        setCaptureState('annotation');
    };

    // 2. Finalisation de l'annotation et retour au dashboard
    const handleAnnotationFinish = async (comment: string, tags: string[]) => {
        if (!capturedPhotoUri) return;

        await addLocalPhoto({ uri: capturedPhotoUri, comment, tags });
        setCapturedPhotoUri(null);
        setCaptureState('dashboard');
        Alert.alert("Photo Stockée", "Votre photo est enregistrée localement en attendant la synchronisation !");
    };


    // --- LOGIQUE D'AFFICHAGE CONDITIONNEL ---

    // Si l'état de capture est actif, nous affichons la caméra ou l'annotation
    if (captureState === 'camera') {
        return <CameraHandler onPhotoCaptured={handlePhotoTaken} />;
    }
    
    if (captureState === 'annotation') {
        return (
            <AnnotationScreen 
                imageUri={capturedPhotoUri || ''} 
                onFinish={handleAnnotationFinish} 
            />
        );
    }
    
    // Si l'état de synchro est 'idle' (hors événement), on affiche un message
    if (syncStatus === 'idle') {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.statusTitle}>Bienvenue sur Storilook V1</Text>
                <Text style={styles.statusSubTitle}>Veuillez démarrer un événement dans l'onglet "En Cours" pour commencer à capturer vos souvenirs.</Text>
            </View>
        );
    }

    // Si l'état est en SYNCHRONISATION (Negotiating ou Transferring)
    if (syncStatus === 'negotiating' || syncStatus === 'transferring') {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.statusTitle}>Protocole PMH en cours...</Text>
                <Text style={styles.statusSubTitle}>Synchronisation P2P en cours. Gardez le partage de connexion actif.</Text>
            </View>
        );
    }

    // Si l'ALBUM EST RÉVÉLÉ (Sync Complete)
    if (syncStatus === 'complete' && albumFeed.length > 0) {
        return (
            <ScrollView style={styles.container}>
                <Text style={styles.albumTitle}>Album Révélé : {eventName}</Text>
                <View style={styles.sessionCard}>
                    <Text style={styles.sessionLabel}>Session locale</Text>
                    <Text style={styles.sessionValue}>{sessionId}</Text>
                    <Text style={styles.sessionCreatedAt}>Créé le {new Date(createdAt).toLocaleString()}</Text>
                    {sharePayload && (
                        <View style={styles.qrWrapper}>
                            <QRCode value={sharePayload} size={160} backgroundColor="white" />
                            <Text style={styles.qrHint}>Scannez pour rejoindre la session P2P.</Text>
                            <Text style={styles.qrChecksum}>
                                Checksum manifest : {manifestChecksum ? `${manifestChecksum.slice(0, 8)}…` : 'calcul en cours'}
                            </Text>
                        </View>
                    )}
                </View>
                {feedPosts.map((post: Post) => (
                    <FeedItem key={post.id} post={post} />
                ))}
                <View style={{ height: 100 }} />
            </ScrollView>
        );
    }

    // ÉVÉNEMENT ACTIF : PHASE DE CAPTURE (Dashboard)
    return (
        <View style={styles.captureContainer}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={styles.eventName}>{eventName}</Text>
                    <Text style={styles.eventStatus}>Statut : En Attente de Synchro ({syncStatus})</Text>
                </View>

                <View style={styles.sessionCard}>
                    <Text style={styles.sessionLabel}>Session locale</Text>
                    <Text style={styles.sessionValue}>{sessionId}</Text>
                    <Text style={styles.sessionCreatedAt}>Créé le {new Date(createdAt).toLocaleString()}</Text>
                    <Text style={styles.sessionChecksum}>
                        Checksum manifest : {manifestChecksum ? `${manifestChecksum.slice(0, 8)}…` : 'calcul en cours'}
                    </Text>
                    {sharePayload && (
                        <View style={styles.qrInline}>
                            <QRCode value={sharePayload} size={120} backgroundColor="white" />
                            <Text style={styles.qrHint}>Partagez ce QR pour connecter les invités en local.</Text>
                        </View>
                    )}
                </View>

                {/* Bloc de Statut de la Capture */}
                <View style={styles.captureStatusBox}>
                    <Text style={styles.captureText}>
                        Photos Capturées Localement : <Text style={styles.countText}>{myPhotos.length}</Text>
                    </Text>
                    <Text style={styles.captureText}>
                        Participants : <Text style={styles.countText}>{eventData.participants.length}</Text>
                    </Text>
                </View>

                {/* Bouton de capture réel */}
                <TouchableOpacity 
                    style={styles.captureButton} 
                    onPress={() => setCaptureState('camera')} // <-- LANCE LE CameraHandler
                >
                    <Text style={styles.captureButtonText}>📷 Prendre une Photo</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Bouton de Déclenchement de la Synchronisation */}
            <TouchableOpacity 
                style={styles.syncButton} 
                onPress={triggerSynchronization} 
            >
                <Text style={styles.syncButtonText}>Révéler l'Album Commun (Synchro)</Text>
            </TouchableOpacity>
        </View>
    );
}

// Styles sont conservés pour la complétude
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: COLORS.background, },
    statusTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginTop: 15, textAlign: 'center', },
    statusSubTitle: { fontSize: 16, color: '#6c757d', marginTop: 10, textAlign: 'center', },
    tipText: { fontSize: 14, color: COLORS.primary, marginTop: 20, fontStyle: 'italic', textAlign: 'center', },
    albumTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', paddingVertical: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: COLORS.lightGray, },
    captureContainer: { flex: 1, backgroundColor: COLORS.background, },
    scrollView: { paddingHorizontal: 20, paddingTop: 20, },
    header: { marginBottom: 20, },
    eventName: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, },
    eventStatus: { fontSize: 14, color: COLORS.primary, fontWeight: '600', },
    captureStatusBox: { backgroundColor: 'white', padding: 20, borderRadius: 10, marginBottom: 30, borderLeftWidth: 5, borderLeftColor: COLORS.secondary, },
    captureText: { fontSize: 16, color: COLORS.text, marginBottom: 5, },
    countText: { fontWeight: 'bold', color: COLORS.secondary, },
    captureButton: { backgroundColor: COLORS.lightGray, padding: 40, borderRadius: 15, borderWidth: 2, borderColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center', },
    captureButtonText: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, },
    syncButton: { backgroundColor: COLORS.primary, padding: 20, alignItems: 'center', position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, borderTopLeftRadius: 10, borderTopRightRadius: 10, },
    syncButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', },
    sessionCard: { backgroundColor: 'white', padding: 16, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: COLORS.lightGray },
    sessionLabel: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
    sessionValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginTop: 6 },
    sessionCreatedAt: { fontSize: 13, color: '#666', marginTop: 2 },
    sessionChecksum: { fontSize: 13, color: '#666', marginTop: 6 },
    qrInline: { marginTop: 12, alignItems: 'center' },
    qrWrapper: { marginTop: 16, alignItems: 'center', backgroundColor: 'white', padding: 10, borderRadius: 8 },
    qrHint: { fontSize: 12, color: '#555', marginTop: 8, textAlign: 'center' },
    qrChecksum: { fontSize: 12, color: '#555', marginTop: 4 },
});

const feedStyles = StyleSheet.create({
    postContainer: { backgroundColor: 'white', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray, },
    postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, },
    postUsername: { fontWeight: 'bold', fontSize: 16, color: COLORS.text, },
    postTimestamp: { fontSize: 12, color: '#999', },
    postImage: { width: '100%', height: 450, backgroundColor: COLORS.lightGray, },
    postComment: { padding: 10, fontSize: 14, color: COLORS.text, },
});