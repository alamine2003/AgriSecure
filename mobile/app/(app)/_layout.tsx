import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { C } from '../../src/constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as IconName)}
      size={24}
      color={focused ? C.primary : C.textMuted}
    />
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.bgCard,
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor:   C.primary,
        tabBarInactiveTintColor: C.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="dashboard"  options={{ title: 'Accueil',    tabBarIcon: ({ focused }) => <TabIcon name="home"         focused={focused} /> }} />
      <Tabs.Screen name="cameras"    options={{ title: 'Caméras',    tabBarIcon: ({ focused }) => <TabIcon name="videocam"     focused={focused} /> }} />
      <Tabs.Screen name="alerts"     options={{ title: 'Alertes',    tabBarIcon: ({ focused }) => <TabIcon name="warning"      focused={focused} /> }} />
      <Tabs.Screen name="inbox"      options={{ title: 'Messagerie', tabBarIcon: ({ focused }) => <TabIcon name="chatbubble"   focused={focused} /> }} />
      <Tabs.Screen name="reports"    options={{ title: 'Rapports',   tabBarIcon: ({ focused }) => <TabIcon name="document-text" focused={focused} /> }} />
      <Tabs.Screen name="profile"    options={{ title: 'Profil',     tabBarIcon: ({ focused }) => <TabIcon name="person"       focused={focused} /> }} />
      {/* Écran caché (pas dans la tab bar) */}
      <Tabs.Screen name="camera-stream" options={{ href: null }} />
    </Tabs>
  );
}
