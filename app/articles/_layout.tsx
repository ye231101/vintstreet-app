import { Stack } from 'expo-router';
import React from 'react';

export default function ArticlesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'card',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="get-informed"
        options={{
          title: 'Get Informed',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="meet-vint-street"
        options={{
          title: 'Meet Vint Street',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="our-community"
        options={{
          title: 'Our Community',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="selling-relisting"
        options={{
          title: 'Buying, Selling & Re-Listing',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
