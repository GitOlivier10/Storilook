import React, { useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Dimensions de l'écran pour le style
const { height } = Dimensions.get('window');

// --- Constantes de l'Identité Storilook ---
const COLORS = {
  primary: '#FF1493',      // Magenta
  secondary: '#FF6347',    // Orange vif pour les boutons
  background: '#FAFAFA',   // Fond blanc cassé
  text: '#333',
};

// Props : Nous simulerons ici le chemin de la photo capturée
interface AnnotationProps {
    imageUri: string; // L'URI (chemin local) de la photo qui vient d'être prise
    onFinish: (comment: string, tags: string[]) => void; // Fonction pour retourner au tableau de bord
}

export default function AnnotationScreen({ imageUri, onFinish }: AnnotationProps) {
    const [comment, setComment] = useState('');
    const [tags, setTags] = useState<string>('');

    const saveAndContinue = (shouldSave: boolean) => {
        const finalComment = shouldSave ? comment.trim() : '';
        const finalTags = shouldSave ? tags.split(/[,\s]+/).filter(Boolean) : [];
        
        // ***********************************************************************************
        // LOGIQUE TECHNIQUE CLÉ (Ce qui se passe dans la vraie app) :
        // 1. Enregistrement du fichier 'imageUri' + metadata (comment/tags) dans le stockage local chiffré.
        // 2. Mise à jour du Manifeste local (PMH) avec les détails de cette nouvelle photo.
        // 3. Retour à l'écran de l'événement en cours.
        // ***********************************************************************************

        // Appel de la fonction de retour avec les données (simulé)
        onFinish(finalComment, finalTags);
    };

    return (
        <View style={styles.annotationScreen}>
            
            {/* APERÇU DE LA PHOTO (60% de l'écran pour rester visible) */}
            <View style={styles.photoPreview}>
                <Image 
                    style={styles.capturedImage} 
                    source={{ uri: imageUri }} 
                    // Supprimer ou commenter cette ligne pour le moment
                    // defaultSource={require('../assets/images/default-photo-placeholder.png')} 
                />
            </View>

            {/* COMMANDES D'ANNOTATION */}
            <View style={styles.annotationControls}>
                <Text style={styles.annotationTitle}>Racontez cette photo...</Text>
                
                <TextInput
                    style={[styles.inputField, { height: 70 }]}
                    onChangeText={setComment}
                    value={comment}
                    placeholder="Ajoutez une légende ou une anecdote... (facultatif)"
                    multiline
                />
                
                <TextInput
                    style={styles.inputField}
                    onChangeText={setTags}
                    value={tags}
                    placeholder="#Amicia #Gâteau #MomentDrôle (facultatif)"
                />

                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.btnSkip} onPress={() => saveAndContinue(false)}>
                        <Text style={styles.btnSkipText}>Passer / Ne pas annoter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnSave} onPress={() => saveAndContinue(true)}>
                        <Text style={styles.btnSaveText}>Stocker cette photo</Text>
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.storageHint}>
                    Stockage local sécurisé. Non synchronisé avant la "Synchro Finale".
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    annotationScreen: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    photoPreview: {
        width: '100%',
        maxHeight: height * 0.6, 
        backgroundColor: COLORS.text, // Fond noir pour contraste
        justifyContent: 'center',
        alignItems: 'center',
    },
    capturedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain', 
    },
    annotationControls: {
        padding: 20,
        flexGrow: 1,
        backgroundColor: 'white',
    },
    annotationTitle: {
        color: COLORS.primary,
        marginBottom: 10,
        fontSize: 18,
        fontWeight: '600',
    },
    inputField: {
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 15,
        fontSize: 16,
        textAlignVertical: 'top',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    btnSave: {
        backgroundColor: COLORS.secondary,
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginLeft: 10,
        alignItems: 'center',
    },
    btnSaveText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15,
    },
    btnSkip: {
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginRight: 10,
        alignItems: 'center',
    },
    btnSkipText: {
        color: COLORS.text,
        fontWeight: 'bold',
        fontSize: 15,
    },
    storageHint: {
        textAlign: 'center',
        fontSize: 12,
        color: 'gray',
        marginTop: 15,
    }
});