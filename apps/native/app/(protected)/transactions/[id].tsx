import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput as RNTextInput,
} from 'react-native';
import Slider from '@react-native-community/slider';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Surface,
  Text,
  Card,
  Chip,
  ActivityIndicator,
  Divider,
  List,
  TextInput,
  Button,
  Avatar,
  useTheme,
  IconButton,
  SegmentedButtons,
} from 'react-native-paper';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useAccountProvider, CategorySpendingChart } from '@nueink/ui';
import { RadialCategoryPicker } from '../../../components/RadialCategoryPicker';
import {
  TransactionApi,
  TransactionSplitApi,
  CommentApi,
  FinancialAccountApi,
  AnalyticsApi,
} from '@nueink/sdk';
import type {
  Transaction,
  TransactionSplit,
  Comment,
  FinancialAccount,
  CategoryTimelineData,
} from '@nueink/core';
import * as Clipboard from 'expo-clipboard';

// Create API clients
const transactionApi = TransactionApi.create();
const transactionSplitApi = TransactionSplitApi.create();
const commentApi = CommentApi.create();
const financialAccountApi = FinancialAccountApi.create();
const analyticsApi = AnalyticsApi.create();

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
  const [financialAccount, setFinancialAccount] =
    useState<FinancialAccount | null>(null);
  const [splits, setSplits] = useState<TransactionSplit[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Analytics chart state
  const [chartData, setChartData] = useState<CategoryTimelineData[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [merchantFilterEnabled, setMerchantFilterEnabled] = useState(false);
  const [timePeriod, setTimePeriod] = useState<
    'week' | 'month' | 'quarter' | 'year'
  >('month');

  // Category selection bottom sheet state
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['85%'], []);
  const [splitMode, setSplitMode] = useState(false);
  // Store amounts as ABSOLUTE VALUES (positive) in cents for UI consistency
  const [selectedCategories, setSelectedCategories] = useState<
    Array<{ category: string; amount: number }>
  >([]);
  const savingRef = useRef(false);
  // Keep ref to current transaction to avoid stale closures
  const transactionRef = useRef<Transaction | null>(null);
  // Click-to-edit state
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editAmountInput, setEditAmountInput] = useState('');

  // Calculate uncategorized (unallocated) amount
  const getUncategorizedAmount = useCallback(() => {
    if (!transaction) return 0;
    const totalAllocated = selectedCategories.reduce(
      (sum, c) => sum + c.amount,
      0
    );
    return Math.abs(transaction.amount) - totalAllocated;
  }, [transaction, selectedCategories]);

  useEffect(() => {
    if (id) {
      loadTransactionDetail();
    }
  }, [id]);

  // Update transaction ref whenever transaction state changes
  useEffect(() => {
    transactionRef.current = transaction;
    console.log('[transactionRef] Updated:', {
      hasTransaction: !!transaction,
      transactionId: transaction?.transactionId,
    });
  }, [transaction]);

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
          const accountData = await financialAccountApi.getAccount(
            txData.financialAccountId
          );
          setFinancialAccount(accountData);
        } catch (err) {
          console.error('Error loading financial account:', err);
          // Don't fail the whole screen if account fetch fails
        }
      }

      // Analytics data will be loaded by the useEffect below
      // to ensure consistent state with merchant filter and time period
    } catch (err) {
      console.error('Error loading transaction detail:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load transaction'
      );
    } finally {
      setLoading(false);
      setLoadingComments(false);
    }
  };

  /**
   * Get date range based on selected time period and transaction date
   * Uses the transaction's date as the reference point, not current date
   */
  const getDateRange = useCallback(
    (
      period: 'week' | 'month' | 'quarter' | 'year'
    ): { startDate: Date; endDate: Date } => {
      // Use transaction date if available, otherwise fallback to current date
      const txDate = transaction ? new Date(transaction.date) : new Date();

      // Strategy pattern: map period types to their date calculation logic
      const dateRangeStrategies = {
        week: (date: Date) => {
          // Start of the week containing the transaction (Sunday)
          const startDate = new Date(date);
          startDate.setDate(date.getDate() - date.getDay());
          startDate.setHours(0, 0, 0, 0);
          // End of that week (Saturday)
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          return { startDate, endDate };
        },
        month: (date: Date) => {
          // Start of the month containing the transaction
          const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
          // End of that month
          const endDate = new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
          );
          return { startDate, endDate };
        },
        quarter: (date: Date) => {
          // Start of the quarter containing the transaction (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)
          const quarter = Math.floor(date.getMonth() / 3);
          const startDate = new Date(date.getFullYear(), quarter * 3, 1);
          // End of that quarter
          const endDate = new Date(
            date.getFullYear(),
            quarter * 3 + 3,
            0,
            23,
            59,
            59,
            999
          );
          return { startDate, endDate };
        },
        year: (date: Date) => {
          // Start of the year containing the transaction
          const startDate = new Date(date.getFullYear(), 0, 1);
          // End of that year
          const endDate = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
          return { startDate, endDate };
        },
      };

      return dateRangeStrategies[period](txDate);
    },
    [transaction]
  );

  /**
   * Load analytics timeline data for all categories
   * Shows spending context for all categorized splits
   */
  const loadAnalyticsData = useCallback(
    async (txData: Transaction, splitsData: TransactionSplit[]) => {
      if (!account) return;

      try {
        // Find all categorized splits (excluding Uncategorized)
        const categorizedSplits = splitsData.filter(
          (s) => s.category !== 'Uncategorized'
        );
        if (categorizedSplits.length === 0) {
          setChartData([]);
          return;
        }

        setChartLoading(true);
        setChartError(null);

        // Get date range based on selected time period
        const { startDate, endDate } = getDateRange(timePeriod);

        // Get merchant name if filter is enabled
        const merchantFilter = merchantFilterEnabled
          ? txData.merchantName || txData.name
          : undefined;

        console.log('📊 Loading analytics:', {
          transactionDate: txData.date,
          timePeriod,
          dateRange: { startDate, endDate },
          merchantFilterEnabled,
          merchantFilter,
          categories: categorizedSplits.map((s) => s.category),
        });

        // Fetch timeline data for all categories in parallel
        const timelinePromises = categorizedSplits.map((split) =>
          analyticsApi.getCategoryTimeline(
            account.defaultOrgId,
            split.category,
            startDate,
            endDate,
            txData.transactionId, // Highlight this transaction
            merchantFilter // Filter by merchant if enabled
          )
        );

        const timelines = await Promise.all(timelinePromises);
        setChartData(timelines);
      } catch (err) {
        console.error('Error loading analytics data:', err);
        setChartError(
          err instanceof Error
            ? err.message
            : 'Failed to load spending insights'
        );
      } finally {
        setChartLoading(false);
      }
    },
    [account, merchantFilterEnabled, timePeriod, analyticsApi, getDateRange]
  );

  /**
   * Reload analytics data when merchant filter or time period changes
   */
  useEffect(() => {
    if (transaction && splits.length > 0) {
      console.log('🔄 Reloading analytics:', {
        merchant: merchantFilterEnabled
          ? transaction.merchantName || transaction.name
          : 'ALL',
        period: timePeriod,
      });
      loadAnalyticsData(transaction, splits);
    }
  }, [
    merchantFilterEnabled,
    timePeriod,
    transaction,
    splits,
    loadAnalyticsData,
  ]);

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
   * Format date with time
   */
  const formatDateTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
      const categorizedSplits = splits.filter(
        (split) => split.category !== 'Uncategorized'
      );
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
   * Handle category selection for RadialCategoryPicker (toggle on/off)
   */
  const handleRadialCategorySelect = useCallback(
    (categoryName: string) => {
      setSelectedCategories((prev) => {
        const exists = prev.find((c) => c.category === categoryName);
        if (exists) {
          // Remove category (deselect) - save the removal
          const updated = prev.filter((c) => c.category !== categoryName);
          autoSaveSplits(updated);
          return updated;
        } else {
          // Add category with $0 initial amount - DON'T save yet!
          // User will drag to allocate amount, which triggers handleRadialAmountChange
          const updated = [...prev, { category: categoryName, amount: 0 }];
          return updated; // <-- No autoSaveSplits call!
        }
      });
    },
    [autoSaveSplits]
  );

  /**
   * Handle amount change for RadialCategoryPicker
   */
  const handleRadialAmountChange = useCallback(
    (categoryName: string, amount: number) => {
      console.log(`[handleRadialAmountChange] ${categoryName}: ${amount}`);
      setSelectedCategories((prev) => {
        if (amount <= 0) {
          // Remove category if amount is 0 or negative
          const updated = prev.filter((c) => c.category !== categoryName);
          console.log(
            '[handleRadialAmountChange] Calling autoSaveSplits with:',
            updated
          );
          autoSaveSplits(updated);
          return updated;
        }

        const existing = prev.find((c) => c.category === categoryName);
        const updated = existing
          ? prev.map((c) =>
              c.category === categoryName ? { ...c, amount } : c
            )
          : [...prev, { category: categoryName, amount }];

        console.log(
          '[handleRadialAmountChange] Calling autoSaveSplits with:',
          updated
        );
        autoSaveSplits(updated);
        return updated;
      });
    },
    [autoSaveSplits]
  );

  /**
   * Handle category selection (OLD GRID VERSION)
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
      const exists = selectedCategories.find(
        (c) => c.category === categoryName
      );
      if (exists) {
        // Remove it (toggle off)
        const remaining = selectedCategories.filter(
          (c) => c.category !== categoryName
        );
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
  const autoSaveSplits = useCallback(
    async (categoriesToSave?: Array<{ category: string; amount: number }>) => {
      const categories = categoriesToSave || selectedCategories;
      const currentTransaction = transactionRef.current; // Get current value from ref
      console.log('[autoSaveSplits] Called with categories:', categories);
      if (!currentTransaction || !account || !categories) {
        console.log('[autoSaveSplits] Missing required data:', {
          hasTransaction: !!currentTransaction,
          hasAccount: !!account,
          hasCategories: !!categories,
        });
        return;
      }

      // Filter out 0-amount categories - don't save empty splits
      const nonZeroCategories = categories.filter((c) => c.amount > 0);
      if (nonZeroCategories.length === 0 && categories.length > 0) {
        console.log(
          '[autoSaveSplits] All categories have 0 amount, skipping save'
        );
        return;
      }

      // Prevent concurrent saves
      if (savingRef.current) {
        console.log('Auto-save already in progress, skipping...');
        return;
      }

      try {
        savingRef.current = true;
        console.log('[autoSaveSplits] Starting save...');
        const absTransactionAmount = Math.abs(currentTransaction.amount);
        const isNegative = currentTransaction.amount < 0;

        // Calculate uncategorized amount from the categories we're saving (only non-zero)
        const totalAllocated = nonZeroCategories.reduce(
          (sum, c) => sum + c.amount,
          0
        );
        const uncategorizedAmount = absTransactionAmount - totalAllocated;

        // Build all splits to save (including Uncategorized if needed)
        // Convert absolute values back to signed
        let totalAllocatedSigned = 0;
        const categoriesToCreate = nonZeroCategories; // Already filtered above
        const allSplits: Omit<
          TransactionSplit,
          'splitId' | 'createdAt' | 'updatedAt'
        >[] = [];

        for (let i = 0; i < categoriesToCreate.length; i++) {
          const category = categoriesToCreate[i];
          const isLast = i === categoriesToCreate.length - 1;

          let signedAmount: number;
          if (isLast && uncategorizedAmount === 0) {
            // Last category gets exact remainder to avoid rounding errors
            signedAmount =
              (isNegative ? -absTransactionAmount : absTransactionAmount) -
              totalAllocatedSigned;
          } else {
            signedAmount = isNegative ? -category.amount : category.amount;
            totalAllocatedSigned += signedAmount;
          }

          const percentage =
            (Math.abs(signedAmount) / absTransactionAmount) * 100;

          allSplits.push({
            transactionId: currentTransaction.transactionId,
            organizationId: account.defaultOrgId,
            category: category.category,
            amount: signedAmount,
            percentage,
            profileOwner: account.profileOwner,
          });
        }

        // Add Uncategorized split for remainder if any
        if (uncategorizedAmount > 0) {
          const percentage = (uncategorizedAmount / absTransactionAmount) * 100;
          const signedAmount = isNegative
            ? -uncategorizedAmount
            : uncategorizedAmount;

          allSplits.push({
            transactionId: currentTransaction.transactionId,
            organizationId: account.defaultOrgId,
            category: 'Uncategorized',
            amount: signedAmount,
            percentage,
            profileOwner: account.profileOwner,
          });
        }

        // Update all splits in one call (automatically tracks feedback)
        console.log('[autoSaveSplits] Calling API with splits:', allSplits);
        const updatedSplits = await transactionSplitApi.updateTransactionSplits(
          currentTransaction.transactionId,
          account.accountId,
          currentTransaction.amount,
          allSplits
        );
        console.log('[autoSaveSplits] API returned splits:', updatedSplits);
        setSplits(updatedSplits);

        // Reload analytics data to reflect updated splits
        loadAnalyticsData(currentTransaction, updatedSplits);
        console.log('[autoSaveSplits] Save completed successfully');
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
    },
    [account, selectedCategories] // transaction is accessed via ref to avoid stale closures
  );

  /**
   * Handle click-to-edit: Start editing a category amount
   */
  const handleStartEditAmount = (
    categoryName: string,
    currentAmount: number
  ) => {
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
    const currentCategory = selectedCategories.find(
      (c) => c.category === editingCategory
    );
    if (!currentCategory) {
      setEditingCategory(null);
      return;
    }

    const currentUncategorized = getUncategorizedAmount();
    const maxAllowed = currentCategory.amount + currentUncategorized;
    const clampedValue = Math.min(centsValue, maxAllowed);

    // Update categories
    const updatedCategories = selectedCategories.map((c) =>
      c.category === editingCategory ? { ...c, amount: clampedValue } : c
    );

    setSelectedCategories(updatedCategories);
    setEditingCategory(null);
    setEditAmountInput('');

    // Auto-save with updated categories
    autoSaveSplits(updatedCategories);
  }, [
    editingCategory,
    editAmountInput,
    transaction,
    selectedCategories,
    getUncategorizedAmount,
    autoSaveSplits,
  ]);

  if (loading) {
    return (
      <Surface style={styles.container}>
        <Stack.Screen
          options={{ title: 'Transaction Details', headerBackTitle: 'Back' }}
        />
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
        <Stack.Screen
          options={{ title: 'Transaction Details', headerBackTitle: 'Back' }}
        />
        <View style={styles.centerContent}>
          <Text variant="titleLarge" style={styles.errorText}>
            Error
          </Text>
          <Text style={styles.errorMessage}>
            {error || 'Transaction not found'}
          </Text>
          <Button
            mode="contained"
            onPress={() => router.back()}
            style={styles.backButton}
          >
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
              {/* Transaction Date - Centered at top */}
              <Text variant="bodyMedium" style={styles.transactionDate}>
                {formatDateTime(transaction.date)}
              </Text>

              <View style={styles.headerContent}>
                <Avatar.Text
                  size={48}
                  label={getMerchantInitials(transaction.merchantName)}
                  style={styles.avatar}
                />
                <View style={styles.headerInfo}>
                  <Text variant="titleLarge" style={styles.merchantName}>
                    {transaction.merchantName ||
                      transaction.name ||
                      'Unknown Merchant'}
                  </Text>
                  <Text
                    variant="headlineMedium"
                    style={[
                      styles.amount,
                      { color: getAmountColor(transaction.amount) },
                    ]}
                  >
                    {formatAmount(
                      transaction.amount,
                      transaction.currency || 'USD'
                    )}
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
          <TouchableOpacity
            onPress={handleOpenCategoryModal}
            activeOpacity={0.7}
          >
            <Card style={styles.card}>
              <Card.Content>
                {/* Allocation Progress Bar & Badge */}
                {(() => {
                  const totalAmount = Math.abs(transaction.amount);
                  const categorizedAmount = splits
                    .filter((s) => s.category !== 'Uncategorized')
                    .reduce((sum, s) => sum + Math.abs(s.amount), 0);
                  const percentage =
                    totalAmount > 0
                      ? (categorizedAmount / totalAmount) * 100
                      : 0;
                  const isFullyAllocated = percentage === 100;

                  // Helper to get color for category
                  const getCategoryColor = (
                    category: string,
                    index: number
                  ) => {
                    if (category === 'Uncategorized') {
                      return 'rgba(128, 128, 128, 0.3)'; // Gray for uncategorized
                    }
                    // Color palette for categories
                    const colors = [
                      'rgba(103, 80, 164, 0.9)', // Purple
                      'rgba(142, 68, 173, 0.9)', // Dark purple
                      'rgba(155, 89, 182, 0.9)', // Light purple
                      'rgba(52, 152, 219, 0.9)', // Blue
                      'rgba(46, 204, 113, 0.9)', // Green
                      'rgba(241, 196, 15, 0.9)', // Yellow
                      'rgba(230, 126, 34, 0.9)', // Orange
                      'rgba(231, 76, 60, 0.9)', // Red
                    ];
                    return colors[index % colors.length];
                  };

                  // Calculate segment widths - categorized first, uncategorized last
                  const sortedSplits = [
                    ...splits.filter((s) => s.category !== 'Uncategorized'),
                    ...splits.filter((s) => s.category === 'Uncategorized'),
                  ];
                  const segments = sortedSplits.map((split, index) => ({
                    category: split.category,
                    percentage:
                      totalAmount > 0
                        ? (Math.abs(split.amount) / totalAmount) * 100
                        : 0,
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
                            isFullyAllocated && styles.allocationBadgeComplete,
                          ]}
                          textStyle={styles.allocationBadgeText}
                          icon={
                            isFullyAllocated ? 'check-circle' : 'chart-donut'
                          }
                        >
                          {isFullyAllocated
                            ? 'Fully Allocated'
                            : `${Math.round(percentage)}% Allocated`}
                        </Chip>
                        <Text
                          variant="bodySmall"
                          style={styles.allocationAmountText}
                        >
                          {formatAmount(
                            transaction.amount < 0
                              ? -categorizedAmount
                              : categorizedAmount,
                            transaction.currency || 'USD'
                          )}{' '}
                          of{' '}
                          {formatAmount(
                            transaction.amount,
                            transaction.currency || 'USD'
                          )}
                        </Text>
                      </View>

                      {/* Category Breakdown */}
                      <View style={styles.categoryBreakdownContainer}>
                        {segments.map((segment, index) => (
                          <View
                            key={index}
                            style={styles.categoryBreakdownItem}
                          >
                            <View
                              style={[
                                styles.categoryColorDot,
                                { backgroundColor: segment.color },
                              ]}
                            />
                            <Text
                              variant="bodySmall"
                              style={styles.categoryBreakdownLabel}
                            >
                              {segment.category}
                            </Text>
                            <Text
                              variant="bodySmall"
                              style={styles.categoryBreakdownAmount}
                            >
                              {formatAmount(
                                sortedSplits[index].amount,
                                transaction.currency || 'USD'
                              )}
                            </Text>
                            <Text
                              variant="bodySmall"
                              style={styles.categoryBreakdownPercentage}
                            >
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

          {/* Spending Insights Chart */}
          {splits.some((s) => s.category !== 'Uncategorized') && (
            <Card style={styles.card}>
              <Card.Content>
                {/* Merchant Filter */}
                <SegmentedButtons
                  value={merchantFilterEnabled ? 'merchant' : 'all'}
                  onValueChange={(value) =>
                    setMerchantFilterEnabled(value === 'merchant')
                  }
                  buttons={[
                    {
                      value: 'all',
                      label: 'All Merchants',
                      style: styles.segmentedButton,
                    },
                    {
                      value: 'merchant',
                      label:
                        transaction?.merchantName ||
                        transaction?.name ||
                        'This Merchant',
                      style: styles.segmentedButton,
                    },
                  ]}
                  style={styles.merchantFilterToggle}
                />

                {/* Time Period Selector */}
                <SegmentedButtons
                  value={timePeriod}
                  onValueChange={(value) =>
                    setTimePeriod(value as typeof timePeriod)
                  }
                  buttons={[
                    { value: 'week', label: 'Week' },
                    { value: 'month', label: 'Month' },
                    { value: 'quarter', label: 'Quarter' },
                    { value: 'year', label: 'Year' },
                  ]}
                  style={styles.timePeriodToggle}
                />

                {/* Chart Loading State */}
                {chartLoading && (
                  <View style={[styles.chartLoadingContainer, { height: 250 }]}>
                    <ActivityIndicator size="small" />
                    <Text style={styles.chartLoadingText}>
                      Loading spending insights...
                    </Text>
                  </View>
                )}

                {/* Chart Error State */}
                {chartError && !chartLoading && (
                  <View style={[styles.chartErrorContainer, { height: 250 }]}>
                    <Text variant="bodySmall" style={styles.chartErrorText}>
                      {chartError}
                    </Text>
                  </View>
                )}

                {/* Chart */}
                {!chartLoading && !chartError && chartData.length > 0 && (
                  <CategorySpendingChart
                    data={chartData}
                    height={250}
                    showBudget={false}
                    timePeriod={timePeriod}
                  />
                )}
              </Card.Content>
            </Card>
          )}

          {/* Transaction Details */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Details
              </Text>

              <List.Item
                title="Date"
                description={formatDate(transaction.date)}
                left={(props) => <List.Icon {...props} icon="calendar" />}
              />

              {transaction.authorizedDate &&
                transaction.authorizedDate !== transaction.date && (
                  <List.Item
                    title="Authorized Date"
                    description={formatDate(transaction.authorizedDate)}
                    left={(props) => (
                      <List.Icon {...props} icon="calendar-check" />
                    )}
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
                  onPress={() =>
                    router.push(
                      `/accounts/${financialAccount.financialAccountId}`
                    )
                  }
                  right={(props) => (
                    <List.Icon {...props} icon="chevron-right" />
                  )}
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
                      Alert.alert(
                        'Copied',
                        'Transaction ID copied to clipboard'
                      );
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
                        await Clipboard.setStringAsync(
                          transaction.externalTransactionId
                        );
                        Alert.alert(
                          'Copied',
                          'External ID copied to clipboard'
                        );
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
                  <Text style={styles.loadingCommentsText}>
                    Loading comments...
                  </Text>
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
                            label={comment.accountId
                              .substring(0, 2)
                              .toUpperCase()}
                            style={styles.commentAvatar}
                          />
                          <View style={styles.commentMeta}>
                            <Text
                              variant="bodySmall"
                              style={styles.commentAuthor}
                            >
                              {comment.accountId === account?.accountId
                                ? 'You'
                                : comment.accountId}
                            </Text>
                            <Text
                              variant="bodySmall"
                              style={styles.commentDate}
                            >
                              {new Date(comment.createdAt).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                }
                              )}
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
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Person Assignment
              </Text>
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
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Receipts
              </Text>
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
            <BottomSheetScrollView
              style={styles.categoryScrollContainer}
              showsVerticalScrollIndicator={false}
            >
              <RadialCategoryPicker
                selectedCategories={selectedCategories}
                onCategorySelect={handleRadialCategorySelect}
                onAmountChange={handleRadialAmountChange}
                onClearAll={() => {
                  setSelectedCategories([]);
                  autoSaveSplits([]);
                }}
                getUncategorizedAmount={getUncategorizedAmount}
                transactionAmount={transaction.amount}
                transactionCurrency={transaction.currency || 'USD'}
                formatAmount={formatAmount}
              />
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
  transactionDate: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 12,
    fontWeight: '500',
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
  // Chart time period and merchant filter toggles
  merchantFilterToggle: {
    marginBottom: 8,
  },
  timePeriodToggle: {
    marginBottom: 12,
  },
  segmentedButton: {
    minWidth: 120,
  },
  // Chart loading/error states
  chartLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  chartLoadingText: {
    opacity: 0.7,
  },
  chartErrorContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  chartErrorText: {
    textAlign: 'center',
    opacity: 0.7,
    color: '#d32f2f',
  },
});
