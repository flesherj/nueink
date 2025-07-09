import { useEffect, useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { Stack } from 'expo-router';

import { Account, AccountApi } from '@nueink/aws';
import { AccountProvider } from '@nueink/ui';

export const ProtectedLayout = () => {
  const { user } = useAuthenticator();
  const [account, setAccount] = useState<Account>();

  useEffect(() => {
    loadAccount();
  }, [user]);

  const loadAccount = async () => {
    if (user.userId === undefined) return;
    const account = await AccountApi.create().getAccount(user.userId);
    setAccount(account);
  };

  return (
    <AccountProvider account={account}>
      <Stack screenOptions={{ headerShown: false }} />
    </AccountProvider>
  );
};

export default ProtectedLayout;
