import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Surface, Text, Card, Chip, ActivityIndicator, Button } from 'react-native-paper';
import { useAccountProvider } from '@nueink/ui';
import { useRouter } from 'expo-router';
import { FinancialAccountApi } from '@nueink/sdk';
import type { FinancialAccount } from '@nueink/core';

// Create API client (uses Amplify API with Cognito auth)
const financialAccountApi = FinancialAccountApi.create();

export default function AccountsScreen() {
  const { account } = useAccountProvider();
  const router = useRouter();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, [account]);

  /**
   * Load financial accounts for the user's organization
   */
  const loadAccounts = async () => {
    if (!account?.defaultOrgId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Loading accounts for organization:', account.defaultOrgId);

      // Call REST API - authenticated with Cognito credentials
      const result = await financialAccountApi.listByOrganization(account.defaultOrgId);

      console.log('Accounts loaded:', result);
      setAccounts(result.items || []);
    } catch (err) {
      console.error('Error loading accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAccounts();
    setRefreshing(false);
  };

  /**
   * Format balance in cents to currency string
   */
  const formatBalance = (balance?: number, currency: string = 'USD'): string => {
    if (balance === undefined || balance === null) return 'N/A';

    const amount = balance / 100; // Convert cents to dollars
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  /**
   * Get account type display label
   */
  const getAccountTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      checking: 'Checking',
      savings: 'Savings',
      creditCard: 'Credit Card',
      investment: 'Investment',
      loan: 'Loan',
      mortgage: 'Mortgage',
      other: 'Other',
    };
    return labels[type] || type;
  };

  /**
   * Get provider display name
   */
  const getProviderName = (provider: string): string => {
    const names: Record<string, string> = {
      ynab: 'YNAB',
      plaid: 'Bank',
    };
    return names[provider] || provider;
  };

  /**
   * Group accounts by provider
   */
  const groupedAccounts = accounts.reduce((groups, account) => {
    const provider = account.provider || 'other';
    if (!groups[provider]) {
      groups[provider] = [];
    }
    groups[provider].push(account);
    return groups;
  }, {} as Record<string, FinancialAccount[]>);

  if (loading) {
    return (
      <Surface style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading accounts...</Text>
        </View>
      </Surface>
    );
  }

  if (error) {
    return (
      <Surface style={styles.container}>
        <View style={styles.centerContent}>
          <Text variant="titleLarge" style={styles.errorText}>Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Button mode="contained" onPress={loadAccounts} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      </Surface>
    );
  }

  if (accounts.length === 0) {
    return (
      <Surface style={styles.container}>
        <View style={styles.centerContent}>
          <Text variant="titleLarge">No Accounts Found</Text>
          <Text style={styles.emptyText}>
            Connect a financial provider to start syncing your accounts
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/settings/connect-accounts')}
            style={styles.connectButton}
          >
            Connect Accounts
          </Button>
        </View>
      </Surface>
    );
  }

  return (
    <Surface style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text variant="headlineMedium">Financial Accounts</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {accounts.length} account{accounts.length !== 1 ? 's' : ''} synced
          </Text>
        </View>

        {Object.entries(groupedAccounts).map(([provider, providerAccounts]) => (
          <View key={provider} style={styles.providerGroup}>
            <View style={styles.providerHeader}>
              <Text variant="titleMedium">{getProviderName(provider)}</Text>
              <Chip mode="outlined">
                {providerAccounts.length} account{providerAccounts.length !== 1 ? 's' : ''}
              </Chip>
            </View>

            {providerAccounts.map((acc) => (
              <Card
                key={acc.financialAccountId}
                style={styles.accountCard}
                onPress={() => router.push(`/accounts/${acc.financialAccountId}`)}
              >
                <Card.Content>
                  <View style={styles.accountHeader}>
                    <View style={styles.accountInfo}>
                      <Text variant="titleMedium">{acc.name}</Text>
                      {acc.mask && (
                        <Text variant="bodySmall" style={styles.mask}>
                          •••• {acc.mask}
                        </Text>
                      )}
                    </View>
                    <Chip mode="outlined" compact>
                      {getAccountTypeLabel(acc.type)}
                    </Chip>
                  </View>

                  <View style={styles.balanceSection}>
                    {acc.currentBalance !== undefined && (
                      <View style={styles.balanceRow}>
                        <Text variant="bodyMedium" style={styles.balanceLabel}>
                          Balance:
                        </Text>
                        <Text
                          variant="titleLarge"
                          style={[
                            styles.balanceAmount,
                            acc.currentBalance < 0 && styles.negativeBalance,
                          ]}
                        >
                          {formatBalance(acc.currentBalance, acc.currency)}
                        </Text>
                      </View>
                    )}

                    {acc.availableBalance !== undefined &&
                     acc.availableBalance !== acc.currentBalance && (
                      <View style={styles.balanceRow}>
                        <Text variant="bodySmall" style={styles.balanceLabel}>
                          Available:
                        </Text>
                        <Text variant="bodyMedium" style={styles.balanceAmount}>
                          {formatBalance(acc.availableBalance, acc.currency)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {acc.syncedAt && (
                    <Text variant="bodySmall" style={styles.syncTime}>
                      Last synced: {new Date(acc.syncedAt).toLocaleString()}
                    </Text>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        ))}
      </ScrollView>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
  loadingText: {
    marginTop: 16,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.7,
  },
  retryButton: {
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    opacity: 0.7,
  },
  connectButton: {
    marginTop: 8,
  },
  providerGroup: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountCard: {
    marginBottom: 12,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  accountInfo: {
    flex: 1,
    marginRight: 8,
  },
  mask: {
    marginTop: 4,
    opacity: 0.6,
  },
  balanceSection: {
    marginTop: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  balanceLabel: {
    opacity: 0.7,
  },
  balanceAmount: {
    fontWeight: '600',
  },
  negativeBalance: {
    color: '#d32f2f',
  },
  syncTime: {
    marginTop: 12,
    opacity: 0.5,
  },
});
