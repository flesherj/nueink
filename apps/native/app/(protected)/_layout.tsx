import { useEffect, useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { Stack } from 'expo-router';
import { generateClient } from 'aws-amplify/data';
import { useTheme } from 'react-native-paper';

import type { Schema } from '@nueink/aws/amplify/data/resource';
import { NueInkRepositoryFactory } from '@nueink/aws';
import { NueInkServiceFactory, type Account } from '@nueink/core';
import { AccountProvider } from '@nueink/ui';

// Create Amplify client with userPool auth (client-safe)
const client = generateClient<Schema>({ authMode: 'userPool' });

// Use the same factories as Lambda!
// @ts-expect-error - Amplify generated types cause excessive stack depth, but runtime works fine
const repositoryFactory = NueInkRepositoryFactory.getInstance(client);
const serviceFactory = NueInkServiceFactory.getInstance(repositoryFactory);
const accountService = serviceFactory.account();

export const ProtectedLayout = () => {
  const { user } = useAuthenticator();
  const theme = useTheme();
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
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="settings/connect-accounts"
          options={{
            headerShown: true,
            presentation: 'modal',
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.onSurface,
          }}
        />
        <Stack.Screen
          name="accounts/[id]"
          options={{
            headerShown: true,
            headerBackTitle: 'Back',
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.onSurface,
          }}
        />
        <Stack.Screen
          name="transactions/[id]"
          options={{
            headerShown: true,
            headerBackTitle: 'Back',
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.onSurface,
          }}
        />
        <Stack.Screen
          name="onboard"
          options={{ headerShown: false }}
        />
      </Stack>
    </AccountProvider>
  );
};

export default ProtectedLayout;
