# Storilook V1 – Audit technique initial

## Architecture actuelle
- **Expo + React Native (expo-router)** : navigation par onglets via `app/(tabs)` avec `expo-router`.
- **Hooks personnalisés** : `hooks/useStorilookP2P.js` gère l’état d’évènement et la pseudo-synchro P2P.
- **UI principale** : `components/StorilookFeed.tsx` orchestre capture → annotation → stockage local simulé → synchro simulée.
- **Capture/Annotation** : `components/CameraHandler.tsx` (permis et capture) et `components/AnnotationScreen.tsx` (métadonnées) déclenchés depuis le feed.
- **Écrans secondaires** : PastAlbums, Contacts, Settings, OtherEvents sont essentiellement statiques avec données maquettées.
- **Styling** : inline StyleSheet, pas de thème partagé (hormis constantes locales).

## État fonctionnel observé
- **Parcours de création d’évènement** : formulaire `app/(tabs)/index.tsx` déclenche `startEvent` du hook → passe l’état à `advertising` et affiche le feed.
- **Capture** : `StorilookFeed` déclenche `CameraHandler`; après `takePictureAsync`, la photo est passée à `AnnotationScreen` puis stockée localement via `addLocalPhoto` (tableau en mémoire).
- **Synchro** : `triggerSynchronization` simule 5 s puis remplit un feed factice et passe l’état à `complete`.
- **Albums/Contacts/Settings** : écrans statiques ou maquettes sans logique.

## Écarts / faiblesses par rapport au cahier des charges V1
- **P2P local réel absent** : pas d’implémentation Wi‑Fi Direct / Nearby / Multipeer ni gestion des rôles annonceur/chercheur, canaux, découpage binaire, reprise, ni protocole PMH réel (manifeste, checksum, ordonnancement).
- **Manifeste PMH non présent** : aucune structure de manifest, checksum, signatures, versioning, ni stockage persistant chiffré.
- **Gestion des sessions** : pas de QR code/session ID partagé, pas de découverte via scan, pas de sélection du rôle (hôte/invité) ni gestion de clé de session.
- **Capture multimédia limitée** : uniquement photo; pas de contrôle de taille, pas de pipeline de compression/cryptage local avant enregistrement.
- **Album chronologique** : feed maquetté; pas de tri par timestamp, pas de cache local persistant, pas d’historique multi-album.
- **Compatibilité offline** : stockage en mémoire seulement → perte à chaque reload; pas d’utilisation de `FileSystem`, `SQLite` ou équivalent chiffré.
- **Sécurité** : aucune clé/secret, pas de chiffrement local, pas de signature des manifestes, pas de contrôle d’accès.
- **Qualité code** : mélange JS/TS, typage faible, absence de tests, dépendances natives (expo-camera) non vérifiées; components dupliquent les constantes de couleur; fichiers courts importent simplement des composants (inutile).

## Risques techniques
- Perte de données si l’app se ferme (état en mémoire uniquement).
- Non-conformité stricte P2P (aucune lib bas niveau intégrée; expo peut limiter Nearby/Multipeer sans eject).
- Régressions potentielles à cause de TypeScript non configuré pour les fichiers `.js` (hook non typé).
- Accessibilité et UX : pas de feedback d’erreur en cas d’échec caméra, pas de spinner global pendant synchro réseau réel.

## Recommandations structurelles
1. **Séparer couche domaine / infra** : créer un module `src/core` (manifeste, modèles, orchestration P2P) et `src/infra` (adaptateurs Expo/BLE/Nearby). Les composants UI ne devraient consommer qu’un service `SessionService` typé.
2. **Persistance locale** : adopter `expo-file-system` + `expo-sqlite` ou `react-native-mmkv` (gratuit) pour stocker manifestes et médias localement, avec checksum SHA256.
3. **Protocole PMH** : définir schémas `Manifest`, `Entry`, `Participant`, `TransferChunk`, avec sérialisation JSON + HMAC local. Ajouter machine à états : `idle → advertising/searching → negotiating → transferring → verifying → complete/error`.
4. **Découplage navigation/état** : centraliser le hook dans `src/state/sessionStore.ts` (Zustand ou Redux Toolkit) pour éviter la recréation d’état; exposer actions P2P asynchrones.
5. **QR & découverte** : intégrer génération/scan via `react-native-qrcode-svg` + `expo-barcode-scanner` pour transporter `sessionId`, checksum et rôle.
6. **Tests** : ajouter tests unitaires JS/TS pour le manifeste (tri chronologique, checksum, merge) et tests d’intégration UI basiques avec `@testing-library/react-native`.

## Priorisation (prochaine étape à coder)
1. **Infrastructure de manifeste local (PMH minimal)** : stockage persistant des captures (fichiers) + index JSON avec checksum, tri temporel et statut de synchro.
2. **Service P2P simulé mais contractuel** : exposer des interfaces (`P2PTransport`) avec implémentation mock pour avancer sur le flux complet; facilitera remplacement par implémentation native (Nearby/Multipeer) sans casser l’UI.
3. **QR session** : génération/scan du QR contenant `sessionId`, `hostKey`, `eventName` et timestamp, branché au service précédent.
4. **Refactor UI** : connecter l’UI au store central + manifest; feed doit lire la persistance au montage et afficher en ordre chrono.

## Capacité actuelle à livrer V1
- **Insuffisant** : l’état actuel est une maquette UI sans P2P réel ni persistance. Une V1 conforme nécessite au minimum les modules de manifeste, P2P local, QR et pipeline de capture persistante.

## Module proposé à implémenter immédiatement
- **Module Manifest & Stockage Local (PMH minimal)** :
  - Types TS pour `Manifest`, `ManifestEntry`, `PhotoMeta`.
  - Service `ManifestStore` utilisant `expo-file-system` pour écrire un fichier `manifest.json` et stocker les photos dans `Documents/storilook/{eventId}`.
  - Fonctions : `initSession(eventName)`, `addLocalCapture(fileUri, comment, tags)`, `listEntries()`, `computeChecksum()` (SHA-256 sur manifest trié), `markSynced(ids[])`.
  - Remplacer les appels `addLocalPhoto`/`mockFeed` par ce service (mock transport pour synchro pour l’instant).

## Guide rapide pour tester l’existant
- `npm install` puis `npm start` (ou `npx expo start`).
- Onglet **En cours** → créer un événement → bouton **📷 Prendre une Photo** → autoriser la caméra → capturer → annoter → stocker → cliquer **Révéler l'Album Commun** pour voir le feed factice.
- Aucun test automatisé n’est présent.

