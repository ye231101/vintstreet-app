import { Stack } from 'expo-router';

export default function StreamLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'card',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="schedule"
        options={{
          title: 'Schedule Stream',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Stream Details',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="start/[id]"
        options={{
          title: 'Start Stream',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
