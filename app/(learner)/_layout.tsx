import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { RoleGuard } from '@/components/layout/role-guard';

const ACTIVE = '#006A75';
const INACTIVE = '#94A3B8';

const TAB_OPTIONS = {
  tabBarActiveTintColor: ACTIVE,
  tabBarInactiveTintColor: INACTIVE,
  headerShown: false,
  tabBarStyle: { borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
};

export default function LearnerTabsLayout() {
  return (
    <RoleGuard expected="LEARNER">
      <Tabs screenOptions={TAB_OPTIONS}>
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sessions"
          options={{
            title: 'Sesiones',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="mensajes"
          options={{
            title: 'Mensajes',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="search" options={{ href: null }} />
        <Tabs.Screen name="course/[courseId]" options={{ href: null }} />
        <Tabs.Screen name="booking/[courseId]" options={{ href: null }} />
        <Tabs.Screen name="payment/[bookingId]" options={{ href: null }} />
        <Tabs.Screen name="payment/success" options={{ href: null }} />
      </Tabs>
    </RoleGuard>
  );
}
