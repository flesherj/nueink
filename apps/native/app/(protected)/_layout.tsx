import { useEffect, useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { Stack } from 'expo-router';

import { ClientRepositoryFactory } from '@nueink/aws';
import { AccountService } from '@nueink/core';
import type { Account } from '@nueink/core';
import { AccountProvider } from '@nueink/ui';

// Create client-safe service using ClientRepositoryFactory
const repositoryFactory = ClientRepositoryFactory.getInstance();
const accountService = new AccountService(repositoryFactory.repository('account'));

export const ProtectedLayout = () => {
  const { user } = useAuthenticator();
  const [account, setAccount] = useState<Account>();

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

      // Use AccountService from core (goes through repository layer)
      const accountData = await accountService.findById(userId);

      if (accountData) {
        console.log('Account loaded:', accountData);
        setAccount(accountData);
      } else {
        console.log('No account found for userId:', userId);
      }
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
