import { useState } from 'react';
import { Surface, Text } from 'react-native-paper';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { Button } from '@nueink/ui';
import { Account, AccountApi } from '@nueink/aws';

export const MainScreen = () => {
  const { user, signOut } = useAuthenticator();

  const [accounts, setAccounts] = useState<Array<Account>>([]);

  const getAccounts = async () => {
    try {
      const accounts = await AccountApi.create().getAccounts();
      setAccounts(accounts);
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
      <Button title="Get Items" onPress={getAccounts} />
    </Surface>
  );
};
