import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Surface, Text, Card, Chip, ActivityIndicator, Button, Avatar, Divider, List, useTheme, TextInput, IconButton } from 'react-native-paper';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useAccountProvider } from '@nueink/ui';
import { TransactionApi, FinancialAccountApi, CommentApi } from '@nueink/sdk';
import type { Transaction, FinancialAccount, Comment } from '@nueink/core';

// Create API clients
const transactionApi = TransactionApi.create();
const financialAccountApi = FinancialAccountApi.create();
const commentApi = CommentApi.create();

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { account } = useAccountProvider();
  const router = useRouter();
  const theme = useTheme();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [financialAccount, setFinancialAccount] = useState<FinancialAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadTransaction();
  }, [id]);

  /**
   * Load transaction details
   */
  const loadTransaction = async () => {
    if (!id) {
      setError('No transaction ID provided');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Loading transaction:', id);

      const txData = await transactionApi.getTransaction(id);
      setTransaction(txData);

      // Load associated financial account if available
      if (txData.financialAccountId) {
        try {
          const accountData = await financialAccountApi.getAccount(txData.financialAccountId);
          setFinancialAccount(accountData);
        } catch (err) {
          console.error('Error loading financial account:', err);
          // Don't fail the whole screen if account fetch fails
        }
      }

      // Load comments for this transaction
      loadComments();
    } catch (err) {
      console.error('Error loading transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transaction');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load comments for the transaction
   */
  const loadComments = async () => {
    if (!id) return;

    try {
      setLoadingComments(true);
      console.log('Loading comments for transaction:', id);

      const commentData = await commentApi.listByTransaction(id);
      setComments(commentData);
    } catch (err) {
      console.error('Error loading comments:', err);
      // Don't fail the whole screen if comments fail to load
    } finally {
      setLoadingComments(false);
    }
  };

  /**
   * Add a new comment to the transaction
   */
  const addComment = async () => {
    if (!newCommentText.trim()) {
      Alert.alert('Error', 'Comment text cannot be empty');
      return;
    }

    if (!account || !transaction) {
      Alert.alert('Error', 'Account or transaction not loaded');
      return;
    }

    try {
      setSubmittingComment(true);
      console.log('Adding comment to transaction:', id);

      const newComment = await commentApi.create({
        transactionId: id!,
        accountId: account.accountId,
        organizationId: account.defaultOrgId,
        text: newCommentText.trim(),
        profileOwner: account.profileOwner,
      });

      // Add new comment to the list
      setComments([...comments, newComment]);
      setNewCommentText('');

      Alert.alert('Success', 'Comment added successfully');
    } catch (err) {
      console.error('Error adding comment:', err);
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to add comment'
      );
    } finally {
      setSubmittingComment(false);
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
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  /**
   * Format time for display
   */
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
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

  if (loading) {
    return (
      <Surface style={styles.container}>
        <Stack.Screen options={{ title: 'Transaction Details', headerBackTitle: 'Back' }} />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading transaction...</Text>
        </View>
      </Surface>
    );
  }

  if (error || !transaction) {
    return (
      <Surface style={styles.container}>
        <Stack.Screen options={{ title: 'Transaction Details', headerBackTitle: 'Back' }} />
        <View style={styles.centerContent}>
          <Text variant="titleLarge" style={styles.errorText}>Error</Text>
          <Text style={styles.errorMessage}>{error || 'Transaction not found'}</Text>
          <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
            Go Back
          </Button>
        </View>
      </Surface>
    );
  }

  return (
    <Surface style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Transaction Details',
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.onSurface,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Card with Merchant and Amount */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerContent}>
              <Avatar.Text
                size={64}
                label={getMerchantInitials(transaction.merchantName)}
                style={styles.avatar}
              />
              <View style={styles.headerInfo}>
                <Text variant="headlineSmall" style={styles.merchantName}>
                  {transaction.merchantName || transaction.name || 'Unknown Merchant'}
                </Text>
                <Text
                  variant="displaySmall"
                  style={[
                    styles.amount,
                    { color: getAmountColor(transaction.amount) },
                  ]}
                >
                  {formatAmount(transaction.amount, transaction.currency || 'USD')}
                </Text>
              </View>
            </View>

            {/* Pending Badge */}
            {transaction.pending && (
              <Chip mode="outlined" style={styles.pendingChip}>
                Pending Transaction
              </Chip>
            )}
          </Card.Content>
        </Card>

        {/* Transaction Details */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Details</Text>

            <List.Item
              title="Date"
              description={formatDate(transaction.date)}
              left={(props) => <List.Icon {...props} icon="calendar" />}
            />

            {transaction.authorizedDate && transaction.authorizedDate !== transaction.date && (
              <List.Item
                title="Authorized Date"
                description={formatDate(transaction.authorizedDate)}
                left={(props) => <List.Icon {...props} icon="calendar-check" />}
              />
            )}

            <Divider />

            {transaction.primaryCategory && (
              <List.Item
                title="Category"
                description={transaction.primaryCategory}
                left={(props) => <List.Icon {...props} icon="tag" />}
              />
            )}

            {transaction.category && transaction.category.length > 0 && (
              <View style={styles.categoryChips}>
                {transaction.category.map((cat, index) => (
                  <Chip key={index} mode="outlined" style={styles.categoryChip}>
                    {cat}
                  </Chip>
                ))}
              </View>
            )}

            <Divider />

            {financialAccount ? (
              <List.Item
                title="Account"
                description={`${financialAccount.name} ${financialAccount.mask ? `(${financialAccount.mask})` : ''}`}
                left={(props) => <List.Icon {...props} icon="bank" />}
                onPress={() => router.push(`/accounts/${financialAccount.financialAccountId}`)}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
              />
            ) : (
              <List.Item
                title="Account"
                description="Loading..."
                left={(props) => <List.Icon {...props} icon="bank" />}
              />
            )}

            {transaction.notes && (
              <>
                <Divider />
                <List.Item
                  title="Notes"
                  description={transaction.notes}
                  left={(props) => <List.Icon {...props} icon="note-text" />}
                />
              </>
            )}

            <Divider />

            <List.Item
              title="Provider"
              description={transaction.provider.toUpperCase()}
              left={(props) => <List.Icon {...props} icon="cloud" />}
            />

            {transaction.externalTransactionId && (
              <List.Item
                title="External ID"
                description={transaction.externalTransactionId}
                left={(props) => <List.Icon {...props} icon="identifier" />}
              />
            )}
          </Card.Content>
        </Card>

        {/* Comments Section */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Comments ({comments.length})
            </Text>

            {loadingComments ? (
              <View style={styles.loadingCommentsContainer}>
                <ActivityIndicator size="small" />
                <Text style={styles.loadingCommentsText}>Loading comments...</Text>
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.emptyCommentsContainer}>
                <Text style={styles.emptyCommentsText}>
                  No comments yet. Be the first to add a comment!
                </Text>
              </View>
            ) : (
              <View style={styles.commentsList}>
                {comments.map((comment, index) => (
                  <View key={comment.commentId}>
                    {index > 0 && <Divider style={styles.commentDivider} />}
                    <View style={styles.commentItem}>
                      <View style={styles.commentHeader}>
                        <Avatar.Text
                          size={32}
                          label={comment.accountId.substring(0, 2).toUpperCase()}
                          style={styles.commentAvatar}
                        />
                        <View style={styles.commentMeta}>
                          <Text variant="bodySmall" style={styles.commentAuthor}>
                            {comment.accountId === account?.accountId ? 'You' : comment.accountId}
                          </Text>
                          <Text variant="bodySmall" style={styles.commentDate}>
                            {new Date(comment.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                      </View>
                      <Text variant="bodyMedium" style={styles.commentText}>
                        {comment.text}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Add Comment Input */}
            <Divider style={styles.addCommentDivider} />
            <View style={styles.addCommentContainer}>
              <TextInput
                mode="outlined"
                placeholder="Add a comment..."
                value={newCommentText}
                onChangeText={setNewCommentText}
                multiline
                numberOfLines={3}
                style={styles.commentInput}
                disabled={submittingComment}
              />
              <Button
                mode="contained"
                icon="send"
                onPress={addComment}
                loading={submittingComment}
                disabled={submittingComment || !newCommentText.trim()}
                style={styles.addCommentButton}
              >
                {submittingComment ? 'Adding...' : 'Add Comment'}
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Person Assignment Section (Placeholder) */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Person Assignment</Text>
            <View style={styles.placeholderSection}>
              <Text style={styles.placeholderText}>
                {transaction.personId
                  ? `Assigned to: ${transaction.personId}`
                  : 'This transaction is not assigned to anyone yet.'}
              </Text>
              <Button
                mode="outlined"
                icon="account-plus"
                onPress={() => console.log('Assign person - coming soon')}
                style={styles.placeholderButton}
                disabled
              >
                Assign Person (Coming Soon)
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Receipts Section (Placeholder) */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Receipts</Text>
            <View style={styles.placeholderSection}>
              <Text style={styles.placeholderText}>
                {transaction.receiptUrls && transaction.receiptUrls.length > 0
                  ? `${transaction.receiptUrls.length} receipt(s) attached`
                  : 'No receipts attached yet.'}
              </Text>
              <Button
                mode="outlined"
                icon="camera-plus"
                onPress={() => console.log('Add receipt - coming soon')}
                style={styles.placeholderButton}
                disabled
              >
                Add Receipt (Coming Soon)
              </Button>
            </View>
          </Card.Content>
        </Card>
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
  backButton: {
    marginTop: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  merchantName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  amount: {
    fontWeight: '700',
  },
  pendingChip: {
    alignSelf: 'flex-start',
  },
  detailsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  placeholderSection: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  placeholderText: {
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.7,
  },
  placeholderButton: {
    marginTop: 8,
  },
  loadingCommentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingCommentsText: {
    opacity: 0.7,
  },
  emptyCommentsContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyCommentsText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  commentsList: {
    marginTop: 8,
  },
  commentDivider: {
    marginVertical: 12,
  },
  commentItem: {
    paddingVertical: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    marginRight: 8,
  },
  commentMeta: {
    flex: 1,
  },
  commentAuthor: {
    fontWeight: '600',
  },
  commentDate: {
    opacity: 0.6,
    marginTop: 2,
  },
  commentText: {
    marginLeft: 40,
    lineHeight: 20,
  },
  addCommentDivider: {
    marginTop: 16,
    marginBottom: 12,
  },
  addCommentContainer: {
    gap: 12,
  },
  commentInput: {
    minHeight: 80,
  },
  addCommentButton: {
    alignSelf: 'flex-end',
  },
});
