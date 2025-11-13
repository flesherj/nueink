import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Surface, Text, Button, Card, ActivityIndicator } from 'react-native-paper';
import { useAccountProvider } from '@nueink/ui';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';

// OAuth configuration
// Client IDs are public and safe to expose in frontend
// Client secrets are stored in AWS Secrets Manager (backend only)
const OAUTH_CONFIG = {
  ynab: {
    authUrl: 'https://app.ynab.com/oauth/authorize',
    clientId: process.env.EXPO_PUBLIC_YNAB_CLIENT_ID || '',
    redirectUri: process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI || '',
  },
  plaid: {
    // Plaid uses Link SDK, different flow
    // TODO: Implement Plaid Link integration
  },
};

export default function ConnectAccountsScreen() {
  const { account } = useAccountProvider();
  const router = useRouter();
  const [connecting, setConnecting] = useState<string | null>(null);

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

      const config = OAUTH_CONFIG[provider];
      if (!config.clientId) {
        Alert.alert(
          'Configuration Error',
          'OAuth client ID not configured. Please add EXPO_PUBLIC_YNAB_CLIENT_ID to .env'
        );
        return;
      }

      // Build OAuth state: accountId:provider:organizationId
      const organizationId = account.defaultOrgId;
      const state = `${account.accountId}:${provider}:${organizationId}`;

      // Build OAuth URL
      const authUrl = `${config.authUrl}?${new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
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
    <Surface style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">Connect Accounts</Text>
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
              Sync your budgets, accounts, and transactions from You Need A Budget
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained"
              onPress={() => connectProvider('ynab')}
              disabled={connecting !== null}
              loading={connecting === 'ynab'}
            >
              {connecting === 'ynab' ? 'Connecting...' : 'Connect YNAB'}
            </Button>
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
