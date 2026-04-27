import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RoleGuard } from '@/components/layout/role-guard';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Tab layout for the LEARNER role area.
 *
 * Wraps the three learner-facing screens (dashboard, search, profile) in a
 * {@link RoleGuard} so that a tutor reaching any of these routes is
 * redirected to their own home.
 *
 * @author TutorConnect Team
 */
export default function LearnerTabsLayout() {
  const colorScheme = useColorScheme();

  return (
    <RoleGuard expected="LEARNER">
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Buscar',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="magnifyingglass" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="person.fill" color={color} />
            ),
          }}
        />
      </Tabs>
    </RoleGuard>
  );
}
