import { Surface, Text } from 'react-native-paper';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { Button } from '@nueink/ui';

export const MainScreen = () => {
  const { user, signOut } = useAuthenticator();

  return (
    <Surface style={{ flex: 1, padding: 16 }}>
      <Text>UserName: {user.username}</Text>
      <Text>User Id: {user.userId}</Text>
      <Button title="Sign Out" onPress={signOut} />
    </Surface>
  );
};
