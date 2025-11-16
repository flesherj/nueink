import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import Slider from '@react-native-community/slider';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Surface, Text, Card, Chip, ActivityIndicator, Divider, List, TextInput, Button, Avatar, useTheme, IconButton } from 'react-native-paper';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useAccountProvider } from '@nueink/ui';
import { TransactionApi, TransactionSplitApi, CommentApi, FinancialAccountApi } from '@nueink/sdk';
import type { Transaction, TransactionSplit, Comment, FinancialAccount } from '@nueink/core';
import * as Clipboard from 'expo-clipboard';

// Create API clients
const transactionApi = TransactionApi.create();
const transactionSplitApi = TransactionSplitApi.create();
const commentApi = CommentApi.create();
const financialAccountApi = FinancialAccountApi.create();

// Common budget categories with icons
// Note: "Uncategorized" is handled separately as a read-only remainder
const CATEGORIES = [
  { name: 'Groceries', icon: 'cart' },
  { name: 'Dining Out', icon: 'silverware-fork-knife' },
  { name: 'Transportation', icon: 'car' },
  { name: 'Gas/Fuel', icon: 'gas-station' },
  { name: 'Entertainment', icon: 'movie' },
  { name: 'Shopping', icon: 'shopping' },
  { name: 'Bills', icon: 'file-document' },
  { name: 'Rent/Mortgage', icon: 'home' },
  { name: 'Utilities', icon: 'lightning-bolt' },
  { name: 'Healthcare', icon: 'medical-bag' },
  { name: 'Insurance', icon: 'shield-account' },
  { name: 'Savings', icon: 'piggy-bank' },
  { name: 'Income', icon: 'cash' },
  { name: 'Other', icon: 'dots-horizontal' },
];

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { account } = useAccountProvider();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [financialAccount, setFinancialAccount] = useState<FinancialAccount | null>(null);
  const [splits, setSplits] = useState<TransactionSplit[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Category selection bottom sheet state
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['85%'], []);
  const [splitMode, setSplitMode] = useState(false);
  // Store amounts as ABSOLUTE VALUES (positive) in cents for UI consistency
  const [selectedCategories, setSelectedCategories] = useState<Array<{ category: string; amount: number }>>([]);
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const savingRef = useRef(false);
  // Click-to-edit state
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editAmountInput, setEditAmountInput] = useState('');

  // Helper to get absolute transaction amount in cents
  const getAbsoluteAmount = useCallback(() => Math.abs(transaction?.amount || 0), [transaction]);

  // Helper to get category icon
  const getCategoryIcon = (categoryName: string): string => {
    const category = CATEGORIES.find(c => c.name === categoryName);
    return category?.icon || 'tag';
  };

  // Calculate uncategorized (unallocated) amount
  const getUncategorizedAmount = useCallback(() => {
    if (!transaction) return 0;
    const totalAllocated = selectedCategories.reduce((sum, c) => sum + c.amount, 0);
    return Math.abs(transaction.amount) - totalAllocated;
  }, [transaction, selectedCategories]);

  useEffect(() => {
    if (id) {
      loadTransactionDetail();
    }
  }, [id]);

  const loadTransactionDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setLoadingComments(true);
      setError(null);

      // Load transaction, splits, and comments in parallel
      const [txData, splitsData, commentsData] = await Promise.all([
        transactionApi.getTransaction(id),
        transactionSplitApi.listByTransaction(id),
        commentApi.listByTransaction(id),
      ]);

      setTransaction(txData);
      setSplits(splitsData);
      setComments(commentsData);

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
    } catch (err) {
      console.error('Error loading transaction detail:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transaction');
    } finally {
      setLoading(false);
      setLoadingComments(false);
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
   * Format date
   */
  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  /**
   * Add a comment to the transaction
   */
  const handleAddComment = async () => {
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
   * Open category selection bottom sheet
   */
  const handleOpenCategoryModal = useCallback(() => {
    console.log('Opening category modal...');

    // If splits exist, load them into selected categories for editing
    // Convert to ABSOLUTE VALUES for UI
    // Filter out "Uncategorized" - it's calculated automatically
    if (splits.length > 0) {
      console.log('Loading existing splits:', splits);
      const categorizedSplits = splits.filter((split) => split.category !== 'Uncategorized');
      setSelectedCategories(
        categorizedSplits.map((split) => ({
          category: split.category,
          amount: Math.abs(split.amount), // Store as positive
        }))
      );
      setSplitMode(categorizedSplits.length > 0);
    } else {
      setSplitMode(false);
      setSelectedCategories([]);
    }

    bottomSheetRef.current?.expand();
  }, [splits]);

  /**
   * Close category selection bottom sheet
   */
  const handleCloseCategoryModal = useCallback(() => {
    bottomSheetRef.current?.close();
    setSplitMode(false);
    setSelectedCategories([]);
  }, []);

  /**
   * Render backdrop for bottom sheet
   */
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  /**
   * Handle category selection
   * - First category: 100% split, close modal
   * - Additional categories: Enable split mode with sliders
   * Works with ABSOLUTE VALUES internally
   */
  const handleSelectCategory = async (categoryName: string) => {
    if (!transaction || !account) return;

    const absAmount = Math.abs(transaction.amount);

    // Check if this is the first category being selected (in the UI)
    if (selectedCategories.length === 0) {
      // First category - gets full amount
      const newCategories = [{ category: categoryName, amount: absAmount }];
      setSelectedCategories(newCategories);
      setSplitMode(false);

      // Auto-save immediately with new categories
      autoSaveSplits(newCategories);
    } else {
      // Additional category - enable split mode
      // Check if category is already in selectedCategories
      const exists = selectedCategories.find((c) => c.category === categoryName);
      if (exists) {
        // Remove it (toggle off)
        const remaining = selectedCategories.filter((c) => c.category !== categoryName);
        if (remaining.length > 0) {
          setSelectedCategories(remaining);
          autoSaveSplits(remaining);
        } else {
          setSelectedCategories([]);
          setSplitMode(false);
          autoSaveSplits([]);
        }
      } else {
        // Add new category starting at $0 (user will drag slider to allocate)
        // This preserves existing allocations
        const updatedCategories = [
          ...selectedCategories, // Keep existing amounts unchanged
          { category: categoryName, amount: 0 }, // New category starts at $0
        ];

        setSelectedCategories(updatedCategories);
        setSplitMode(true);
        autoSaveSplits(updatedCategories);
      }
    }
  };

  /**
   * Auto-save the current splits to the database
   * Converts absolute values back to signed values for storage
   * Creates an Uncategorized split for any remainder
   *
   * @param categoriesToSave - The categories to save (avoids stale closure issues)
   */
  const autoSaveSplits = useCallback(async (categoriesToSave?: Array<{ category: string; amount: number }>) => {
    const categories = categoriesToSave || selectedCategories;
    if (!transaction || !account || !categories) return;

    // Prevent concurrent saves
    if (savingRef.current) {
      console.log('Auto-save already in progress, skipping...');
      return;
    }

    try {
      savingRef.current = true;
      const absTransactionAmount = Math.abs(transaction.amount);
      const isNegative = transaction.amount < 0;

      // Calculate uncategorized amount from the categories we're saving
      const totalAllocated = categories.reduce((sum, c) => sum + c.amount, 0);
      const uncategorizedAmount = absTransactionAmount - totalAllocated;

      // Delete existing splits
      for (const split of splits) {
        await transactionSplitApi.delete(split.splitId);
      }

      // Create new splits - convert absolute values back to signed
      // Track total to ensure no rounding errors accumulate
      let totalAllocatedSigned = 0;
      const categoriesToCreate = categories.filter(c => c.amount > 0);

      for (let i = 0; i < categoriesToCreate.length; i++) {
        const category = categoriesToCreate[i];
        const isLast = i === categoriesToCreate.length - 1;

        let signedAmount: number;
        if (isLast && uncategorizedAmount === 0) {
          // Last category gets exact remainder to avoid rounding errors
          signedAmount = (isNegative ? -absTransactionAmount : absTransactionAmount) - totalAllocatedSigned;
        } else {
          signedAmount = isNegative ? -category.amount : category.amount;
          totalAllocatedSigned += signedAmount;
        }

        const percentage = (Math.abs(signedAmount) / absTransactionAmount) * 100;

        await transactionSplitApi.create({
          transactionId: transaction.transactionId,
          organizationId: account.defaultOrgId,
          category: category.category,
          amount: signedAmount,
          percentage,
          profileOwner: account.profileOwner,
        });
      }

      // Create Uncategorized split for remainder if any
      if (uncategorizedAmount > 0) {
        const percentage = (uncategorizedAmount / absTransactionAmount) * 100;
        const signedAmount = isNegative ? -uncategorizedAmount : uncategorizedAmount;

        await transactionSplitApi.create({
          transactionId: transaction.transactionId,
          organizationId: account.defaultOrgId,
          category: 'Uncategorized',
          amount: signedAmount,
          percentage,
          profileOwner: account.profileOwner,
        });
      }

      // Reload splits silently (no modal close, no alert)
      const updatedSplits = await transactionSplitApi.listByTransaction(transaction.transactionId);
      setSplits(updatedSplits);
    } catch (err) {
      console.error('Error auto-saving splits:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        fullError: JSON.stringify(err, null, 2),
      });
      // Silent fail - don't interrupt user workflow
    } finally {
      savingRef.current = false;
    }
  }, [transaction, account, selectedCategories, splits]);

  /**
   * Handle click-to-edit: Start editing a category amount
   */
  const handleStartEditAmount = (categoryName: string, currentAmount: number) => {
    setEditingCategory(categoryName);
    // Convert cents to dollars for input (e.g., 214 -> "2.14")
    setEditAmountInput((currentAmount / 100).toFixed(2));
  };

  /**
   * Handle click-to-edit: Save the edited amount
   */
  const handleSaveEditAmount = useCallback(() => {
    if (!editingCategory || !transaction) {
      setEditingCategory(null);
      return;
    }

    // Parse input as dollars and convert to cents
    const dollarValue = parseFloat(editAmountInput);

    if (isNaN(dollarValue) || dollarValue < 0) {
      // Invalid input - revert
      setEditingCategory(null);
      setEditAmountInput('');
      return;
    }

    const centsValue = Math.round(dollarValue * 100);
    const absTransactionAmount = Math.abs(transaction.amount);

    // Calculate max allowed (current amount + uncategorized)
    const currentCategory = selectedCategories.find(c => c.category === editingCategory);
    if (!currentCategory) {
      setEditingCategory(null);
      return;
    }

    const currentUncategorized = getUncategorizedAmount();
    const maxAllowed = currentCategory.amount + currentUncategorized;
    const clampedValue = Math.min(centsValue, maxAllowed);

    // Update categories
    const updatedCategories = selectedCategories.map(c =>
      c.category === editingCategory
        ? { ...c, amount: clampedValue }
        : c
    );

    setSelectedCategories(updatedCategories);
    setEditingCategory(null);
    setEditAmountInput('');

    // Auto-save with updated categories
    autoSaveSplits(updatedCategories);
  }, [editingCategory, editAmountInput, transaction, selectedCategories, getUncategorizedAmount, autoSaveSplits]);

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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
        {/* Transaction Header with Avatar */}
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
                  style={[styles.amount, { color: getAmountColor(transaction.amount) }]}
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

        {/* Category Splits - Grid View */}
        <TouchableOpacity onPress={handleOpenCategoryModal} activeOpacity={0.7}>
          <Card style={styles.card}>
            <Card.Content>
              {/* Allocation Progress Bar & Badge */}
              {(() => {
                const totalAmount = Math.abs(transaction.amount);
                const categorizedAmount = splits
                  .filter(s => s.category !== 'Uncategorized')
                  .reduce((sum, s) => sum + Math.abs(s.amount), 0);
                const percentage = totalAmount > 0 ? (categorizedAmount / totalAmount) * 100 : 0;
                const isFullyAllocated = percentage === 100;

                // Helper to get color for category
                const getCategoryColor = (category: string, index: number) => {
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

                // Calculate segment widths - categorized first, uncategorized last
                const sortedSplits = [
                  ...splits.filter(s => s.category !== 'Uncategorized'),
                  ...splits.filter(s => s.category === 'Uncategorized'),
                ];
                const segments = sortedSplits.map((split, index) => ({
                  category: split.category,
                  percentage: totalAmount > 0 ? (Math.abs(split.amount) / totalAmount) * 100 : 0,
                  color: getCategoryColor(split.category, index),
                }));

                return (
                  <View style={styles.allocationProgressContainer}>
                    {/* Segmented Progress Bar */}
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBackground}>
                        <View style={styles.segmentedProgressBar}>
                          {segments.map((segment, index) => (
                            <View
                              key={index}
                              style={[
                                styles.progressBarSegment,
                                {
                                  width: `${segment.percentage}%`,
                                  backgroundColor: segment.color,
                                },
                              ]}
                            />
                          ))}
                        </View>
                      </View>
                    </View>

                    {/* Allocation Badge */}
                    <View style={styles.allocationBadgeContainer}>
                      <Chip
                        mode="flat"
                        style={[
                          styles.allocationBadge,
                          isFullyAllocated && styles.allocationBadgeComplete
                        ]}
                        textStyle={styles.allocationBadgeText}
                        icon={isFullyAllocated ? 'check-circle' : 'chart-donut'}
                      >
                        {isFullyAllocated
                          ? 'Fully Allocated'
                          : `${Math.round(percentage)}% Allocated`
                        }
                      </Chip>
                      <Text variant="bodySmall" style={styles.allocationAmountText}>
                        {formatAmount(
                          transaction.amount < 0 ? -categorizedAmount : categorizedAmount,
                          transaction.currency || 'USD'
                        )} of {formatAmount(transaction.amount, transaction.currency || 'USD')}
                      </Text>
                    </View>

                    {/* Category Breakdown */}
                    <View style={styles.categoryBreakdownContainer}>
                      {segments.map((segment, index) => (
                        <View key={index} style={styles.categoryBreakdownItem}>
                          <View style={[styles.categoryColorDot, { backgroundColor: segment.color }]} />
                          <Text variant="bodySmall" style={styles.categoryBreakdownLabel}>
                            {segment.category}
                          </Text>
                          <Text variant="bodySmall" style={styles.categoryBreakdownAmount}>
                            {formatAmount(
                              sortedSplits[index].amount,
                              transaction.currency || 'USD'
                            )}
                          </Text>
                          <Text variant="bodySmall" style={styles.categoryBreakdownPercentage}>
                            {Math.round(segment.percentage)}%
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })()}
            </Card.Content>
          </Card>
        </TouchableOpacity>

        {/* Transaction Details */}
        <Card style={styles.card}>
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

            <List.Item
              title="Status"
              description={
                transaction.status === 'reconciled'
                  ? 'Reconciled'
                  : transaction.status === 'posted'
                  ? 'Posted'
                  : 'Pending'
              }
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={
                    transaction.status === 'reconciled'
                      ? 'check-all'
                      : transaction.status === 'posted'
                      ? 'check'
                      : 'clock-outline'
                  }
                />
              )}
            />

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

            <List.Item
              title="Transaction ID"
              description={transaction.transactionId}
              left={(props) => <List.Icon {...props} icon="database" />}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="content-copy"
                  onPress={async () => {
                    await Clipboard.setStringAsync(transaction.transactionId);
                    Alert.alert('Copied', 'Transaction ID copied to clipboard');
                  }}
                />
              )}
            />

            {transaction.externalTransactionId && (
              <List.Item
                title="External ID"
                description={transaction.externalTransactionId}
                left={(props) => <List.Icon {...props} icon="identifier" />}
                right={(props) => (
                  <IconButton
                    {...props}
                    icon="content-copy"
                    onPress={async () => {
                      await Clipboard.setStringAsync(transaction.externalTransactionId);
                      Alert.alert('Copied', 'External ID copied to clipboard');
                    }}
                  />
                )}
              />
            )}
          </Card.Content>
        </Card>

        {/* Comments */}
        <Card style={styles.card}>
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
                onPress={handleAddComment}
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
        <Card style={styles.card}>
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
        <Card style={styles.card}>
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

      {/* Category Selection Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetHandle}
      >
        <View style={styles.bottomSheetContent}>
          {/* Uncategorized Amount Display */}
          {selectedCategories.length > 0 && (
            <View style={styles.uncategorizedDisplay}>
              <View style={styles.uncategorizedRow}>
                <Text variant="titleSmall" style={styles.uncategorizedLabel}>
                  Uncategorized
                </Text>
                <Text variant="titleMedium" style={styles.uncategorizedAmount}>
                  {formatAmount(
                    transaction.amount < 0 ? -getUncategorizedAmount() : getUncategorizedAmount(),
                    transaction.currency || 'USD'
                  )}
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.uncategorizedDescription}>
                {getUncategorizedAmount() === 0
                  ? 'All allocated'
                  : 'Remaining unallocated amount'}
              </Text>
            </View>
          )}

          {/* Category Grid with inline sliders */}
          <BottomSheetScrollView
            style={styles.categoryScrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.categoryGrid}>
                {CATEGORIES.map((category) => {
                  const selectedCategory = selectedCategories.find(
                    (c) => c.category === category.name
                  );
                  const isSelected = !!selectedCategory;

                  return (
                    <View
                      key={category.name}
                      style={styles.categoryItemContainer}
                    >
                      <View
                        style={[
                          styles.categoryItem,
                          isSelected && styles.categoryItemSelected,
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.categoryButton}
                          onPress={() => handleSelectCategory(category.name)}
                          activeOpacity={0.7}
                        >
                          {isSelected && (
                            <View style={styles.checkmark}>
                              <IconButton icon="check" size={16} iconColor="#fff" />
                            </View>
                          )}
                          <Avatar.Icon
                            size={48}
                            icon={category.icon}
                            style={styles.categoryIcon}
                          />
                          <Text variant="bodySmall" style={styles.categoryName}>
                            {category.name}
                          </Text>

                          {/* Show amount for selected categories - convert to signed for display */}
                          {isSelected && selectedCategory && (
                            editingCategory === category.name ? (
                              <View style={styles.categoryAmountInputContainer}>
                                <RNTextInput
                                  value={editAmountInput}
                                  onChangeText={setEditAmountInput}
                                  keyboardType="decimal-pad"
                                  autoFocus
                                  onBlur={handleSaveEditAmount}
                                  onSubmitEditing={handleSaveEditAmount}
                                  style={styles.categoryAmountInput}
                                  placeholder="0.00"
                                  selectTextOnFocus
                                  placeholderTextColor="rgba(103, 80, 164, 0.4)"
                                />
                              </View>
                            ) : (
                              <TouchableOpacity
                                onPress={() => handleStartEditAmount(category.name, selectedCategory.amount)}
                                activeOpacity={0.7}
                              >
                                <Text variant="bodySmall" style={[styles.categoryAmount, styles.editableAmount]}>
                                  {formatAmount(
                                    transaction.amount < 0 ? -selectedCategory.amount : selectedCategory.amount,
                                    transaction.currency || 'USD'
                                  )}
                                </Text>
                              </TouchableOpacity>
                            )
                          )}
                        </TouchableOpacity>

                        {/* Inline slider - OUTSIDE TouchableOpacity */}
                        {isSelected && selectedCategory && (
                          <View style={styles.categorySliderContainer}>
                            <Slider
                              style={styles.categorySlider}
                              minimumValue={0}
                              maximumValue={(selectedCategory.amount + getUncategorizedAmount()) / 100}
                              step={0.01}
                              value={selectedCategory.amount / 100}
                              onSlidingStart={() => {
                                setDraggedCategory(selectedCategory.category);
                              }}
                              onValueChange={(value) => {
                                // Convert dollars to cents (keep as absolute/positive)
                                // Use Math.round instead of Math.floor to avoid precision issues
                                const centsValue = Math.round(value * 100);

                                // Clamp to prevent over-allocation
                                const currentUncategorized = getUncategorizedAmount();
                                const maxAllowed = selectedCategory.amount + currentUncategorized;
                                const clampedValue = Math.min(centsValue, maxAllowed);

                                setSelectedCategories(prev =>
                                  prev.map(c =>
                                    c.category === category.name
                                      ? { ...c, amount: clampedValue }
                                      : c
                                  )
                                );
                              }}
                              onSlidingComplete={(value) => {
                                // Convert dollars to cents and clamp to prevent over-allocation
                                // Use Math.round instead of Math.floor to avoid precision issues
                                const centsValue = Math.round(value * 100);
                                const currentUncategorized = getUncategorizedAmount();
                                const maxAllowed = selectedCategory.amount + currentUncategorized;
                                const clampedValue = Math.min(centsValue, maxAllowed);

                                // Update state
                                const updatedCategories = selectedCategories.map(c =>
                                  c.category === category.name
                                    ? { ...c, amount: clampedValue }
                                    : c
                                );
                                setSelectedCategories(updatedCategories);
                                setDraggedCategory(null);

                                // Auto-save immediately with updated categories
                                autoSaveSplits(updatedCategories);
                              }}
                              minimumTrackTintColor="rgba(103, 80, 164, 0.9)"
                              maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                              thumbTintColor="rgba(103, 80, 164, 1)"
                            />
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
            </View>
          </BottomSheetScrollView>
        </View>
      </BottomSheet>
      </Surface>
    </GestureHandlerRootView>
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
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    opacity: 0.7,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 12,
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
  // Allocation progress
  allocationProgressContainer: {
    marginBottom: 16,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  segmentedProgressBar: {
    flexDirection: 'row',
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarSegment: {
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
  },
  allocationBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  allocationBadge: {
    backgroundColor: 'rgba(103, 80, 164, 0.15)',
  },
  allocationBadgeComplete: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  allocationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  allocationAmountText: {
    opacity: 0.7,
    fontSize: 12,
  },
  categoryBreakdownContainer: {
    marginTop: 12,
    gap: 8,
  },
  categoryBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryBreakdownLabel: {
    flex: 1,
    fontSize: 13,
  },
  categoryBreakdownAmount: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryBreakdownPercentage: {
    fontSize: 13,
    opacity: 0.6,
    width: 40,
    textAlign: 'right',
  },
  // Category display
  categoryDisplayContainer: {
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  feedCategoryChipText: {
    fontSize: 13,
    paddingHorizontal: 2,
  },
  // Grid layout for categories
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingVertical: 8,
  },
  categoryGridItem: {
    alignItems: 'center',
    width: 70,
  },
  categoryGridIcon: {
    backgroundColor: 'rgba(103, 80, 164, 0.25)',
    marginBottom: 6,
  },
  categoryGridAmount: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(103, 80, 164, 1)',
  },
  bottomSheetBackground: {
    backgroundColor: '#1e1e1e',
  },
  bottomSheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  bottomSheetHandle: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  bottomSheetTitle: {
    color: '#fff',
    flex: 1,
  },
  saveButton: {
    marginLeft: 12,
  },
  uncategorizedDisplay: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  uncategorizedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  uncategorizedLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  uncategorizedAmount: {
    color: 'rgba(103, 80, 164, 1)',
    fontWeight: '700',
  },
  uncategorizedDescription: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  categoryScrollContainer: {
    maxHeight: 600,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  categoryItemContainer: {
    width: '30%',
    marginBottom: 16,
  },
  categoryItem: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  categoryItemSelected: {
    backgroundColor: 'rgba(103, 80, 164, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(103, 80, 164, 0.6)',
  },
  categoryButton: {
    alignItems: 'center',
    padding: 12,
    position: 'relative',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(103, 80, 164, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  categoryIcon: {
    marginBottom: 4,
    backgroundColor: 'rgba(103, 80, 164, 0.25)',
  },
  categoryName: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  categoryAmount: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(103, 80, 164, 1)',
    marginTop: 4,
  },
  editableAmount: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: 'rgba(103, 80, 164, 0.5)',
  },
  categoryAmountInputContainer: {
    marginTop: 4,
    alignItems: 'center',
  },
  categoryAmountInput: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    color: 'rgba(103, 80, 164, 1)',
    backgroundColor: 'rgba(103, 80, 164, 0.15)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(103, 80, 164, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 60,
    height: 24,
  },
  categorySliderContainer: {
    marginTop: -12,
    width: '100%',
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  categorySlider: {
    width: '100%',
    height: 40,
  },
});
