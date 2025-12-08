import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

// --- Constantes de l'Identité Storilook ---
const COLORS = {
    primary: '#FF1493', // Magenta
};

function TabBarIcon(props: { name: React.ComponentProps<typeof Ionicons>['name']; color: string }) {
    return <Ionicons size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: COLORS.primary, // Couleur de l'onglet sélectionné
                tabBarInactiveTintColor: '#999',
                headerShown: false, // Masquer le header par défaut d'Expo
                tabBarStyle: {
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60, 
                }
            }}>
            
            {/* 1. Événement en cours (Page par défaut) */}
            <Tabs.Screen
                name="index"
                options={{
                    title: 'En Cours',
                    tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
                }}
            />

            {/* 2. Autres Événements (Paywall Premium) */}
            <Tabs.Screen
                name="other"
                options={{
                    title: 'Autres Événements',
                    tabBarIcon: ({ color }) => <TabBarIcon name="globe-outline" color={color} />,
                }}
            />
            
            {/* 3. Contacts */}
            <Tabs.Screen
                name="contacts"
                options={{
                    title: 'Contacts',
                    tabBarIcon: ({ color }) => <TabBarIcon name="people-outline" color={color} />,
                }}
            />

            {/* 4. Albums Passés */}
            <Tabs.Screen
                name="albums"
                options={{
                    title: 'Albums Passés',
                    tabBarIcon: ({ color }) => <TabBarIcon name="archive-outline" color={color} />,
                }}
            />

            {/* 5. Paramètres */}
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Réglages',
                    tabBarIcon: ({ color }) => <TabBarIcon name="settings-outline" color={color} />,
                }}
            />
        </Tabs>
    );
}