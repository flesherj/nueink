import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface, Text, Card, ActivityIndicator, Chip, List } from 'react-native-paper';
import { useAccountProvider } from '@nueink/ui';
import { useLocalSearchParams, Stack } from 'expo-router';
import { DebtApi } from '@nueink/sdk';
import type { DebtPayoffPlan, MonthlyPaymentSchedule } from '@nueink/core';

// Create API client
const debtApi = DebtApi.create();

export default function PaymentScheduleScreen() {
  const { account } = useAccountProvider();
  const { strategy } = useLocalSearchParams<{ strategy: string }>();
  const [plan, setPlan] = useState<DebtPayoffPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set([1])); // Expand first month by default

  useEffect(() => {
    loadPlan();
  }, [account, strategy]);

  /**
   * Load the payoff plan
   */
  const loadPlan = async () => {
    if (!account?.defaultOrgId || !account?.accountId || !strategy) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Loading payment schedule for strategy:', strategy);

      const result = await debtApi.generatePayoffPlans({
        organizationId: account.defaultOrgId,
        accountId: account.accountId,
      });

      const selectedPlan = result.plans.find(p => p.strategy === strategy);
      if (!selectedPlan) {
        setError('Plan not found');
        return;
      }

      setPlan(selectedPlan);
    } catch (err) {
      console.error('Error loading plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to load payment schedule');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle month expansion
   */
  const toggleMonth = (month: number) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(month)) {
        next.delete(month);
      } else {
        next.add(month);
      }
      return next;
    });
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
   * Format date
   */
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  /**
   * Format month label
   */
  const formatMonthLabel = (monthData: MonthlyPaymentSchedule) => {
    const date = new Date(monthData.date);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  /**
   * Get strategy display name
   */
  const getStrategyName = () => {
    if (strategy === 'avalanche') return 'Avalanche Strategy';
    if (strategy === 'snowball') return 'Snowball Strategy';
    return 'Payoff Plan';
  };

  /**
   * Get strategy description
   */
  const getStrategyDescription = () => {
    if (strategy === 'avalanche') return 'Paying highest interest rate first';
    if (strategy === 'snowball') return 'Paying smallest balance first';
    return '';
  };

  if (loading) {
    return (
      <Surface style={styles.container}>
        <Stack.Screen options={{ title: 'Payment Schedule' }} />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      </Surface>
    );
  }

  if (error || !plan) {
    return (
      <Surface style={styles.container}>
        <Stack.Screen options={{ title: 'Payment Schedule' }} />
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error || 'Plan not found'}</Text>
        </View>
      </Surface>
    );
  }

  // Group months into years for better display
  const scheduleByYear = plan.schedule.reduce((acc, monthData) => {
    const year = new Date(monthData.date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(monthData);
    return acc;
  }, {} as Record<number, MonthlyPaymentSchedule[]>);

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: getStrategyName() }} />

      {/* Plan Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            {getStrategyName()}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {getStrategyDescription()}
          </Text>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text variant="bodySmall" style={styles.summaryLabel}>
                Total Debt
              </Text>
              <Text variant="titleMedium">
                {formatCurrency(plan.summary.totalDebt)}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text variant="bodySmall" style={styles.summaryLabel}>
                Total Interest
              </Text>
              <Text variant="titleMedium">
                {formatCurrency(plan.summary.totalInterest)}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text variant="bodySmall" style={styles.summaryLabel}>
                Total Paid
              </Text>
              <Text variant="titleMedium">
                {formatCurrency(plan.summary.totalPaid)}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text variant="bodySmall" style={styles.summaryLabel}>
                Monthly Payment
              </Text>
              <Text variant="titleMedium">
                {formatCurrency(plan.summary.monthlyPayment)}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text variant="bodySmall" style={styles.summaryLabel}>
                Months to Payoff
              </Text>
              <Text variant="titleMedium">
                {plan.summary.monthsToPayoff}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text variant="bodySmall" style={styles.summaryLabel}>
                Debt-Free Date
              </Text>
              <Text variant="titleMedium">
                {formatDate(plan.summary.debtFreeDate)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Payment Schedule by Year */}
      {Object.entries(scheduleByYear).map(([year, months]) => (
        <View key={year}>
          <Text variant="titleMedium" style={styles.yearHeader}>
            {year}
          </Text>

          {months.map((monthData) => {
            const isExpanded = expandedMonths.has(monthData.month);
            const totalPrincipal = monthData.payments.reduce((sum, p) => sum + p.principal, 0);
            const totalInterest = monthData.payments.reduce((sum, p) => sum + p.interest, 0);

            return (
              <Card key={monthData.month} style={styles.card}>
                <List.Accordion
                  title={`Month ${monthData.month}`}
                  description={formatMonthLabel(monthData)}
                  expanded={isExpanded}
                  onPress={() => toggleMonth(monthData.month)}
                  left={props => <List.Icon {...props} icon="calendar" />}
                  right={props => (
                    <View style={styles.monthSummary}>
                      <Text variant="bodySmall" style={styles.monthSummaryText}>
                        {monthData.debtsRemaining} debt{monthData.debtsRemaining !== 1 ? 's' : ''} left
                      </Text>
                    </View>
                  )}
                >
                  <Card.Content>
                    {/* Month Totals */}
                    <View style={styles.monthTotals}>
                      <View style={styles.monthTotalItem}>
                        <Text variant="bodySmall" style={styles.label}>
                          Principal:
                        </Text>
                        <Text variant="bodyMedium">
                          {formatCurrency(totalPrincipal)}
                        </Text>
                      </View>
                      <View style={styles.monthTotalItem}>
                        <Text variant="bodySmall" style={styles.label}>
                          Interest:
                        </Text>
                        <Text variant="bodyMedium">
                          {formatCurrency(totalInterest)}
                        </Text>
                      </View>
                      <View style={styles.monthTotalItem}>
                        <Text variant="bodySmall" style={styles.label}>
                          Total:
                        </Text>
                        <Text variant="bodyMedium" style={styles.bold}>
                          {formatCurrency(monthData.totalPayment)}
                        </Text>
                      </View>
                    </View>

                    {/* Individual Debt Payments */}
                    {monthData.payments.map((payment, idx) => (
                      <View key={idx} style={styles.paymentRow}>
                        <View style={styles.paymentHeader}>
                          <Text variant="bodyMedium" style={styles.debtName}>
                            {payment.debtName}
                          </Text>
                          <Text variant="bodyMedium" style={styles.bold}>
                            {formatCurrency(payment.payment)}
                          </Text>
                        </View>
                        <View style={styles.paymentDetails}>
                          <Text variant="bodySmall" style={styles.paymentDetail}>
                            Principal: {formatCurrency(payment.principal)}
                          </Text>
                          <Text variant="bodySmall" style={styles.paymentDetail}>
                            Interest: {formatCurrency(payment.interest)}
                          </Text>
                          <Text variant="bodySmall" style={styles.paymentDetail}>
                            Remaining: {formatCurrency(payment.remainingBalance)}
                          </Text>
                        </View>
                        {payment.remainingBalance === 0 && (
                          <Chip icon="check-circle" style={styles.paidOffChip}>
                            Paid Off! 🎉
                          </Chip>
                        )}
                      </View>
                    ))}
                  </Card.Content>
                </List.Accordion>
              </Card>
            );
          })}
        </View>
      ))}
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
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryItem: {
    width: '50%',
    marginBottom: 16,
  },
  summaryLabel: {
    color: '#666',
    marginBottom: 4,
  },
  yearHeader: {
    marginTop: 24,
    marginLeft: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  monthSummary: {
    marginRight: 16,
  },
  monthSummaryText: {
    color: '#666',
  },
  monthTotals: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 12,
  },
  monthTotalItem: {
    alignItems: 'center',
  },
  label: {
    color: '#666',
  },
  bold: {
    fontWeight: 'bold',
  },
  paymentRow: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  debtName: {
    flex: 1,
    fontWeight: '500',
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentDetail: {
    color: '#666',
  },
  paidOffChip: {
    marginTop: 8,
    backgroundColor: '#4caf50',
  },
});
