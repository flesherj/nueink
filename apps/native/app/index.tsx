import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { Surface, Text } from 'react-native-paper';

import { Button } from '@nueink/ui';

const AppIndex = () => {
  const { user, signOut } = useAuthenticator();
  return (
    <Surface style={{ flex: 1, padding: 16 }}>
      <Text>UserName: {user.username}</Text>
      <Text>User Id: {user.userId}</Text>
      <Button title="Sign Out" onPress={signOut} />
    </Surface>
  );
};

export default AppIndex;
