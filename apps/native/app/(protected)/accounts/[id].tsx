import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Surface, Text, Card, Chip, ActivityIndicator, Button, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { FinancialAccountApi, TransactionApi } from '@nueink/sdk';
import type { FinancialAccount, Transaction } from '@nueink/core';

// Create API clients
const financialAccountApi = FinancialAccountApi.create();
const transactionApi = TransactionApi.create();

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [account, setAccount] = useState<FinancialAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadAccountData();
    }
  }, [id]);

  /**
   * Load account details and recent transactions
   */
  const loadAccountData = async () => {
    if (!id) return;

    try {
      setError(null);
      console.log('Loading account:', id);

      // Load account details
      const accountData = await financialAccountApi.getAccount(id);
      console.log('Account loaded:', accountData);
      setAccount(accountData);

      // Load recent transactions for this account
      const txResult = await transactionApi.listByAccount(id, { limit: 50 });
      console.log('Transactions loaded:', txResult);
      setTransactions(txResult.items || []);
    } catch (err) {
      console.error('Error loading account data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load account');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAccountData();
    setRefreshing(false);
  };

  /**
   * Format balance in cents to currency string
   */
  const formatBalance = (balance?: number, currency: string = 'USD'): string => {
    if (balance === undefined || balance === null) return 'N/A';

    const amount = balance / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  /**
   * Format amount with sign (+ or -)
   */
  const formatAmount = (amount: number, currency: string = 'USD'): string => {
    const absAmount = Math.abs(amount) / 100;
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(absAmount);

    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
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

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <Surface style={styles.container}>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Loading account...</Text>
          </View>
        </Surface>
      </>
    );
  }

  if (error || !account) {
    return (
      <>
        <Stack.Screen options={{ title: 'Error' }} />
        <Surface style={styles.container}>
          <View style={styles.centerContent}>
            <Text variant="titleLarge" style={styles.errorText}>Error</Text>
            <Text style={styles.errorMessage}>{error || 'Account not found'}</Text>
            <Button mode="contained" onPress={loadAccountData} style={styles.retryButton}>
              Retry
            </Button>
          </View>
        </Surface>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: account.name }} />
      <Surface style={styles.container}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Account Summary */}
          <Card style={styles.summaryCard}>
            <Card.Content>
              <View style={styles.accountHeader}>
                <View>
                  <Text variant="headlineSmall">{account.name}</Text>
                  {account.officialName && account.officialName !== account.name && (
                    <Text variant="bodySmall" style={styles.officialName}>
                      {account.officialName}
                    </Text>
                  )}
                  {account.mask && (
                    <Text variant="bodyMedium" style={styles.mask}>
                      •••• {account.mask}
                    </Text>
                  )}
                </View>
                <Chip mode="outlined">{getAccountTypeLabel(account.type)}</Chip>
              </View>

              <Divider style={styles.divider} />

              {/* Current Balance */}
              {account.currentBalance !== undefined && (
                <View style={styles.balanceSection}>
                  <Text variant="bodySmall" style={styles.balanceLabel}>
                    Current Balance
                  </Text>
                  <Text
                    variant="displaySmall"
                    style={[
                      styles.balanceAmount,
                      account.currentBalance < 0 && styles.negativeBalance,
                    ]}
                  >
                    {formatBalance(account.currentBalance, account.currency)}
                  </Text>
                </View>
              )}

              {/* Available Balance */}
              {account.availableBalance !== undefined &&
               account.availableBalance !== account.currentBalance && (
                <View style={styles.balanceSection}>
                  <Text variant="bodySmall" style={styles.balanceLabel}>
                    Available Balance
                  </Text>
                  <Text variant="titleLarge" style={styles.balanceAmount}>
                    {formatBalance(account.availableBalance, account.currency)}
                  </Text>
                </View>
              )}

              {/* Last Sync */}
              {account.syncedAt && (
                <Text variant="bodySmall" style={styles.syncTime}>
                  Last synced: {new Date(account.syncedAt).toLocaleString()}
                </Text>
              )}
            </Card.Content>
          </Card>

          {/* Recent Transactions */}
          <View style={styles.transactionsSection}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Recent Transactions
            </Text>

            {transactions.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content>
                  <Text style={styles.emptyText}>No transactions found</Text>
                </Card.Content>
              </Card>
            ) : (
              transactions.map((tx) => (
                <Card
                  key={tx.transactionId}
                  style={styles.transactionCard}
                  onPress={() => router.push(`/transactions/${tx.transactionId}`)}
                >
                  <Card.Content>
                    <View style={styles.transactionRow}>
                      <View style={styles.transactionInfo}>
                        <Text variant="titleMedium">{tx.merchantName || 'Unknown'}</Text>
                        <Text variant="bodySmall" style={styles.transactionDate}>
                          {new Date(tx.date).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text
                        variant="titleMedium"
                        style={[
                          styles.transactionAmount,
                          tx.amount < 0 && styles.negativeAmount,
                          tx.amount >= 0 && styles.positiveAmount,
                        ]}
                      >
                        {formatAmount(tx.amount, account.currency)}
                      </Text>
                    </View>
                    {tx.category && (
                      <Chip mode="outlined" compact style={styles.categoryChip}>
                        {tx.category}
                      </Chip>
                    )}
                  </Card.Content>
                </Card>
              ))
            )}
          </View>
        </ScrollView>
      </Surface>
    </>
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
  summaryCard: {
    margin: 16,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  officialName: {
    marginTop: 4,
    opacity: 0.6,
  },
  mask: {
    marginTop: 8,
    opacity: 0.7,
  },
  divider: {
    marginVertical: 16,
  },
  balanceSection: {
    marginBottom: 16,
  },
  balanceLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  balanceAmount: {
    fontWeight: '600',
  },
  negativeBalance: {
    color: '#d32f2f',
  },
  syncTime: {
    marginTop: 8,
    opacity: 0.5,
  },
  transactionsSection: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  emptyCard: {
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  transactionCard: {
    marginBottom: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  transactionDate: {
    marginTop: 4,
    opacity: 0.6,
  },
  transactionAmount: {
    fontWeight: '600',
  },
  positiveAmount: {
    color: '#2e7d32',
  },
  negativeAmount: {
    color: '#d32f2f',
  },
  categoryChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
});
