import { useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { useRouter } from 'expo-router';

const AppIndex = () => {
  const { user } = useAuthenticator();
  const router = useRouter();

  useEffect(() => {
    console.log('user', user);
    if (user) {
      // Navigate to main tabs (transaction feed)
      router.replace('/(protected)/(tabs)');
    }
  }, [user, router]);

  return null;
};

export default AppIndex;
