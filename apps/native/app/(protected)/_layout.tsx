import { useEffect, useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { Stack } from 'expo-router';

import { AccountEntity, AccountApi } from '@nueink/aws';
import { AccountProvider } from '@nueink/ui';

export const ProtectedLayout = () => {
  const { user } = useAuthenticator();
  const [account, setAccount] = useState<AccountEntity>();

  useEffect(() => {
    loadAccount();
  }, [user]);

  const loadAccount = async () => {
    try {
      console.log('loadAccount called with user:', JSON.stringify(user, null, 2));

      // Account is created with Cognito sub (userId), not username
      const userId = user.userId;

      if (!userId) {
        console.error('No userId found on user object');
        return;
      }

      console.log('Fetching account for userId:', userId);
      const account = await AccountApi.create().getAccount(userId);
      console.log('Account loaded:', account);
      setAccount(account);
    } catch (error) {
      console.error('Error loading account:', error);
    }
  };

  return (
    <AccountProvider account={account}>
      <Stack screenOptions={{ headerShown: false }} />
    </AccountProvider>
  );
};

export default ProtectedLayout;
