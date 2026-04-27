import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RoleGuard } from '@/components/layout/role-guard';

/**
 * Tab layout for the TUTOR role area.
 *
 * Wraps the three tutor-facing screens (dashboard, sessions, profile) in a
 * {@link RoleGuard} so that a learner reaching any of these routes is
 * redirected to their own home.
 *
 * @author TutorConnect Team
 */
export default function TutorTabsLayout() {
  return (
    <RoleGuard expected="TUTOR">
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#006A75',
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E2E8F0',
          },
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
          name="sessions"
          options={{
            title: 'Sesiones',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="calendar" color={color} />
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
