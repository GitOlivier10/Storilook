# Vue d'ensemble du code Storilook

Cette application mobile est construite avec **Expo Router** et **React Native** pour proposer un parcours de capture photo chiffré puis de synchronisation P2P (PMH) avant de révéler un album commun.

## Navigation
- `app/_layout.tsx` configure le thème clair/sombre et la pile racine avec Expo Router, en masquant l'en-tête par défaut et en initialisant la route `(tabs)`.【F:app/_layout.tsx†L1-L47】
- `app/(tabs)/_layout.tsx` définit cinq onglets (En cours, Autres événements, Contacts, Albums, Réglages) avec des icônes Ionicons et une barre personnalisée.【F:app/(tabs)/_layout.tsx†L1-L55】

## Parcours principal "En Cours"
- `app/(tabs)/index.tsx` sert de point d'entrée : tant qu'aucun événement n'est lancé, il affiche un formulaire pour nommer l'album et invite à activer le partage de connexion. Après validation, il bascule vers le feed en s'appuyant sur le hook P2P.【F:app/(tabs)/index.tsx†L3-L76】【F:app/(tabs)/index.tsx†L79-L116】
- Le hook `hooks/useStorilookP2P.js` simule l'état d'une session (ID, participants, photos locales, feed synchronisé, statut). Il expose `startEvent` pour générer un identifiant et passer en mode `advertising`, ainsi que `triggerSynchronization` pour simuler le protocole PMH avant de révéler le feed.【F:hooks/useStorilookP2P.js†L1-L78】【F:hooks/useStorilookP2P.js†L80-L118】

## Capture, annotation et synchronisation
- `components/StorilookFeed.tsx` orchestre la phase active : il montre les comptes de photos locales et participants, lance le module photo, propose l'annotation, puis peut déclencher la synchro finale. Il affiche aussi les écrans d'attente (négociation/transfert) et l'album révélé une fois le feed rempli.【F:components/StorilookFeed.tsx†L1-L118】【F:components/StorilookFeed.tsx†L120-L199】
- `components/CaptureScreen.tsx` pilote la caméra Expo : demande les permissions, capture une photo haute qualité, puis enregistre la métadonnée via le hook P2P avant de revenir au dashboard.【F:components/CaptureScreen.tsx†L1-L84】【F:components/CaptureScreen.tsx†L86-L153】
- `components/AnnotationScreen.tsx` affiche l'aperçu de la photo, recueille commentaire et tags, et renvoie l'ensemble pour stockage local sécurisé avant la synchronisation finale.【F:components/AnnotationScreen.tsx†L1-L67】【F:components/AnnotationScreen.tsx†L69-L137】

## Autres onglets et écrans
- `components/OtherEventsScreen.tsx` illustre le paywall Premium pour gérer plusieurs événements, avec une carte rappelant l'album actif et une section avantages.【F:components/OtherEventsScreen.tsx†L1-L72】【F:components/OtherEventsScreen.tsx†L74-L123】
- `components/PastAlbumsScreen.tsx` propose des cartes d'albums passés avec verrouillage des archives au-delà de sept jours (incitation Premium).【F:components/PastAlbumsScreen.tsx†L1-L70】【F:components/PastAlbumsScreen.tsx†L72-L153】
- Les autres onglets (Contacts, Réglages) suivent la même structure d'import dans `app/(tabs)` et peuvent être enrichis ultérieurement.
