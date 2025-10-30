import { Stack } from 'expo-router';
import React from 'react';

export default function SellerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'card',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="seller-setup"
        options={{
          title: 'Set up Seller Account',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="finances"
        options={{
          title: 'Finances',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Seller Dashboard',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="shop-settings"
        options={{
          title: 'Shop Settings',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="listings"
        options={{
          title: 'My Listings',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="streams"
        options={{
          title: 'My Streams',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="messages"
        options={{
          title: 'My Messages',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="orders"
        options={{
          title: 'Orders',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="offers"
        options={{
          title: 'Offers',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="reviews"
        options={{
          title: 'Reviews',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
