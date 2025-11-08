#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { YNABAccount, YNABTransaction, YNABCategoryGroup } from './types';

interface DebtAccount {
  name: string;
  balance: number;
  type: string;
  accountId: string;
  estimatedAPR?: number;
}

interface SpendingByCategory {
  categoryName: string;
  total: number;
  transactionCount: number;
  percentage: number;
}

interface MonthlySpending {
  month: string;
  total: number;
  byCategory: { [key: string]: number };
}

function milliunitsToDollars(milliunits: number): number {
  return milliunits / 1000;
}

function loadJSON<T>(filename: string): T {
  const filePath = path.join('ynab_data', filename);
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

function analyzeDebt() {
  console.log('='.repeat(60));
  console.log('DEBT ANALYSIS');
  console.log('='.repeat(60));

  const accounts: YNABAccount[] = loadJSON('accounts.json');
  const debtAccounts: DebtAccount[] = [];

  // Common APR estimates (you can update these with actual rates)
  const aprEstimates: { [key: string]: number } = {
    'creditCard': 18.99,
    'lineOfCredit': 12.99,
    'mortgage': 6.5,
    'otherLiability': 10.0
  };

  for (const account of accounts) {
    if (!account.closed) {
      const balance = milliunitsToDollars(account.balance);
      const accountType = account.type;

      if (
        balance < 0 ||
        ['creditCard', 'lineOfCredit', 'otherLiability', 'mortgage'].includes(accountType)
      ) {
        const debtBalance = Math.abs(balance);

        // Estimate APR based on account type
        let estimatedAPR = aprEstimates[accountType] || 15.0;

        // Special handling for mortgages
        if (account.name.toLowerCase().includes('loan') || account.name.toLowerCase().includes('account')) {
          if (debtBalance > 100000) {
            estimatedAPR = 6.5; // Likely a mortgage
          }
        }

        debtAccounts.push({
          name: account.name,
          balance: debtBalance,
          type: accountType,
          accountId: account.id,
          estimatedAPR
        });
      }
    }
  }

  // Sort by balance (highest first)
  debtAccounts.sort((a, b) => b.balance - a.balance);

  console.log('\nDebt Accounts (sorted by balance):');
  console.log('-'.repeat(60));

  let totalDebt = 0;
  let totalMonthlyInterest = 0;

  for (const debt of debtAccounts) {
    const monthlyInterest = (debt.balance * (debt.estimatedAPR! / 100)) / 12;
    totalMonthlyInterest += monthlyInterest;
    totalDebt += debt.balance;

    console.log(`\n${debt.name}`);
    console.log(`  Balance: $${debt.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log(`  Est. APR: ${debt.estimatedAPR}%`);
    console.log(`  Monthly Interest: $${monthlyInterest.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log(`  Type: ${debt.type}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`TOTAL DEBT: $${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`ESTIMATED MONTHLY INTEREST: $${totalMonthlyInterest.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`ESTIMATED ANNUAL INTEREST: $${(totalMonthlyInterest * 12).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log('='.repeat(60));

  return { debtAccounts, totalDebt, totalMonthlyInterest };
}

function analyzeSpending() {
  console.log('\n\n');
  console.log('='.repeat(60));
  console.log('SPENDING ANALYSIS');
  console.log('='.repeat(60));

  const transactions: YNABTransaction[] = loadJSON('transactions.json');

  // Filter to last 90 days and exclude transfers
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const recentTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return (
      !t.deleted &&
      t.amount < 0 && // Outflows only
      transactionDate >= ninetyDaysAgo &&
      !t.transfer_account_id // Exclude transfers
    );
  });

  // Group by category
  const categorySpending: { [key: string]: { total: number; count: number } } = {};
  let totalSpending = 0;

  for (const transaction of recentTransactions) {
    const amount = Math.abs(milliunitsToDollars(transaction.amount));
    const category = transaction.category_name || 'Uncategorized';

    if (!categorySpending[category]) {
      categorySpending[category] = { total: 0, count: 0 };
    }

    categorySpending[category].total += amount;
    categorySpending[category].count += 1;
    totalSpending += amount;
  }

  // Convert to array and sort
  const spendingArray: SpendingByCategory[] = Object.entries(categorySpending)
    .map(([categoryName, data]) => ({
      categoryName,
      total: data.total,
      transactionCount: data.count,
      percentage: (data.total / totalSpending) * 100
    }))
    .sort((a, b) => b.total - a.total);

  console.log('\nSpending by Category (Last 90 Days):');
  console.log('-'.repeat(60));

  for (const category of spendingArray.slice(0, 15)) {
    console.log(`\n${category.categoryName}`);
    console.log(`  Total: $${category.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log(`  Percentage: ${category.percentage.toFixed(1)}%`);
    console.log(`  Transactions: ${category.transactionCount}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`TOTAL SPENDING (90 days): $${totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`AVERAGE MONTHLY SPENDING: $${(totalSpending / 3).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log('='.repeat(60));

  return { spendingArray, totalSpending, averageMonthly: totalSpending / 3 };
}

function analyzeIncome() {
  console.log('\n\n');
  console.log('='.repeat(60));
  console.log('INCOME ANALYSIS');
  console.log('='.repeat(60));

  const transactions: YNABTransaction[] = loadJSON('transactions.json');

  // Filter to last 90 days - income only (positive amounts, excluding transfers)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const incomeTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return (
      !t.deleted &&
      t.amount > 0 && // Inflows only
      transactionDate >= ninetyDaysAgo &&
      !t.transfer_account_id // Exclude transfers
    );
  });

  let totalIncome = 0;
  const incomeBySource: { [key: string]: number } = {};

  for (const transaction of incomeTransactions) {
    const amount = milliunitsToDollars(transaction.amount);
    const source = transaction.payee_name || 'Unknown';

    totalIncome += amount;
    incomeBySource[source] = (incomeBySource[source] || 0) + amount;
  }

  console.log('\nIncome Sources (Last 90 Days):');
  console.log('-'.repeat(60));

  const sortedIncome = Object.entries(incomeBySource)
    .sort((a, b) => b[1] - a[1]);

  for (const [source, amount] of sortedIncome) {
    console.log(`  ${source}: $${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`TOTAL INCOME (90 days): $${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`AVERAGE MONTHLY INCOME: $${(totalIncome / 3).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log('='.repeat(60));

  return { totalIncome, averageMonthly: totalIncome / 3, incomeBySource };
}

function main() {
  const debtAnalysis = analyzeDebt();
  const spendingAnalysis = analyzeSpending();
  const incomeAnalysis = analyzeIncome();

  // Save detailed analysis
  const analysis = {
    timestamp: new Date().toISOString(),
    debt: debtAnalysis,
    spending: spendingAnalysis,
    income: incomeAnalysis,
    summary: {
      totalDebt: debtAnalysis.totalDebt,
      monthlyIncome: incomeAnalysis.averageMonthly,
      monthlySpending: spendingAnalysis.averageMonthly,
      monthlyInterest: debtAnalysis.totalMonthlyInterest,
      monthlySurplus: incomeAnalysis.averageMonthly - spendingAnalysis.averageMonthly
    }
  };

  fs.writeFileSync('ynab_data/financial_analysis.json', JSON.stringify(analysis, null, 2));
  console.log('\n\nDetailed analysis saved to ynab_data/financial_analysis.json');

  // Summary
  console.log('\n\n');
  console.log('='.repeat(60));
  console.log('FINANCIAL SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nAverage Monthly Income: $${incomeAnalysis.averageMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`Average Monthly Spending: $${spendingAnalysis.averageMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`Monthly Interest Payments: $${debtAnalysis.totalMonthlyInterest.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`\nMonthly Surplus/Deficit: $${analysis.summary.monthlySurplus.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`\nTotal Debt: $${debtAnalysis.totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log('='.repeat(60));
}

main();
