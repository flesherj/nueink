import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Surface, Text, Card, Chip, ActivityIndicator, Button, Divider } from 'react-native-paper';
import { useAccountProvider } from '@nueink/ui';
import { useRouter } from 'expo-router';
import { DebtApi } from '@nueink/sdk';
import type { DebtPayoffPlan } from '@nueink/core';

// Create API client
const debtApi = DebtApi.create();

export default function DebtOverviewScreen() {
  const { account } = useAccountProvider();
  const router = useRouter();
  const [plans, setPlans] = useState<DebtPayoffPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDebtPlans();
  }, [account]);

  /**
   * Load debt payoff plans
   */
  const loadDebtPlans = async () => {
    if (!account?.defaultOrgId || !account?.accountId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Generating debt payoff plans...');

      const result = await debtApi.generatePayoffPlans({
        organizationId: account.defaultOrgId,
        accountId: account.accountId,
      });

      console.log('Payoff plans generated:', result);
      setPlans(result.plans || []);
    } catch (err) {
      console.error('Error generating payoff plans:', err);
      if (err instanceof Error && err.message.includes('No debt accounts found')) {
        setError('No debts found in your accounts');
      } else if (err instanceof Error && err.message.includes('No financial accounts found')) {
        setError('Connect a bank account or credit card first');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate payoff plans');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDebtPlans();
    setRefreshing(false);
  };

  /**
   * Format currency
   */
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  /**
   * Format debt balance (show as negative progressing to zero)
   */
  const formatDebtBalance = (cents: number) => {
    // Debt balances are stored as positive for calculations,
    // but display as negative to show progression to $0
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      signDisplay: 'always',
    }).format(-cents / 100);
  };

  /**
   * Format date
   */
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  /**
   * Get interest savings between plans
   */
  const getInterestSavings = () => {
    if (plans.length < 2) return 0;
    const avalanche = plans.find(p => p.strategy === 'avalanche');
    const snowball = plans.find(p => p.strategy === 'snowball');
    if (!avalanche || !snowball) return 0;
    return snowball.summary.totalInterest - avalanche.summary.totalInterest;
  };

  /**
   * Get month difference between plans
   */
  const getMonthDifference = () => {
    if (plans.length < 2) return 0;
    const avalanche = plans.find(p => p.strategy === 'avalanche');
    const snowball = plans.find(p => p.strategy === 'snowball');
    if (!avalanche || !snowball) return 0;
    return snowball.summary.monthsToPayoff - avalanche.summary.monthsToPayoff;
  };

  if (loading) {
    return (
      <Surface style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Analyzing your debts...</Text>
        </View>
      </Surface>
    );
  }

  if (error) {
    return (
      <Surface style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          {error.includes('Connect') && (
            <Button
              mode="contained"
              onPress={() => router.push('/(protected)/(tabs)/accounts')}
              style={styles.button}
            >
              Connect Accounts
            </Button>
          )}
          <Button mode="outlined" onPress={onRefresh} style={styles.button}>
            Try Again
          </Button>
        </View>
      </Surface>
    );
  }

  if (plans.length === 0) {
    return (
      <Surface style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No debts found</Text>
          <Text style={styles.emptySubtext}>
            We'll automatically detect credit cards, loans, and mortgages from your connected accounts
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/(protected)/(tabs)/accounts')}
            style={styles.button}
          >
            View Accounts
          </Button>
        </View>
      </Surface>
    );
  }

  // Show consumer debt only (credit cards, loans) - mortgages excluded
  // This provides a more actionable timeline for users
  const consumerPlans = plans.filter(p => p.scope === 'consumer');
  const totalPlans = plans.filter(p => p.scope === 'all');

  // Separate minimum and optimized scenarios
  const minimumPlans = consumerPlans.filter(p => p.optimized === false);
  const optimizedPlans = consumerPlans.filter(p => p.optimized === true);

  // Use consumer plans if available, otherwise fall back to total
  const activePlans = consumerPlans.length > 0 ? consumerPlans : totalPlans;

  // Get both scenarios for comparison (prefer consumer debt)
  const minimumAvalanche = minimumPlans.find(p => p.strategy === 'avalanche');
  const optimizedAvalanche = optimizedPlans.find(p => p.strategy === 'avalanche');

  // For debt list and details, use the first available plan
  const avalanchePlan = activePlans.find(p => p.strategy === 'avalanche');
  const snowballPlan = activePlans.find(p => p.strategy === 'snowball');
  const debts = avalanchePlan?.debts || [];
  const isConsumerDebt = consumerPlans.length > 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Debt Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            {isConsumerDebt ? '💳 Consumer Debt Payoff' : '🏠 Total Debt Payoff'}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {debts.length} {isConsumerDebt ? 'consumer debt' : 'debt'}{debts.length !== 1 ? 's' : ''}{avalanchePlan ? ` totaling ${formatDebtBalance(avalanchePlan.summary.totalDebt)}` : ''}
          </Text>
          {isConsumerDebt && (
            <Text variant="bodySmall" style={styles.subtitle}>
              Mortgages excluded • Focus on eliminating consumer debt first
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Debt List */}
      {debts.map((debt, index) => (
        <Card key={debt.financialAccountId} style={styles.card}>
          <Card.Content>
            <View style={styles.debtHeader}>
              <View style={styles.debtInfo}>
                <Text variant="titleMedium">{debt.name}</Text>
                <Text variant="bodySmall" style={styles.debtType}>
                  {debt.type.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              <Text variant="titleLarge" style={styles.balance}>
                {formatDebtBalance(debt.currentBalance || 0)}
              </Text>
            </View>
            <View style={styles.debtDetails}>
              <View style={styles.detailRow}>
                <Text variant="bodySmall" style={styles.label}>
                  Interest Rate:
                </Text>
                <Text variant="bodyMedium">
                  {debt.interestRate ? `${(debt.interestRate * 100).toFixed(2)}%` : 'Unknown'}
                </Text>
              </View>
              {debt.promotionalRate !== undefined && debt.promotionalEndDate && (
                <View style={styles.detailRow}>
                  <Chip icon="sale" style={styles.promoChip}>
                    {debt.promotionalRate === 0 ? '0% ' : `${(debt.promotionalRate * 100).toFixed(2)}% `}
                    until {formatDate(debt.promotionalEndDate)}
                  </Chip>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      ))}

      <Divider style={styles.divider} />

      {/* Payment Scenario Comparison */}
      {minimumAvalanche && optimizedAvalanche && (
        <>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Payment Scenarios
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                See how budget optimization can dramatically accelerate your debt freedom
              </Text>
            </Card.Content>
          </Card>

          {/* Minimum Payments Scenario */}
          <Card style={[styles.card, styles.minimumCard]}>
            <Card.Content>
              <View style={styles.scenarioHeader}>
                <Text variant="titleMedium">Minimum Payments Only</Text>
                <Chip icon="alert" style={styles.minimumChip}>
                  Current Pace
                </Chip>
              </View>
              <Text variant="bodySmall" style={styles.scenarioDescription}>
                Paying only minimum payments on all debts
              </Text>
              <View style={styles.scenarioStats}>
                <View style={styles.scenarioStat}>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Monthly Payment
                  </Text>
                  <Text variant="headlineSmall">
                    {formatCurrency(minimumAvalanche.summary.monthlyPayment)}
                  </Text>
                </View>
                <View style={styles.scenarioStat}>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Debt-Free Date
                  </Text>
                  <Text variant="headlineSmall">
                    {formatDate(minimumAvalanche.summary.debtFreeDate)}
                  </Text>
                </View>
                <View style={styles.scenarioStat}>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Total Interest
                  </Text>
                  <Text variant="headlineSmall">
                    {formatCurrency(minimumAvalanche.summary.totalInterest)}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Budget Optimized Scenario */}
          <Card style={[styles.card, styles.optimizedCard]}>
            <Card.Content>
              <View style={styles.scenarioHeader}>
                <Text variant="titleMedium">Budget Optimized</Text>
                <Chip icon="rocket-launch" style={styles.optimizedChip}>
                  Recommended
                </Chip>
              </View>
              <Text variant="bodySmall" style={styles.scenarioDescription}>
                Maximize payments based on available budget
              </Text>

              {/* Payment Breakdown */}
              <View style={styles.paymentBreakdown}>
                <Text variant="bodySmall" style={styles.breakdownLabel}>
                  Payment Breakdown:
                </Text>
                <View style={styles.breakdownRow}>
                  <Text variant="bodySmall" style={styles.breakdownText}>
                    Minimum payments
                  </Text>
                  <Text variant="bodySmall" style={styles.breakdownAmount}>
                    {formatCurrency(minimumAvalanche.summary.monthlyPayment)}
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text variant="bodySmall" style={styles.breakdownText}>
                    + Budget surplus
                  </Text>
                  <Text variant="bodySmall" style={[styles.breakdownAmount, styles.surplusText]}>
                    {formatCurrency(optimizedAvalanche.summary.monthlyPayment - minimumAvalanche.summary.monthlyPayment)}
                  </Text>
                </View>
              </View>

              <View style={styles.scenarioStats}>
                <View style={styles.scenarioStat}>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Monthly Payment
                  </Text>
                  <Text variant="headlineSmall" style={styles.optimizedText}>
                    {formatCurrency(optimizedAvalanche.summary.monthlyPayment)}
                  </Text>
                </View>
                <View style={styles.scenarioStat}>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Debt-Free Date
                  </Text>
                  <Text variant="headlineSmall" style={styles.optimizedText}>
                    {formatDate(optimizedAvalanche.summary.debtFreeDate)}
                  </Text>
                </View>
                <View style={styles.scenarioStat}>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Total Interest
                  </Text>
                  <Text variant="headlineSmall" style={styles.optimizedText}>
                    {formatCurrency(optimizedAvalanche.summary.totalInterest)}
                  </Text>
                </View>
              </View>

              {/* Savings Highlight */}
              <View style={styles.savingsHighlight}>
                <Text variant="titleSmall" style={styles.savingsHighlightText}>
                  Pay off debt {minimumAvalanche.summary.monthsToPayoff - optimizedAvalanche.summary.monthsToPayoff} months faster and save {formatCurrency(minimumAvalanche.summary.totalInterest - optimizedAvalanche.summary.totalInterest)} in interest!
                </Text>
              </View>

              <Text variant="bodySmall" style={styles.budgetNote}>
                {minimumAvalanche.summary.monthlyPayment === optimizedAvalanche.summary.monthlyPayment
                  ? 'Using estimated payment. Create a budget to see timeline with your actual surplus.'
                  : 'This scenario uses your budget surplus for maximum debt payoff. Create a budget to track your actual available funds.'}
              </Text>
            </Card.Content>
          </Card>

          <Divider style={styles.divider} />
        </>
      )}

      {/* Strategy Comparison */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Payoff Strategies
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Compare different approaches to becoming debt-free
          </Text>
        </Card.Content>
      </Card>

      {/* Avalanche Strategy */}
      {avalanchePlan && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.strategyHeader}>
              <Text variant="titleMedium">Avalanche Strategy</Text>
              <Chip icon="trending-down" style={styles.recommendedChip}>
                Saves Most
              </Chip>
            </View>
            <Text variant="bodySmall" style={styles.strategyDescription}>
              Pay highest interest rate first
            </Text>
            <View style={styles.strategyStats}>
              <View style={styles.stat}>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Debt-Free Date
                </Text>
                <Text variant="titleMedium">
                  {formatDate(avalanchePlan.summary.debtFreeDate)}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Total Interest
                </Text>
                <Text variant="titleMedium">
                  {formatCurrency(avalanchePlan.summary.totalInterest)}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Monthly Payment
                </Text>
                <Text variant="titleMedium">
                  {formatCurrency(avalanchePlan.summary.monthlyPayment)}
                </Text>
              </View>
            </View>
            <Button
              mode="contained"
              onPress={() => router.push('/debt/schedule/avalanche')}
              style={styles.viewButton}
            >
              View Payment Schedule
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Snowball Strategy */}
      {snowballPlan && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.strategyHeader}>
              <Text variant="titleMedium">Snowball Strategy</Text>
              {getMonthDifference() > 0 && (
                <Chip icon="calendar" style={styles.warningChip}>
                  +{getMonthDifference()} months
                </Chip>
              )}
            </View>
            <Text variant="bodySmall" style={styles.strategyDescription}>
              Pay smallest balance first (psychological wins)
            </Text>
            <View style={styles.strategyStats}>
              <View style={styles.stat}>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Debt-Free Date
                </Text>
                <Text variant="titleMedium">
                  {formatDate(snowballPlan.summary.debtFreeDate)}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Total Interest
                </Text>
                <Text variant="titleMedium">
                  {formatCurrency(snowballPlan.summary.totalInterest)}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Monthly Payment
                </Text>
                <Text variant="titleMedium">
                  {formatCurrency(snowballPlan.summary.monthlyPayment)}
                </Text>
              </View>
            </View>
            <Button
              mode="outlined"
              onPress={() => router.push('/debt/schedule/snowball')}
              style={styles.viewButton}
            >
              View Payment Schedule
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Savings Summary */}
      {getInterestSavings() > 0 && (
        <Card style={[styles.card, styles.savingsCard]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.savingsText}>
              💰 Avalanche saves you {formatCurrency(getInterestSavings())} in interest
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
  },
  card: {
    margin: 16,
    marginBottom: 0,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  debtInfo: {
    flex: 1,
  },
  debtType: {
    color: '#666',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  balance: {
    fontWeight: 'bold',
  },
  debtDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  label: {
    color: '#666',
  },
  promoChip: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 24,
  },
  strategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendedChip: {
    backgroundColor: '#4caf50',
  },
  warningChip: {
    backgroundColor: '#ff9800',
  },
  strategyDescription: {
    color: '#666',
    marginBottom: 16,
  },
  strategyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    color: '#666',
    marginBottom: 4,
  },
  viewButton: {
    marginTop: 8,
  },
  savingsCard: {
    backgroundColor: '#e8f5e9',
    marginBottom: 16,
  },
  savingsText: {
    textAlign: 'center',
    color: '#2e7d32',
  },
  scenarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scenarioDescription: {
    color: '#666',
    marginBottom: 16,
  },
  scenarioStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scenarioStat: {
    flex: 1,
    alignItems: 'center',
  },
  minimumCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  minimumChip: {
    backgroundColor: '#ff9800',
  },
  optimizedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  optimizedChip: {
    backgroundColor: '#4caf50',
  },
  optimizedText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  savingsHighlight: {
    backgroundColor: '#fff9e6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  savingsHighlightText: {
    color: '#f57c00',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  budgetNote: {
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  paymentBreakdown: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  breakdownLabel: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#2e7d32',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  breakdownText: {
    color: '#666',
  },
  breakdownAmount: {
    fontWeight: '500',
  },
  surplusText: {
    color: '#4caf50',
    fontWeight: '600',
  },
});
