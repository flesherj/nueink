import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Surface, Text, Card, ActivityIndicator, FAB } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { useAccountProvider } from '@nueink/ui';
import { FinancialAccountApi } from '@nueink/sdk';
import type { FinancialAccount } from '@nueink/core';
import { RadialCategoryPicker } from '../../../components/RadialCategoryPicker';

// Create API client
const financialAccountApi = FinancialAccountApi.create();

export default function DashboardScreen() {
  const { account } = useAccountProvider();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test harness for RadialCategoryPicker
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['85%'], []);
  const [selectedCategories, setSelectedCategories] = useState<
    Array<{ category: string; amount: number }>
  >([
    // Pre-select all Housing categories for testing
    { category: 'Housing: Mortgage/Rent', amount: 5000 },
    { category: 'Housing: Utilities', amount: 2500 },
    { category: 'Housing: Insurance', amount: 2000 },
    { category: 'Housing: Maintenance', amount: 1500 },
    { category: 'Housing: Property Tax', amount: 1500 },
  ]);
  const testTransactionAmount = -12500; // $125.00 expense
  const testCurrency = 'USD';

  useEffect(() => {
    loadDashboardData();
  }, [account]);

  /**
   * Load all data needed for dashboard
   */
  const loadDashboardData = async () => {
    if (!account?.defaultOrgId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Loading dashboard data for organization:', account.defaultOrgId);

      // Load financial accounts to calculate total balance
      const accountsResult = await financialAccountApi.listByOrganization(account.defaultOrgId);
      setAccounts(accountsResult.items || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  /**
   * Calculate total balance across all accounts
   */
  const getTotalBalance = (): number => {
    return accounts.reduce((sum, acc) => {
      const balance = acc.balanceCurrent ?? 0;
      return sum + balance;
    }, 0);
  };

  /**
   * Format balance in cents to currency string
   */
  const formatBalance = (balance: number, currency: string = 'USD'): string => {
    const amount = balance / 100; // Convert cents to dollars
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Test handlers for RadialCategoryPicker
  const handleCategorySelect = useCallback((category: string) => {
    console.log('Category selected:', category);
    const absAmount = Math.abs(testTransactionAmount);

    const existing = selectedCategories.find(c => c.category === category);

    if (existing) {
      // Category already selected - deselect it
      console.log('Deselecting category:', category);
      setSelectedCategories(prev => prev.filter(c => c.category !== category));
    } else if (selectedCategories.length === 0) {
      // First category gets full amount
      setSelectedCategories([{ category, amount: absAmount }]);
    } else {
      // Add category with some of uncategorized amount
      setSelectedCategories(prev => [...prev, { category, amount: 0 }]);
    }
  }, [selectedCategories, testTransactionAmount]);

  const handleAmountChange = useCallback((category: string, amount: number) => {
    console.log('Amount changed:', category, amount);
    setSelectedCategories(prev =>
      prev.map(c => (c.category === category ? { ...c, amount } : c))
    );
  }, []);

  const getUncategorizedAmount = useCallback(() => {
    const totalAllocated = selectedCategories.reduce((sum, c) => sum + c.amount, 0);
    return Math.abs(testTransactionAmount) - totalAllocated;
  }, [selectedCategories, testTransactionAmount]);

  const handleClearAll = useCallback(() => {
    console.log('Clearing all categories');
    setSelectedCategories([]);
  }, []);

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

  if (loading) {
    return (
      <Surface style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
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
        </View>
      </Surface>
    );
  }

  const totalBalance = getTotalBalance();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Surface style={styles.container}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {/* What You Have Left Card */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  💰 What You Have Left
                </Text>
              </View>

              <Text variant="displayMedium" style={styles.balanceAmount}>
                {formatBalance(totalBalance)}
              </Text>

              <Text variant="bodyMedium" style={styles.subtitle}>
                Total across all accounts
              </Text>

              {accounts.length > 0 && (
                <View style={styles.accountsBreakdown}>
                  <Text variant="bodySmall" style={styles.breakdownTitle}>
                    {accounts.length} account{accounts.length !== 1 ? 's' : ''}:
                  </Text>
                  {accounts.slice(0, 3).map((acc) => (
                    <View key={acc.financialAccountId} style={styles.accountRow}>
                      <Text variant="bodySmall" style={styles.accountName}>
                        {acc.name}
                      </Text>
                      <Text variant="bodySmall" style={styles.accountBalance}>
                        {formatBalance(acc.balanceCurrent ?? 0)}
                      </Text>
                    </View>
                  ))}
                  {accounts.length > 3 && (
                    <Text variant="bodySmall" style={styles.moreAccounts}>
                      +{accounts.length - 3} more
                    </Text>
                  )}
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Coming Soon Cards */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.comingSoonTitle}>
                🚧 Coming Soon
              </Text>
              <Text variant="bodySmall" style={styles.comingSoonText}>
                • Upcoming bills detection{'\n'}
                • Available spending calculation{'\n'}
                • This month's pace{'\n'}
                • AI discovered patterns{'\n'}
                • Quick insights & suggestions
              </Text>
            </Card.Content>
          </Card>
        </ScrollView>

        {/* Test FAB for RadialCategoryPicker */}
        <FAB
          icon="palette"
          label="Test Categories"
          style={styles.fab}
          onPress={() => bottomSheetRef.current?.expand()}
        />

        {/* Test Bottom Sheet */}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.bottomSheetHandle}
        >
          <BottomSheetScrollView style={styles.bottomSheetContent}>
            <RadialCategoryPicker
              selectedCategories={selectedCategories}
              onCategorySelect={handleCategorySelect}
              onAmountChange={handleAmountChange}
              onClearAll={handleClearAll}
              getUncategorizedAmount={getUncategorizedAmount}
              transactionAmount={testTransactionAmount}
              transactionCurrency={testCurrency}
              formatAmount={formatBalance}
            />
          </BottomSheetScrollView>
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
    opacity: 0.7,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: '600',
  },
  balanceAmount: {
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.6,
    marginBottom: 16,
  },
  accountsBreakdown: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  breakdownTitle: {
    opacity: 0.6,
    marginBottom: 8,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  accountName: {
    flex: 1,
    opacity: 0.8,
  },
  accountBalance: {
    fontWeight: '600',
  },
  moreAccounts: {
    opacity: 0.5,
    fontStyle: 'italic',
    marginTop: 4,
  },
  comingSoonTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  comingSoonText: {
    opacity: 0.6,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  bottomSheetBackground: {
    backgroundColor: '#1a1a1a',
  },
  bottomSheetHandle: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  bottomSheetContent: {
    flex: 1,
    padding: 16,
  },
  bottomSheetTitle: {
    marginBottom: 4,
    fontWeight: '600',
  },
  bottomSheetSubtitle: {
    opacity: 0.6,
    marginBottom: 16,
  },
});
