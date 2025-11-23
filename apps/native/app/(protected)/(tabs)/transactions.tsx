import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Surface, Text, Card, Chip, ActivityIndicator, Button, Avatar, IconButton } from 'react-native-paper';
import { useAccountProvider } from '@nueink/ui';
import { useRouter, useFocusEffect } from 'expo-router';
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

  // Refresh data when screen comes into focus (e.g., returning from transaction details)
  useFocusEffect(
    useCallback(() => {
      if (account?.defaultOrgId) {
        // Silently refresh without showing loading state
        loadTransactions();
      }
    }, [account?.defaultOrgId])
  );

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
   * Format relative timestamp
   */
  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const txDate = new Date(date);
    const diffMs = now.getTime() - txDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Same day
    if (diffDays === 0) {
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m`;
      return `${diffHours}h`;
    }

    // Yesterday
    if (diffDays === 1) {
      const time = txDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      return `Yesterday ${time}`;
    }

    // This year
    const isSameYear = txDate.getFullYear() === now.getFullYear();
    const monthDay = txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const hour = txDate.getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

    if (isSameYear) {
      return `${monthDay} • ${timeOfDay}`;
    }

    // Past years
    return `${monthDay} ${txDate.getFullYear()} • ${timeOfDay}`;
  };

  /**
   * Format date separator label (WhatsApp style)
   */
  const getDateSeparatorLabel = (transactions: Transaction[]): string => {
    if (transactions.length === 0) return '';

    const date = new Date(transactions[0].date);
    const now = new Date();

    // Reset time to midnight for accurate day comparison
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.floor((nowOnly.getTime() - dateOnly.getTime()) / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';

    // This year - just show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    }

    // Past years - show full date
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  /**
   * Calculate allocation percentage for a transaction
   */
  const getAllocationPercentage = (splits: TransactionSplit[], totalAmount: number): number => {
    const categorizedAmount = splits
      .filter(s => s.category !== 'Uncategorized')
      .reduce((sum, s) => sum + Math.abs(s.amount), 0);
    return totalAmount > 0 ? (categorizedAmount / totalAmount) * 100 : 0;
  };

  /**
   * Get color for category segment
   */
  const getCategoryColor = (category: string, index: number): string => {
    if (category === 'Uncategorized') {
      return 'rgba(128, 128, 128, 0.3)'; // Gray for uncategorized
    }
    // Color palette for categories
    const colors = [
      'rgba(103, 80, 164, 0.9)',   // Purple
      'rgba(142, 68, 173, 0.9)',   // Dark purple
      'rgba(155, 89, 182, 0.9)',   // Light purple
      'rgba(52, 152, 219, 0.9)',   // Blue
      'rgba(46, 204, 113, 0.9)',   // Green
      'rgba(241, 196, 15, 0.9)',   // Yellow
      'rgba(230, 126, 34, 0.9)',   // Orange
      'rgba(231, 76, 60, 0.9)',    // Red
    ];
    return colors[index % colors.length];
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
          {/* Avatar with Person Badge */}
          <View style={styles.avatarContainer}>
            <Avatar.Text
              size={40}
              label={getMerchantInitials(tx.merchantName)}
              style={styles.avatar}
            />
            {/* Person Badge - TODO: Show actual person when assigned */}
            <Avatar.Text
              size={16}
              label=""
              style={styles.personBadge}
            />
          </View>

          {/* Transaction Info */}
          <View style={styles.transactionInfo}>
            <View style={styles.merchantRow}>
              <Text variant="titleMedium" style={styles.merchantName}>
                {tx.merchantName || 'Unknown Merchant'}
              </Text>
              {tx.pending && (
                <Chip mode="outlined" compact style={styles.pendingChip} textStyle={styles.pendingChipText}>
                  Pending
                </Chip>
              )}
            </View>

            {/* Allocation Display */}
            {(() => {
              const splits = transactionSplits[tx.transactionId] || [];
              const totalAmount = Math.abs(tx.amount);
              const percentage = getAllocationPercentage(splits, totalAmount);
              const isFullyAllocated = percentage === 100;
              const hasNoCategories = splits.filter(s => s.category !== 'Uncategorized').length === 0;

              // Calculate segment data - categorized first, uncategorized last
              const sortedSplits = [
                ...splits.filter(s => s.category !== 'Uncategorized'),
                ...splits.filter(s => s.category === 'Uncategorized'),
              ];
              const segments = sortedSplits.map((split, index) => ({
                category: split.category,
                percentage: totalAmount > 0 ? (Math.abs(split.amount) / totalAmount) * 100 : 0,
                color: getCategoryColor(split.category, index),
              }));

              // Show different views based on allocation status
              if (hasNoCategories) {
                // Unallocated - show simple chip
                return (
                  <View style={styles.metaRow}>
                    <Chip mode="outlined" textStyle={styles.categoryChipText}>
                      Uncategorized
                    </Chip>
                  </View>
                );
              } else if (isFullyAllocated) {
                // Fully allocated - clean minimal view
                return (
                  <View style={styles.metaRow}>
                    <View style={styles.allocatedChip}>
                      <Text variant="bodySmall" style={styles.allocatedChipText}>
                        ✓ Allocated
                      </Text>
                    </View>
                  </View>
                );
              } else {
                // Partially allocated - show segmented progress bar
                return (
                  <View style={styles.metaRow}>
                    <View style={styles.miniProgressBarContainer}>
                      <View style={styles.miniProgressBarBackground}>
                        <View style={styles.miniSegmentedProgressBar}>
                          {segments.map((segment, index) => (
                            <View
                              key={index}
                              style={[
                                styles.miniProgressBarSegment,
                                {
                                  width: `${segment.percentage}%`,
                                  backgroundColor: segment.color,
                                },
                              ]}
                            />
                          ))}
                        </View>
                      </View>
                      <Text variant="bodySmall" style={styles.miniProgressPercentage}>
                        {Math.round(percentage)}%
                      </Text>
                    </View>
                  </View>
                );
              }
            })()}

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

        {/* Timestamp and Comments */}
        <View style={styles.actionRow}>
          <Text variant="bodySmall" style={styles.timestamp}>
            {getRelativeTime(tx.date)}
          </Text>
          {(commentCounts[tx.transactionId] || 0) > 0 && (
            <View style={styles.commentButton}>
              <IconButton
                icon="comment-outline"
                size={14}
                onPress={() => router.push(`/transactions/${tx.transactionId}`)}
              />
              <Text variant="bodySmall" style={styles.commentCount}>
                {commentCounts[tx.transactionId]}
              </Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  /**
   * Render date group header and transactions (WhatsApp style)
   */
  const renderDateGroup = ({ item }: { item: { date: string; transactions: Transaction[] } }) => (
    <View style={styles.dateGroup}>
      {/* WhatsApp-style date pill */}
      <View style={styles.datePillContainer}>
        <View style={styles.datePill}>
          <Text variant="bodySmall" style={styles.datePillText}>
            {getDateSeparatorLabel(item.transactions)}
          </Text>
        </View>
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
    marginTop: 8,
  },
  datePillContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  datePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  datePillText: {
    fontSize: 12,
    opacity: 0.6,
    fontWeight: '500',
  },
  transactionCard: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  cardContent: {
    paddingBottom: 4,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    // Avatar styling
  },
  personBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    borderWidth: 2,
    borderColor: '#1a1a1a', // Match card background
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
    height: 22,
    opacity: 0.7,
  },
  pendingChipText: {
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  allocatedChip: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  allocatedChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(76, 175, 80, 1)',
  },
  miniProgressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: 200,
  },
  miniProgressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniSegmentedProgressBar: {
    flexDirection: 'row',
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressBarSegment: {
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
  },
  miniProgressPercentage: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
    minWidth: 32,
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
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 52, // Align with content after avatar container
    gap: 8,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.5,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  commentCount: {
    marginLeft: -8,
    fontSize: 11,
    opacity: 0.6,
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
