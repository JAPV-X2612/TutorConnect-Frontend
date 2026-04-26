import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

function TabIcon({ name, color }: { name: React.ComponentProps<typeof Ionicons>['name']; color: string }) {
  return <Ionicons name={name} size={24} color={color} />;
}

const ACTIVE = '#006A75';
const INACTIVE = '#94A3B8';

const TAB_OPTIONS = {
  tabBarActiveTintColor: ACTIVE,
  tabBarInactiveTintColor: INACTIVE,
  headerShown: false,
  tabBarStyle: { borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
};

export default function TabLayout() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#006A75" />
      </View>
    );
  }

  // user is null during the signOut teardown window. Return a blank screen so
  // the tab tree doesn't remount (tutor→learner switch) while Fabric is still
  // flushing the dismount — that's what causes addViewAt crashes on Android.
  if (!user) {
    return <View className="flex-1 bg-background" />;
  }

  const isTutor = (user.publicMetadata?.role as string | undefined) === 'tutor';

  if (isTutor) {
    return (
      <Tabs screenOptions={TAB_OPTIONS}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'home' : 'home-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sesiones"
          options={{
            title: 'Sesiones',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'calendar' : 'calendar-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="mensajes"
          options={{
            title: 'Mensajes',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'chatbubble' : 'chatbubble-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'person' : 'person-outline'} color={color} />
            ),
          }}
        />
        {/* Hidden or utility screens */}
        <Tabs.Screen name="explore" options={{ href: null }} />
        <Tabs.Screen name="crear-curso" options={{ href: null }} />
      </Tabs>
    );
  }

  return (
    <Tabs screenOptions={TAB_OPTIONS}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'compass' : 'compass-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mensajes"
        options={{
          title: 'Mensajes',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'chatbubble' : 'chatbubble-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} color={color} />
          ),
        }}
      />
      {/* Hidden or utility screens */}
      <Tabs.Screen name="sesiones" options={{ href: null }} />
      <Tabs.Screen name="crear-curso" options={{ href: null }} />
    </Tabs>
  );
}
