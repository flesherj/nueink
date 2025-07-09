import { useAuthenticator } from '@aws-amplify/ui-react-native';

import { useRouter } from 'expo-router';

const AppIndex = () => {
  const { user } = useAuthenticator();
  const router = useRouter();

  if (user) {
    router.navigate('onboard');
  }
};

export default AppIndex;
