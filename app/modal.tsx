import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function ModalScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Session Storilook' }} />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Pas de contenu modal pour le moment</Text>
        <Text style={{ textAlign: 'center', color: '#666' }}>
          Cette page existe pour supprimer l&apos;avertissement de navigation et pourra accueillir des actions
          contextuelles (partage local, détails de session) dans une prochaine itération.
        </Text>
      </View>
    </>
  );
}
