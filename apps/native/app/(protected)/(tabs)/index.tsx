import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Surface, Text, Card, ActivityIndicator, Button } from 'react-native-paper';
import { useAccountProvider, CategoryPieChart } from '@nueink/ui';
import { FinancialAccountApi, FinancialAnalysisApi, BudgetApi } from '@nueink/sdk';
import type { FinancialAccount, FinancialAnalysis, Budget } from '@nueink/core';

// Create API clients
const financialAccountApi = FinancialAccountApi.create();
const financialAnalysisApi = FinancialAnalysisApi.create();
const budgetApi = BudgetApi.create();

export default function DashboardScreen() {
  const { account } = useAccountProvider();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Financial analysis state
  const [analysis, setAnalysis] = useState<FinancialAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Budget creation state
  const [createdBudget, setCreatedBudget] = useState<Budget | null>(null);
  const [creatingBudget, setCreatingBudget] = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);

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

  /**
   * Analyze spending with AI
   */
  const handleAnalyzeSpending = async () => {
    if (!account?.defaultOrgId || !account?.accountId) return;

    try {
      setAnalyzing(true);
      setAnalysisError(null);
      console.log('Analyzing spending for organization:', account.defaultOrgId);

      const result = await financialAnalysisApi.analyzeSpending(
        account.defaultOrgId,
        account.accountId,
        3 // Last 3 months
      );

      setAnalysis(result);
      console.log('Analysis complete:', result);
    } catch (err) {
      console.error('Error analyzing spending:', err);
      setAnalysisError(err instanceof Error ? err.message : 'Failed to analyze spending');
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * Create baseline budget from current analysis
   */
  const handleCreateBudget = async () => {
    if (!account?.defaultOrgId || !account?.accountId) return;

    try {
      setCreatingBudget(true);
      setBudgetError(null);
      console.log('Creating budget from analysis...');

      const result = await budgetApi.createFromAnalysis({
        organizationId: account.defaultOrgId,
        accountId: account.accountId,
        periodMonths: 3, // Same as analysis
      });

      setCreatedBudget(result.budget);
      console.log('Budget created:', result.budget);
    } catch (err) {
      console.error('Error creating budget:', err);
      setBudgetError(err instanceof Error ? err.message : 'Failed to create budget');
    } finally {
      setCreatingBudget(false);
    }
  };

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
    <Surface style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Financial Discovery Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                🔍 Financial Discovery
              </Text>
            </View>

            {!analysis && !analyzing && (
              <>
                <Text variant="bodyMedium" style={styles.subtitle}>
                  Let AI analyze your spending patterns and discover insights
                </Text>
                <Button
                  mode="contained"
                  onPress={handleAnalyzeSpending}
                  style={styles.analyzeButton}
                  disabled={!account?.defaultOrgId}
                >
                  Analyze My Spending
                </Button>
              </>
            )}

            {analyzing && (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>Analyzing your spending...</Text>
              </View>
            )}

            {analysisError && (
              <Text variant="bodyMedium" style={styles.errorText}>
                {analysisError}
              </Text>
            )}

            {analysis && !analyzing && (
              <View>
                <Text variant="bodyMedium" style={styles.subtitle}>
                  Analysis of last 3 months
                </Text>

                <Text variant="displaySmall" style={styles.balanceAmount}>
                  {formatBalance(analysis.totalSpending)}
                </Text>
                <Text variant="bodySmall" style={styles.subtitle}>
                  Total spending
                </Text>

                {/* Pie Chart */}
                {analysis.spendingByCategory.length > 0 && (
                  <CategoryPieChart
                    data={analysis.spendingByCategory}
                    topN={7}
                  />
                )}

                {/* All Categories */}
                <View style={styles.categorySection}>
                  <Text variant="titleSmall" style={styles.sectionTitle}>
                    All Spending Categories ({analysis.spendingByCategory.length})
                  </Text>
                  {analysis.spendingByCategory.map((cat) => (
                    <View key={cat.category} style={styles.categoryRow}>
                      <Text variant="bodyMedium" style={styles.categoryName}>
                        {cat.category}
                      </Text>
                      <View style={styles.categoryAmounts}>
                        <Text variant="bodyMedium" style={styles.categoryAmount}>
                          {formatBalance(cat.amount)}
                        </Text>
                        <Text variant="bodySmall" style={styles.categoryPercent}>
                          {cat.percentage.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* AI Insights */}
                {(analysis as any).insights && (analysis as any).insights.length > 0 && (
                  <View style={styles.insightsSection}>
                    <Text variant="titleSmall" style={styles.sectionTitle}>
                      🤖 AI Insights
                    </Text>
                    {(analysis as any).insights.map((insight: string, idx: number) => (
                      <Text key={idx} variant="bodySmall" style={styles.insightText}>
                        • {insight}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Create Budget Section */}
                {!createdBudget && (
                  <View style={styles.budgetSection}>
                    <Text variant="titleSmall" style={styles.sectionTitle}>
                      💰 Ready to Create Your Budget?
                    </Text>
                    <Text variant="bodySmall" style={styles.subtitle}>
                      We'll create a baseline budget based on your current spending patterns
                    </Text>
                    <Button
                      mode="contained"
                      onPress={handleCreateBudget}
                      style={styles.createBudgetButton}
                      loading={creatingBudget}
                      disabled={creatingBudget}
                    >
                      {creatingBudget ? 'Creating Budget...' : 'Create Baseline Budget'}
                    </Button>
                    {budgetError && (
                      <Text variant="bodySmall" style={styles.errorText}>
                        {budgetError}
                      </Text>
                    )}
                  </View>
                )}

                {/* Budget Created Success */}
                {createdBudget && (
                  <View style={styles.budgetSuccessSection}>
                    <Text variant="titleSmall" style={styles.successTitle}>
                      ✅ Budget Created!
                    </Text>
                    <Text variant="bodyMedium" style={styles.budgetName}>
                      {createdBudget.name}
                    </Text>
                    <Text variant="bodySmall" style={styles.subtitle}>
                      Total Budget: {formatBalance(createdBudget.totalBudget)}
                    </Text>
                    <Text variant="bodySmall" style={styles.subtitle}>
                      {createdBudget.categoryBudgets.length} categories • Status: {createdBudget.status}
                    </Text>
                  </View>
                )}

                <Button
                  mode="outlined"
                  onPress={handleAnalyzeSpending}
                  style={styles.reanalyzeButton}
                >
                  Re-analyze
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

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
  analyzeButton: {
    marginTop: 16,
  },
  reanalyzeButton: {
    marginTop: 16,
  },
  categorySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryName: {
    flex: 1,
    opacity: 0.9,
  },
  categoryAmounts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryAmount: {
    fontWeight: '600',
  },
  categoryPercent: {
    opacity: 0.6,
    minWidth: 50,
    textAlign: 'right',
  },
  insightsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  insightText: {
    opacity: 0.8,
    lineHeight: 20,
    marginBottom: 8,
  },
  budgetSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  createBudgetButton: {
    marginTop: 12,
  },
  budgetSuccessSection: {
    marginTop: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
  },
  successTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#4caf50',
  },
  budgetName: {
    fontWeight: '600',
    marginBottom: 4,
  },
});
