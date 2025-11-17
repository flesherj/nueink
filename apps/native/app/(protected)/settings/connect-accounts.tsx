import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Surface, Text, Button, Card, ActivityIndicator, useTheme } from 'react-native-paper';
import { useAccountProvider } from '@nueink/ui';
import * as WebBrowser from 'expo-web-browser';
import { useRouter, Stack } from 'expo-router';
import { IntegrationApi } from '@nueink/sdk';
import Environment from '../../../models/Environment';

// Create API client (uses Amplify API with Cognito auth)
const integrationApi = IntegrationApi.create();

export default function ConnectAccountsScreen() {
  const { account } = useAccountProvider();
  const router = useRouter();
  const theme = useTheme();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [ynabConnected, setYnabConnected] = useState(false);
  const [plaidConnected, setPlaidConnected] = useState(false);

  useEffect(() => {
    checkConnectedProviders();
  }, [account]);

  /**
   * Check which providers are already connected
   * Uses REST API client with automatic Cognito authentication
   */
  const checkConnectedProviders = async () => {
    if (!account) return;

    try {
      // Call REST API - authenticated with Cognito credentials
      const integrations = await integrationApi.listByAccount(account.accountId);

      setYnabConnected(integrations.some(i => i.provider === 'ynab' && i.status === 'active'));
      setPlaidConnected(integrations.some(i => i.provider === 'plaid' && i.status === 'active'));
    } catch (error) {
      console.error('Error checking connected providers:', error);
    }
  };

  /**
   * Trigger manual sync for a provider
   * Uses REST API client with automatic Cognito authentication
   */
  const syncProvider = async (provider: 'ynab' | 'plaid') => {
    if (!account?.defaultOrgId) {
      Alert.alert('Error', 'Account or organization not loaded');
      return;
    }

    try {
      setSyncing(provider);

      console.log('Triggering sync:', {
        accountId: account.accountId,
        provider,
        organizationId: account.defaultOrgId
      });

      // Call REST API - authenticated with Cognito credentials
      const result = await integrationApi.triggerSync(
        account.accountId,
        provider,
        account.defaultOrgId
      );

      console.log('Sync triggered:', result);

      Alert.alert(
        'Sync Started',
        `Syncing your ${provider.toUpperCase()} data. This may take a few moments.`,
        [{ text: 'OK' }]
      );

      // Poll for sync status updates
      // The Lambda may take a few seconds to start, so poll every 2 seconds for 60 seconds
      let pollCount = 0;
      const pollInterval = setInterval(async () => {
        pollCount++;
        await checkConnectedProviders();

        // Stop polling after 30 checks (60 seconds) or if we're no longer syncing
        if (pollCount >= 30) {
          clearInterval(pollInterval);
        }
      }, 2000);
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert(
        'Sync Error',
        error instanceof Error ? error.message : 'Failed to trigger sync'
      );
    } finally {
      setSyncing(null);
    }
  };

  /**
   * Initiate OAuth flow for a provider
   */
  const connectProvider = async (provider: 'ynab' | 'plaid') => {
    if (!account) {
      Alert.alert('Error', 'Account not loaded');
      return;
    }

    if (provider === 'plaid') {
      Alert.alert('Coming Soon', 'Plaid integration will be available soon');
      return;
    }

    try {
      setConnecting(provider);

      // Get OAuth config from Environment (loaded from build-time SSM parameters)
      const config = Environment.oauth;

      console.log('OAuth config loaded from Environment:', {
        ynabClientId: config.ynab.clientId.substring(0, 10) + '...',
        callbackUrl: config.callbackUrl,
        provider,
      });

      if (!config.ynab.clientId) {
        Alert.alert(
          'Configuration Error',
          'OAuth client ID not configured. Build the app with: yarn ios'
        );
        return;
      }

      if (!config.callbackUrl) {
        Alert.alert(
          'Configuration Error',
          'OAuth callback URL not found. Ensure amplify_outputs.json exists.'
        );
        return;
      }

      // Build OAuth state: accountId:provider:organizationId
      const organizationId = account.defaultOrgId;
      const state = `${account.accountId}:${provider}:${organizationId}`;

      // Build OAuth URL
      const authUrl = `${config.ynab.authUrl}?${new URLSearchParams({
        client_id: config.ynab.clientId,
        redirect_uri: config.callbackUrl,
        response_type: 'code',
        state,
      }).toString()}`;

      console.log('Opening OAuth URL:', authUrl);

      // Open OAuth in secure browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'nueink://oauth-success' // Deep link to return to
      );

      console.log('OAuth result:', result);

      if (result.type === 'success') {
        Alert.alert(
          'Success',
          'Account connected! Your financial data will sync shortly.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else if (result.type === 'cancel') {
        Alert.alert('Cancelled', 'OAuth flow was cancelled');
      }
    } catch (error) {
      console.error('OAuth error:', error);
      Alert.alert(
        'Connection Error',
        error instanceof Error ? error.message : 'Failed to connect account'
      );
    } finally {
      setConnecting(null);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Connect Accounts',
          headerShown: true,
        }}
      />
      <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Connect your financial accounts to start syncing transactions
          </Text>
        </View>

      <View style={styles.providers}>
        {/* YNAB Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">YNAB</Text>
            <Text variant="bodyMedium" style={styles.description}>
              {ynabConnected
                ? 'Connected - syncs automatically every 4 hours'
                : 'Sync your budgets, accounts, and transactions from You Need A Budget'}
            </Text>
          </Card.Content>
          <Card.Actions>
            {ynabConnected ? (
              <Button
                mode="outlined"
                onPress={() => syncProvider('ynab')}
                disabled={syncing !== null || connecting !== null}
                loading={syncing === 'ynab'}
              >
                {syncing === 'ynab' ? 'Syncing...' : 'Sync Now'}
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={() => connectProvider('ynab')}
                disabled={connecting !== null || syncing !== null}
                loading={connecting === 'ynab'}
              >
                {connecting === 'ynab' ? 'Connecting...' : 'Connect YNAB'}
              </Button>
            )}
          </Card.Actions>
        </Card>

        {/* Plaid Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">Bank Accounts</Text>
            <Text variant="bodyMedium" style={styles.description}>
              Connect your bank accounts, credit cards, and investments via Plaid
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="outlined"
              onPress={() => connectProvider('plaid')}
              disabled={connecting !== null}
            >
              Coming Soon
            </Button>
          </Card.Actions>
        </Card>
      </View>

      {connecting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Opening {connecting.toUpperCase()}...</Text>
        </View>
      )}
      </Surface>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.7,
  },
  providers: {
    gap: 16,
  },
  card: {
    marginBottom: 16,
  },
  description: {
    marginTop: 8,
    opacity: 0.7,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#fff',
  },
});
