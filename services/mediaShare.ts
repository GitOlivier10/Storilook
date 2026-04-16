import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { ManifestEntry } from './manifestUtils';

const ALBUM_NAME = 'Storilook';

export async function saveEntryToGallery(entry: ManifestEntry): Promise<boolean> {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission refusée',
        "Autorisez l'accès à la galerie pour enregistrer la photo.",
      );
      return false;
    }

    const asset = await MediaLibrary.createAssetAsync(entry.fileUri);

    if (Platform.OS === 'ios') {
      const album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset, false);
      }
    }

    Alert.alert('Enregistré', 'Photo ajoutée à votre galerie.');
    return true;
  } catch (error) {
    console.error('saveEntryToGallery', error);
    Alert.alert('Erreur', "Impossible d'enregistrer la photo.");
    return false;
  }
}

export async function shareEntry(entry: ManifestEntry): Promise<boolean> {
  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert('Indisponible', "Le partage n'est pas disponible sur cet appareil.");
      return false;
    }
    await Sharing.shareAsync(entry.fileUri, {
      mimeType: 'image/jpeg',
      dialogTitle: entry.comment || 'Photo Storilook',
    });
    return true;
  } catch (error) {
    console.error('shareEntry', error);
    return false;
  }
}
