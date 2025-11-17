import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Surface, Text, Card, Chip, ActivityIndicator, Button } from 'react-native-paper';
import { useAccountProvider } from '@nueink/ui';
import { useRouter } from 'expo-router';
import { FinancialAccountApi, IntegrationApi } from '@nueink/sdk';
import type { FinancialAccount, IntegrationConfig } from '@nueink/core';

// Create API clients (uses Amplify API with Cognito auth)
const financialAccountApi = FinancialAccountApi.create();
const integrationApi = IntegrationApi.create();

export default function AccountsScreen() {
  const { account } = useAccountProvider();
  const router = useRouter();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, [account]);

  /**
   * Load financial accounts and integration status for the user's organization
   */
  const loadAccounts = async () => {
    if (!account?.defaultOrgId || !account?.accountId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Loading accounts for organization:', account.defaultOrgId);

      // Fetch both accounts and integration status in parallel
      const [accountsResult, integrationsResult] = await Promise.all([
        financialAccountApi.listByOrganization(account.defaultOrgId),
        integrationApi.listByAccount(account.accountId),
      ]);

      console.log('Accounts loaded:', accountsResult);
      console.log('Integrations loaded:', integrationsResult);

      setAccounts(accountsResult.items || []);
      setIntegrations(integrationsResult || []);
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

    // Start polling to pick up sync status changes
    // Poll every 3 seconds for up to 60 seconds to catch sync completion
    let pollCount = 0;
    const pollInterval = setInterval(async () => {
      pollCount++;
      await loadAccounts();

      // Stop after 20 checks (60 seconds)
      if (pollCount >= 20) {
        clearInterval(pollInterval);
      }
    }, 3000);
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
   * Get sync status for a provider
   */
  const getProviderSyncStatus = (provider: string): IntegrationConfig | undefined => {
    return integrations.find(
      (integration) => integration.provider === provider && integration.status === 'active'
    );
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

        {Object.entries(groupedAccounts).map(([provider, providerAccounts]) => {
          const syncStatus = getProviderSyncStatus(provider);
          const isSyncing = syncStatus?.syncInProgress;

          return (
            <View key={provider} style={styles.providerGroup}>
              <View style={styles.providerHeader}>
                <View style={styles.providerInfo}>
                  <Text variant="titleMedium">{getProviderName(provider)}</Text>
                  {isSyncing && (
                    <View style={styles.syncingBadge}>
                      <ActivityIndicator size={14} />
                      <Text variant="bodySmall" style={styles.syncingText}>
                        Syncing...
                      </Text>
                    </View>
                  )}
                  {!isSyncing && syncStatus?.syncedAt && (
                    <Text variant="bodySmall" style={styles.lastSyncText}>
                      Last synced: {new Date(syncStatus.syncedAt).toLocaleTimeString()}
                    </Text>
                  )}
                </View>
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
          );
        })}
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  providerInfo: {
    flex: 1,
    marginRight: 12,
  },
  syncingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  syncingText: {
    marginLeft: 6,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  lastSyncText: {
    marginTop: 2,
    opacity: 0.5,
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
