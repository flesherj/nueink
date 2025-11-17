#!/usr/bin/env node
/**
 * Transaction Pattern Analysis Demo
 */

const fs = require('fs');
const path = require('path');

// Load transactions
const allTransactions = JSON.parse(fs.readFileSync('/tmp/transactions.json', 'utf8'));

// ========== Filter Out Non-Spending Transactions ==========

/**
 * Determine if a transaction is actual spending (not transfers, income, or setup)
 */
const isActualSpending = (tx) => {
  // Exclude positive amounts (income)
  if (tx.amount >= 0) return false;

  // Exclude starting balances
  if (tx.merchant.includes('Starting Balance')) return false;

  // Exclude transfers between accounts
  if (tx.merchant.includes('Transfer to') || tx.merchant.includes('Transfer from')) return false;

  // Exclude income categories
  if (tx.category && tx.category.includes('Inflow')) return false;

  return true;
};

const transactions = allTransactions.filter(isActualSpending);

console.log('\n🔍 NueInk Transaction Pattern Analysis\n');
console.log('═'.repeat(80));
console.log(`\n✅ Loaded ${allTransactions.length} total transactions`);
console.log(`   Filtered to ${transactions.length} actual spending transactions\n`);
console.log('═'.repeat(80));

// ========== Helper Functions ==========

const formatCurrency = (cents) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ========== Pattern Detection ==========

/**
 * Detect recurring transactions
 */
const detectRecurring = (transactions) => {
  // Group by merchant and category
  const groups = new Map();

  transactions.forEach(tx => {
    const key = `${tx.merchant}|${tx.category}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(tx);
  });

  const patterns = [];

  groups.forEach((txs, key) => {
    const [merchant, category] = key.split('|');

    // Need at least 3 occurrences
    if (txs.length < 3) return;

    // Sort by date
    const sorted = txs.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate intervals
    const intervals = [];
    for (let i = 1; i < sorted.length; i++) {
      const daysBetween = Math.round(
        (new Date(sorted[i].date) - new Date(sorted[i-1].date)) / (1000 * 60 * 60 * 24)
      );
      intervals.push(daysBetween);
    }

    // Check consistency (within 3 days tolerance)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const maxDeviation = Math.max(...intervals.map(i => Math.abs(i - avgInterval)));

    if (maxDeviation > 3) return;

    // Determine frequency
    let frequency = 'unknown';
    let confidence = 0;

    if (avgInterval >= 6 && avgInterval <= 8) {
      frequency = 'weekly';
      confidence = 90;
    } else if (avgInterval >= 13 && avgInterval <= 15) {
      frequency = 'biweekly';
      confidence = 85;
    } else if (avgInterval >= 28 && avgInterval <= 33) {
      frequency = 'monthly';
      confidence = 95;
    } else if (avgInterval >= 88 && avgInterval <= 95) {
      frequency = 'quarterly';
      confidence = 80;
    }

    if (confidence > 0) {
      const amounts = sorted.map(tx => Math.abs(tx.amount));
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;

      const lastDate = new Date(sorted[sorted.length - 1].date);
      const nextExpectedDate = new Date(lastDate.getTime() + avgInterval * 24 * 60 * 60 * 1000);

      patterns.push({
        merchant,
        category,
        averageAmount: avgAmount,
        frequency,
        occurrences: txs.length,
        lastDate,
        nextExpectedDate,
        confidence,
      });
    }
  });

  return patterns.sort((a, b) => b.confidence - a.confidence);
};

/**
 * Analyze category spending
 */
const analyzeCategorySpending = (transactions) => {
  const categories = new Map();
  let totalSpent = 0;

  transactions.forEach(tx => {
    // Only count outflows
    if (tx.amount >= 0) return;

    const amount = Math.abs(tx.amount);
    totalSpent += amount;

    if (!categories.has(tx.category)) {
      categories.set(tx.category, { total: 0, count: 0 });
    }

    const cat = categories.get(tx.category);
    cat.total += amount;
    cat.count += 1;
  });

  const monthsOfData = 12;
  const insights = [];

  categories.forEach((data, category) => {
    insights.push({
      category,
      totalSpent: data.total,
      transactionCount: data.count,
      averageAmount: data.total / data.count,
      monthlyAverage: data.total / monthsOfData,
      percentOfTotal: (data.total / totalSpent) * 100,
    });
  });

  return insights.sort((a, b) => b.totalSpent - a.totalSpent);
};

/**
 * Analyze merchants
 */
const analyzeMerchants = (transactions) => {
  const merchants = new Map();

  transactions.forEach(tx => {
    if (tx.amount >= 0) return;

    if (!merchants.has(tx.merchant)) {
      merchants.set(tx.merchant, {
        total: 0,
        count: 0,
        categories: new Set(),
        dates: [],
      });
    }

    const merchant = merchants.get(tx.merchant);
    merchant.total += Math.abs(tx.amount);
    merchant.count += 1;
    merchant.categories.add(tx.category);
    merchant.dates.push(new Date(tx.date));
  });

  const insights = [];

  merchants.forEach((data, merchant) => {
    const sortedDates = data.dates.sort((a, b) => a - b);

    insights.push({
      merchant,
      totalSpent: data.total,
      transactionCount: data.count,
      categories: Array.from(data.categories),
      firstSeen: sortedDates[0],
      lastSeen: sortedDates[sortedDates.length - 1],
    });
  });

  return insights.sort((a, b) => b.totalSpent - a.totalSpent);
};

/**
 * Analyze monthly trends
 */
const analyzeMonthlyTrends = (transactions) => {
  const months = new Map();

  transactions.forEach(tx => {
    if (tx.amount >= 0) return;

    const date = new Date(tx.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!months.has(monthKey)) {
      months.set(monthKey, {
        total: 0,
        count: 0,
        categories: new Map(),
      });
    }

    const month = months.get(monthKey);
    month.total += Math.abs(tx.amount);
    month.count += 1;

    const catTotal = month.categories.get(tx.category) || 0;
    month.categories.set(tx.category, catTotal + Math.abs(tx.amount));
  });

  const insights = [];
  let previousTotal = 0;

  const sortedMonths = Array.from(months.keys()).sort();

  sortedMonths.forEach((monthKey) => {
    const data = months.get(monthKey);

    let topCategory = '';
    let topAmount = 0;
    data.categories.forEach((amount, category) => {
      if (amount > topAmount) {
        topAmount = amount;
        topCategory = category;
      }
    });

    const change = previousTotal > 0
      ? ((data.total - previousTotal) / previousTotal) * 100
      : undefined;

    insights.push({
      month: monthKey,
      totalSpent: data.total,
      transactionCount: data.count,
      topCategory,
      change,
    });

    previousTotal = data.total;
  });

  return insights;
};

// ========== Run Analysis ==========

// 1. Recurring Patterns
console.log('\n💳 RECURRING BILLS & SUBSCRIPTIONS\n');
const recurring = detectRecurring(transactions);

if (recurring.length === 0) {
  console.log('   No recurring patterns detected (need at least 3 occurrences)\n');
} else {
  console.log(`   Found ${recurring.length} recurring patterns:\n`);

  recurring.slice(0, 10).forEach((pattern, i) => {
    console.log(`   ${i + 1}. ${pattern.merchant}`);
    console.log(`      Category: ${pattern.category}`);
    console.log(`      Amount: ${formatCurrency(pattern.averageAmount)} (avg)`);
    console.log(`      Frequency: ${pattern.frequency} (${pattern.occurrences} occurrences)`);
    console.log(`      Confidence: ${pattern.confidence}%`);
    if (pattern.nextExpectedDate) {
      console.log(`      Next expected: ${formatDate(pattern.nextExpectedDate)}`);
    }
    console.log('');
  });
}

console.log('═'.repeat(80));

// 2. Category Spending
console.log('\n📊 SPENDING BY CATEGORY\n');
const categories = analyzeCategorySpending(transactions);

console.log(`   Total categories: ${categories.length}\n`);

categories.slice(0, 10).forEach((cat, i) => {
  console.log(`   ${i + 1}. ${cat.category}`);
  console.log(`      Total: ${formatCurrency(cat.totalSpent)}`);
  console.log(`      Monthly avg: ${formatCurrency(cat.monthlyAverage)}`);
  console.log(`      ${cat.transactionCount} transactions (${cat.percentOfTotal.toFixed(1)}% of spending)`);
  console.log('');
});

console.log('═'.repeat(80));

// 3. Top Merchants
console.log('\n🏪 TOP MERCHANTS\n');
const merchants = analyzeMerchants(transactions);

merchants.slice(0, 10).forEach((merchant, i) => {
  console.log(`   ${i + 1}. ${merchant.merchant}`);
  console.log(`      Total spent: ${formatCurrency(merchant.totalSpent)}`);
  console.log(`      ${merchant.transactionCount} transactions`);
  console.log(`      Categories: ${merchant.categories.join(', ')}`);
  console.log(`      First: ${formatDate(merchant.firstSeen)}, Last: ${formatDate(merchant.lastSeen)}`);
  console.log('');
});

console.log('═'.repeat(80));

// 4. Monthly Trends
console.log('\n📈 MONTHLY SPENDING TRENDS\n');
const trends = analyzeMonthlyTrends(transactions);

trends.forEach((trend) => {
  const changeIndicator = trend.change !== undefined
    ? trend.change > 0
      ? `📈 +${trend.change.toFixed(1)}%`
      : `📉 ${trend.change.toFixed(1)}%`
    : '—';

  console.log(`   ${trend.month}: ${formatCurrency(trend.totalSpent)}`);
  console.log(`      ${trend.transactionCount} transactions | Top: ${trend.topCategory} | ${changeIndicator}`);
  console.log('');
});

console.log('═'.repeat(80));

// Summary
const totalSpent = categories.reduce((sum, cat) => sum + cat.totalSpent, 0);
const avgMonthly = totalSpent / 12;

console.log('\n📋 SUMMARY\n');
console.log(`   Total transactions: ${transactions.length}`);
console.log(`   Total spent: ${formatCurrency(totalSpent)}`);
console.log(`   Monthly average: ${formatCurrency(avgMonthly)}`);
console.log(`   Categories: ${categories.length}`);
console.log(`   Recurring patterns: ${recurring.length}`);
console.log(`   Unique merchants: ${merchants.length}`);
console.log('');
console.log('═'.repeat(80));
console.log('\n✨ Analysis complete!\n');
