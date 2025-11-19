import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Animated } from 'react-native';
import { Surface, Text, Card, ActivityIndicator, FAB } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAccountProvider } from '@nueink/ui';
import { FinancialAccountApi } from '@nueink/sdk';
import type { FinancialAccount } from '@nueink/core';
import { CategoryCircle } from '../../../components/CategoryCircle';

// Create API client
const financialAccountApi = FinancialAccountApi.create();

export default function DashboardScreen() {
  const { account } = useAccountProvider();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test harness for CategoryCircle
  const [selectedCategories, setSelectedCategories] = useState<
    Array<{ category: string; amount: number }>
  >([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editAmountInput, setEditAmountInput] = useState('');
  const testTransactionAmount = -12500; // $125.00 expense
  const testCurrency = 'USD';

  // Test categories to render
  const testCategories = [
    { category: 'Housing: Mortgage/Rent', emoji: '🏠' },
    { category: 'Housing: Utilities', emoji: '💡' },
    { category: 'Housing: Insurance', emoji: '🛡️' },
    { category: 'Housing: Maintenance', emoji: '🔧' },
    { category: 'Housing: Property Tax', emoji: '🏛️' },
  ];

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

  // Test handlers for CategoryCircle
  const handleCategorySelect = useCallback((category: string) => {
    console.log('Category selected:', category);
    const existing = selectedCategories.find(c => c.category === category);

    if (existing) {
      // Deselect
      setSelectedCategories(prev => prev.filter(c => c.category !== category));
    } else {
      // Select with 0 amount (will be set by drag)
      setSelectedCategories(prev => [...prev, { category, amount: 0 }]);
    }
  }, [selectedCategories]);

  const handleAmountChange = useCallback((category: string, amount: number) => {
    console.log('Amount changed:', category, amount);
    setSelectedCategories(prev =>
      prev.map(c => (c.category === category ? { ...c, amount } : c))
    );
  }, []);

  const getAvailableForCategory = useCallback((category: string) => {
    const otherCategoriesTotal = selectedCategories
      .filter(c => c.category !== category)
      .reduce((sum, c) => sum + c.amount, 0);
    return Math.abs(testTransactionAmount) - otherCategoriesTotal;
  }, [selectedCategories, testTransactionAmount]);

  const handleStartEdit = useCallback((category: string, amount: number) => {
    setEditingCategory(category);
    setEditAmountInput((amount / 100).toFixed(2));
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingCategory) return;
    const dollarValue = parseFloat(editAmountInput);
    if (!isNaN(dollarValue) && dollarValue >= 0) {
      const centsValue = Math.round(dollarValue * 100);
      handleAmountChange(editingCategory, centsValue);
    }
    setEditingCategory(null);
    setEditAmountInput('');
  }, [editingCategory, editAmountInput, handleAmountChange]);

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

          {/* CategoryCircle Test Area */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.comingSoonTitle}>
                🧪 CategoryCircle Test
              </Text>
              <Text variant="bodySmall" style={styles.comingSoonText}>
                Transaction: {formatBalance(testTransactionAmount, testCurrency)}{'\n'}
                Selected: {selectedCategories.length} categories
              </Text>

              {/* Test circles in a grid layout */}
              <View style={styles.circleTestContainer}>
                {testCategories.map((cat, index) => {
                  const selectedCategory = selectedCategories.find(
                    s => s.category === cat.category
                  );

                  // Position in a circle pattern
                  const angle = (index / testCategories.length) * 2 * Math.PI - Math.PI / 2;
                  const radius = 120;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;

                  return (
                    <Animated.View
                      key={cat.category}
                      style={{
                        transform: [{ translateX: x }, { translateY: y }],
                      }}
                    >
                      <CategoryCircle
                        category={cat.category}
                        emoji={cat.emoji}
                        amount={selectedCategory?.amount}
                        transactionAmount={testTransactionAmount}
                        transactionCurrency={testCurrency}
                        onCategorySelect={handleCategorySelect}
                        onAmountChange={handleAmountChange}
                        formatAmount={formatBalance}
                        getAvailableForCategory={getAvailableForCategory}
                        editingCategory={editingCategory}
                        editAmountInput={editAmountInput}
                        onStartEdit={handleStartEdit}
                        onSaveEdit={handleSaveEdit}
                        setEditAmountInput={setEditAmountInput}
                      />
                    </Animated.View>
                  );
                })}
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
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
    marginBottom: 16,
  },
  circleTestContainer: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
});
