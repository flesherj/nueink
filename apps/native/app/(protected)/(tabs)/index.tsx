import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Surface, Text, Card, Chip, ActivityIndicator, Button, Avatar, IconButton } from 'react-native-paper';
import { useAccountProvider } from '@nueink/ui';
import { useRouter } from 'expo-router';
import { TransactionApi, CommentApi, TransactionSplitApi } from '@nueink/sdk';
import type { Transaction, TransactionSplit } from '@nueink/core';

// Create API clients
const transactionApi = TransactionApi.create();
const commentApi = CommentApi.create();
const transactionSplitApi = TransactionSplitApi.create();

export default function TransactionsFeedScreen() {
  const { account } = useAccountProvider();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [transactionSplits, setTransactionSplits] = useState<Record<string, TransactionSplit[]>>({});

  useEffect(() => {
    loadTransactions();
  }, [account]);

  /**
   * Load transactions for the user's organization
   */
  const loadTransactions = async (nextCursor?: string) => {
    if (!account?.defaultOrgId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Loading transactions for organization:', account.defaultOrgId);

      // Call REST API - authenticated with Cognito credentials
      const result = await transactionApi.listByOrganization(account.defaultOrgId, {
        limit: 50,
        cursor: nextCursor,
      });

      console.log('Transactions loaded:', result);

      if (nextCursor) {
        // Append to existing transactions (pagination)
        setTransactions((prev) => [...prev, ...(result.items || [])]);
      } else {
        // Replace transactions (initial load or refresh)
        setTransactions(result.items || []);
      }

      setCursor(result.nextCursor);
      setHasMore(!!result.nextCursor);

      // Load comment counts and splits for the new transactions
      const txIds = (result.items || []).map((tx) => tx.transactionId);
      if (txIds.length > 0) {
        loadCommentCounts(txIds);
        loadTransactionSplits(txIds);
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  /**
   * Load more transactions (pagination)
   */
  const loadMore = async () => {
    if (!loading && hasMore && cursor) {
      await loadTransactions(cursor);
    }
  };

  /**
   * Load comment counts for visible transactions
   */
  const loadCommentCounts = async (txIds: string[]) => {
    try {
      // Load comments for each transaction and count them
      const counts: Record<string, number> = {};

      // Load in parallel
      await Promise.all(
        txIds.map(async (txId) => {
          try {
            const comments = await commentApi.listByTransaction(txId);
            counts[txId] = comments.length;
          } catch (err) {
            console.error(`Error loading comments for transaction ${txId}:`, err);
            counts[txId] = 0;
          }
        })
      );

      setCommentCounts((prev) => ({ ...prev, ...counts }));
    } catch (err) {
      console.error('Error loading comment counts:', err);
    }
  };

  /**
   * Load transaction splits for visible transactions
   */
  const loadTransactionSplits = async (txIds: string[]) => {
    try {
      // Load splits for each transaction
      const splits: Record<string, TransactionSplit[]> = {};

      // Load in parallel
      await Promise.all(
        txIds.map(async (txId) => {
          try {
            const txSplits = await transactionSplitApi.listByTransaction(txId);
            splits[txId] = txSplits;
          } catch (err) {
            console.error(`Error loading splits for transaction ${txId}:`, err);
            splits[txId] = [];
          }
        })
      );

      setTransactionSplits((prev) => ({ ...prev, ...splits }));
    } catch (err) {
      console.error('Error loading transaction splits:', err);
    }
  };

  /**
   * Format amount with sign and color
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
   * Get amount color based on value
   */
  const getAmountColor = (amount: number): string => {
    return amount >= 0 ? '#2e7d32' : '#d32f2f'; // green for income, red for expense
  };

  /**
   * Group transactions by date
   */
  const groupTransactionsByDate = (txs: Transaction[]): { date: string; transactions: Transaction[] }[] => {
    const groups: Record<string, { dateKey: string; timestamp: number; transactions: Transaction[] }> = {};

    txs.forEach((tx) => {
      const txDate = new Date(tx.date);
      const dateKey = txDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateKey,
          timestamp: txDate.getTime(),
          transactions: [],
        };
      }
      groups[dateKey].transactions.push(tx);
    });

    // Sort groups by date (most recent first)
    return Object.values(groups)
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(({ dateKey, transactions }) => ({
        date: dateKey,
        // Sort transactions within each group (most recent first)
        transactions: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      }));
  };

  /**
   * Get merchant initials for avatar
   */
  const getMerchantInitials = (name?: string): string => {
    if (!name) return '?';

    const words = name.split(' ').filter((w) => w.length > 0);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();

    return (words[0][0] + words[1][0]).toUpperCase();
  };

  /**
   * Render a single transaction card
   */
  const renderTransaction = (tx: Transaction) => (
    <Card
      key={tx.transactionId}
      style={styles.transactionCard}
      onPress={() => router.push(`/transactions/${tx.transactionId}`)}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.transactionRow}>
          {/* Avatar */}
          <Avatar.Text
            size={48}
            label={getMerchantInitials(tx.merchantName)}
            style={styles.avatar}
          />

          {/* Transaction Info */}
          <View style={styles.transactionInfo}>
            <View style={styles.merchantRow}>
              <Text variant="titleMedium" style={styles.merchantName}>
                {tx.merchantName || 'Unknown Merchant'}
              </Text>
              {tx.pending && (
                <Chip mode="outlined" compact style={styles.pendingChip}>
                  Pending
                </Chip>
              )}
            </View>

            {/* Categories from splits */}
            <View style={styles.metaRow}>
              {(transactionSplits[tx.transactionId] || []).map((split, index) => (
                <Chip
                  key={split.splitId}
                  mode="outlined"
                  style={[styles.categoryChip, index > 0 && styles.categoryChipSpacing]}
                  textStyle={styles.categoryChipText}
                >
                  {split.category}
                </Chip>
              ))}
            </View>
            {tx.financialAccountId && (
              <Text variant="bodySmall" style={styles.accountText}>
                {/* TODO: Show account name instead of ID */}
                {tx.financialAccountId.substring(0, 20)}...
              </Text>
            )}

            {/* Notes (if any) */}
            {tx.notes && (
              <Text variant="bodySmall" style={styles.notes}>
                {tx.notes}
              </Text>
            )}
          </View>

          {/* Amount */}
          <View style={styles.amountContainer}>
            <Text
              variant="titleLarge"
              style={[
                styles.amount,
                { color: getAmountColor(tx.amount) },
              ]}
            >
              {formatAmount(tx.amount, tx.currency || 'USD')}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <View style={styles.commentButton}>
            <IconButton
              icon="comment-outline"
              size={20}
              onPress={() => router.push(`/transactions/${tx.transactionId}`)}
            />
            {(commentCounts[tx.transactionId] || 0) > 0 && (
              <Text variant="bodySmall" style={styles.commentCount}>
                {commentCounts[tx.transactionId]}
              </Text>
            )}
          </View>
          <IconButton
            icon="account-outline"
            size={20}
            onPress={() => router.push(`/transactions/${tx.transactionId}`)}
          />
        </View>
      </Card.Content>
    </Card>
  );

  /**
   * Render date group header and transactions
   */
  const renderDateGroup = ({ item }: { item: { date: string; transactions: Transaction[] } }) => (
    <View style={styles.dateGroup}>
      <View style={styles.dateHeader}>
        <Text variant="titleMedium" style={styles.dateText}>
          {item.date}
        </Text>
        <Chip mode="outlined" compact>
          {item.transactions.length} transaction{item.transactions.length !== 1 ? 's' : ''}
        </Chip>
      </View>
      {item.transactions.map((tx) => renderTransaction(tx))}
    </View>
  );

  if (loading && transactions.length === 0) {
    return (
      <Surface style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
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
          <Button mode="contained" onPress={loadTransactions} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      </Surface>
    );
  }

  if (transactions.length === 0) {
    return (
      <Surface style={styles.container}>
        <View style={styles.centerContent}>
          <Text variant="titleLarge">No Transactions Yet</Text>
          <Text style={styles.emptyText}>
            Your transactions will appear here after syncing your accounts
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

  const groupedData = groupTransactionsByDate(transactions);

  return (
    <Surface style={styles.container}>
      <FlatList
        data={groupedData}
        renderItem={renderDateGroup}
        keyExtractor={(item) => item.date}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore && !loading ? (
            <View style={styles.footer}>
              <ActivityIndicator />
              <Text style={styles.loadingMore}>Loading more...</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
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
  listContent: {
    paddingBottom: 16,
  },
  dateGroup: {
    marginTop: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  dateText: {
    fontWeight: '600',
  },
  transactionCard: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  cardContent: {
    paddingBottom: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  merchantName: {
    flex: 1,
    fontWeight: '600',
  },
  pendingChip: {
    marginLeft: 8,
    height: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  categoryChip: {
    // Let chip size naturally
  },
  categoryChipSpacing: {
    marginLeft: 4,
  },
  categoryChipText: {
    fontSize: 13,
    paddingHorizontal: 2,
  },
  accountText: {
    opacity: 0.6,
    marginTop: 4,
  },
  notes: {
    marginTop: 8,
    opacity: 0.7,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 4,
    marginLeft: 48, // Align with content after avatar
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
  },
  commentCount: {
    marginLeft: -4,
    opacity: 0.7,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingMore: {
    marginTop: 8,
    opacity: 0.6,
  },
});
