import { router } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  useEffect(() => {
    router.replace('/(tabs)');
  }, []);

  return null;
}
