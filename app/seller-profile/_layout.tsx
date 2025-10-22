import { Stack } from 'expo-router';
import React from 'react';

export default function SellerProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'card',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Seller Profile',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
