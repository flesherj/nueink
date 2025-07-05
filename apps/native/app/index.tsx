import { Surface, Text } from 'react-native-paper';
import { get } from 'aws-amplify/api';

import { useAuthenticator } from '@aws-amplify/ui-react-native';

import { Button } from '@nueink/ui';
import { useState } from 'react';

const AppIndex = () => {
  const { user, signOut } = useAuthenticator();
  const [accounts, setAccounts] = useState<[]>([]);

  const getItems = async () => {
    try {
      const restOperation = get({
        apiName: 'nueInkRestApi',
        path: 'account',
        options: {
          retryStrategy: {
            strategy: 'no-retry', // Overrides default retry strategy
          },
        },
      });
      const response = await restOperation.response;
      const accounts = await response.body.json();
      // @ts-ignore
      setAccounts(accounts);
      console.log('GET call succeeded: ', await response.body.json());
    } catch (error) {
      console.log('GET call failed: ', error);
    }
  };

  return (
    <Surface style={{ flex: 1, padding: 16 }}>
      <Text>UserName: {user.username}</Text>
      <Text>User Id: {user.userId}</Text>
      <Text>Account Count: {accounts.length}</Text>
      <Button title="Sign Out" onPress={signOut} />
      <Button title="Get Items" onPress={getItems} />
    </Surface>
  );
};

export default AppIndex;
