import { Surface, Text } from 'react-native-paper';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { Button } from '@nueink/ui';
import { get } from 'aws-amplify/api';

export const MainScreen = () => {
  const { user, signOut } = useAuthenticator();

  const getItems = async () => {
    try {
      const restOperation = get({
        apiName: 'nueInkRestApi',
        path: 'items',
        options: {
          retryStrategy: {
            strategy: 'no-retry', // Overrides default retry strategy
          },
        },
      });
      const response = await restOperation.response;
      console.log('GET call succeeded: ', await response.body.json());
    } catch (error) {
      console.log('GET call failed: ', error);
    }
  };
  return (
    <Surface style={{ flex: 1, padding: 16 }}>
      <Text>UserName: {user.username}</Text>
      <Text>User Id: {user.userId}</Text>
      <Button title="Sign Out" onPress={signOut} />
      <Button title="Get Items" onPress={getItems} />
    </Surface>
  );
};
