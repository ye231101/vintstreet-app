import { Stack } from 'expo-router';
import React from 'react';

export default function OtherLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'card',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="edit-profile"
        options={{
          title: 'Edit Profile',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="orders"
        options={{
          title: 'My Orders',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="offers"
        options={{
          title: 'My Offers',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="wishlist"
        options={{
          title: 'My Wishlist',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="addresses"
        options={{
          title: 'Addresses',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
