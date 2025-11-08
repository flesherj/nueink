#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

interface DebtAccount {
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
}

interface PayoffSchedule {
  month: number;
  accountName: string;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

interface PayoffStrategy {
  name: string;
  description: string;
  totalInterestPaid: number;
  totalMonthsToPaid: number;
  schedule: PayoffSchedule[];
}

function calculateMinimumPayment(balance: number, apr: number): number {
  // Estimate minimum payment as higher of:
  // 1. 2% of balance
  // 2. $25
  // For mortgages, estimate based on 30-year amortization
  if (balance > 100000) {
    // Likely a mortgage - use standard mortgage payment calculation
    const monthlyRate = apr / 100 / 12;
    const numPayments = 360; // 30 years
    return balance * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  } else {
    return Math.max(balance * 0.02, 25);
  }
}

function snowballMethod(debts: DebtAccount[], extraPayment: number): PayoffStrategy {
  // Sort by balance (smallest first)
  const sortedDebts = [...debts].sort((a, b) => a.balance - b.balance);
  return simulatePayoff('Debt Snowball (Smallest Balance First)', sortedDebts, extraPayment);
}

function avalancheMethod(debts: DebtAccount[], extraPayment: number): PayoffStrategy {
  // Sort by APR (highest first)
  const sortedDebts = [...debts].sort((a, b) => b.apr - a.apr);
  return simulatePayoff('Debt Avalanche (Highest Interest First)', sortedDebts, extraPayment);
}

function highestBalanceMethod(debts: DebtAccount[], extraPayment: number): PayoffStrategy {
  // Sort by balance (largest first)
  const sortedDebts = [...debts].sort((a, b) => b.balance - a.balance);
  return simulatePayoff('Highest Balance First', sortedDebts, extraPayment);
}

function simulatePayoff(strategyName: string, debts: DebtAccount[], extraPayment: number): PayoffStrategy {
  const schedule: PayoffSchedule[] = [];
  const workingDebts = debts.map(d => ({ ...d }));

  let month = 0;
  let totalInterestPaid = 0;

  // Calculate total minimum payments
  const totalMinPayments = workingDebts.reduce((sum, d) => sum + d.minPayment, 0);

  while (workingDebts.some(d => d.balance > 0)) {
    month++;

    // Safety check - max 600 months (50 years)
    if (month > 600) {
      console.warn(`Strategy "${strategyName}" exceeded 600 months`);
      break;
    }

    let remainingExtra = extraPayment;

    // First, make minimum payments on all debts
    for (const debt of workingDebts) {
      if (debt.balance <= 0) continue;

      const monthlyInterestRate = debt.apr / 100 / 12;
      const interestCharge = debt.balance * monthlyInterestRate;
      const principalPayment = Math.min(debt.minPayment - interestCharge, debt.balance);

      debt.balance -= principalPayment;
      totalInterestPaid += interestCharge;

      schedule.push({
        month,
        accountName: debt.name,
        payment: debt.minPayment,
        principal: principalPayment,
        interest: interestCharge,
        remainingBalance: Math.max(0, debt.balance)
      });
    }

    // Apply extra payment to first debt with balance
    const targetDebt = workingDebts.find(d => d.balance > 0);
    if (targetDebt && remainingExtra > 0) {
      const extraPrincipal = Math.min(remainingExtra, targetDebt.balance);
      targetDebt.balance -= extraPrincipal;

      // Add to schedule
      const lastEntry = schedule[schedule.length - workingDebts.length];
      if (lastEntry && lastEntry.accountName === targetDebt.name && lastEntry.month === month) {
        lastEntry.payment += extraPrincipal;
        lastEntry.principal += extraPrincipal;
        lastEntry.remainingBalance = Math.max(0, targetDebt.balance);
      }
    }

    // When a debt is paid off, add its minimum payment to extra payment for next month
    const paidOffDebts = workingDebts.filter(d => d.balance <= 0);
    for (const paidDebt of paidOffDebts) {
      if (paidDebt.minPayment > 0) {
        extraPayment += paidDebt.minPayment;
        paidDebt.minPayment = 0; // Mark as paid off
      }
    }
  }

  return {
    name: strategyName,
    description: `Pay off debts using the ${strategyName.toLowerCase()} method`,
    totalInterestPaid,
    totalMonthsToPaid: month,
    schedule
  };
}

function printStrategy(strategy: PayoffStrategy, monthlyPayment: number) {
  console.log('\n' + '='.repeat(70));
  console.log(strategy.name.toUpperCase());
  console.log('='.repeat(70));
  console.log(`Monthly Payment: $${monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`Total Time: ${strategy.totalMonthsToPaid} months (${(strategy.totalMonthsToPaid / 12).toFixed(1)} years)`);
  console.log(`Total Interest Paid: $${strategy.totalInterestPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log('-'.repeat(70));

  // Group schedule by account and show payoff order
  const debtPayoffOrder: { [key: string]: number } = {};
  let currentMonth = 0;

  for (const entry of strategy.schedule) {
    if (entry.remainingBalance === 0 && !debtPayoffOrder[entry.accountName]) {
      debtPayoffOrder[entry.accountName] = entry.month;
    }
  }

  const sortedPayoffs = Object.entries(debtPayoffOrder)
    .sort((a, b) => a[1] - b[1]);

  console.log('\nPayoff Order:');
  for (let i = 0; i < sortedPayoffs.length; i++) {
    const [accountName, month] = sortedPayoffs[i];
    console.log(`  ${i + 1}. ${accountName} - Month ${month} (${(month / 12).toFixed(1)} years)`);
  }
}

function main() {
  console.log('='.repeat(70));
  console.log('DEBT PAYOFF PLAN CALCULATOR');
  console.log('='.repeat(70));

  // Load accounts
  const accountsPath = path.join('ynab_data', 'accounts.json');
  const accountsData = JSON.parse(fs.readFileSync(accountsPath, 'utf-8'));

  // Build debt list
  const debts: DebtAccount[] = [];

  // APR estimates (update with actual rates if known)
  const aprEstimates: { [key: string]: number } = {
    'Customized Cash Rewards Visa Signature – 9802': 18.99,
    'Visa Signature cashRewards Plus – 6688': 18.99,
    'Quicksilver – 4556': 18.99,
    'Savor – 7589': 18.99,
    'Prime Store Card': 23.99, // Store cards typically higher
    'CareCredit': 26.99, // CareCredit can be very high if promo expires
    'Loan – 7032': 6.5, // Mortgage rate
    'Account – 1508': 6.5  // Mortgage rate
  };

  for (const account of accountsData) {
    if (!account.closed) {
      const balance = account.balance / 1000; // Convert from milliunits
      const accountType = account.type;

      if (
        balance < 0 ||
        ['creditCard', 'lineOfCredit', 'otherLiability', 'mortgage'].includes(accountType)
      ) {
        const debtBalance = Math.abs(balance);
        const apr = aprEstimates[account.name] || 15.0;
        const minPayment = calculateMinimumPayment(debtBalance, apr);

        debts.push({
          name: account.name,
          balance: debtBalance,
          apr: apr,
          minPayment: minPayment
        });
      }
    }
  }

  // Calculate total minimum payment
  const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);
  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);

  console.log('\nCurrent Debt Summary:');
  console.log('-'.repeat(70));
  for (const debt of debts) {
    console.log(`${debt.name}`);
    console.log(`  Balance: $${debt.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log(`  APR: ${debt.apr}%`);
    console.log(`  Min Payment: $${debt.minPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log(`TOTAL DEBT: $${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log(`TOTAL MINIMUM PAYMENTS: $${totalMinPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  console.log('='.repeat(70));

  // Scenario 1: Minimum payments only
  console.log('\n\n');
  console.log('#'.repeat(70));
  console.log('SCENARIO 1: MINIMUM PAYMENTS ONLY');
  console.log('#'.repeat(70));

  const minOnlySnowball = snowballMethod(debts, 0);
  printStrategy(minOnlySnowball, totalMinPayment);

  const minOnlyAvalanche = avalancheMethod(debts, 0);
  printStrategy(minOnlyAvalanche, totalMinPayment);

  // Scenario 2: Extra $500/month
  console.log('\n\n');
  console.log('#'.repeat(70));
  console.log('SCENARIO 2: MINIMUM PAYMENTS + $500 EXTRA/MONTH');
  console.log('#'.repeat(70));

  const extra500Snowball = snowballMethod(debts, 500);
  printStrategy(extra500Snowball, totalMinPayment + 500);

  const extra500Avalanche = avalancheMethod(debts, 500);
  printStrategy(extra500Avalanche, totalMinPayment + 500);

  // Scenario 3: Extra $1000/month
  console.log('\n\n');
  console.log('#'.repeat(70));
  console.log('SCENARIO 3: MINIMUM PAYMENTS + $1000 EXTRA/MONTH');
  console.log('#'.repeat(70));

  const extra1000Snowball = snowballMethod(debts, 1000);
  printStrategy(extra1000Snowball, totalMinPayment + 1000);

  const extra1000Avalanche = avalancheMethod(debts, 1000);
  printStrategy(extra1000Avalanche, totalMinPayment + 1000);

  // Summary comparison
  console.log('\n\n');
  console.log('='.repeat(70));
  console.log('STRATEGY COMPARISON SUMMARY');
  console.log('='.repeat(70));

  const strategies = [
    { scenario: 'Minimum Only - Snowball', strategy: minOnlySnowball },
    { scenario: 'Minimum Only - Avalanche', strategy: minOnlyAvalanche },
    { scenario: '+$500 Extra - Snowball', strategy: extra500Snowball },
    { scenario: '+$500 Extra - Avalanche', strategy: extra500Avalanche },
    { scenario: '+$1000 Extra - Snowball', strategy: extra1000Snowball },
    { scenario: '+$1000 Extra - Avalanche', strategy: extra1000Avalanche }
  ];

  console.log('\n');
  console.log('Strategy'.padEnd(35) + 'Time'.padEnd(15) + 'Total Interest');
  console.log('-'.repeat(70));

  for (const { scenario, strategy } of strategies) {
    const years = (strategy.totalMonthsToPaid / 12).toFixed(1);
    const timeStr = `${strategy.totalMonthsToPaid}mo (${years}yr)`;
    const interestStr = `$${strategy.totalInterestPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    console.log(scenario.padEnd(35) + timeStr.padEnd(15) + interestStr);
  }

  console.log('\n' + '='.repeat(70));
  console.log('RECOMMENDATION');
  console.log('='.repeat(70));
  console.log('\nThe Debt Avalanche method (paying highest interest first) will');
  console.log('save you the most money in interest charges.');
  console.log('\nThe Debt Snowball method (paying smallest balance first) provides');
  console.log('psychological wins by eliminating debts faster.');
  console.log('\nFor your situation:');
  console.log('- Focus on paying off high-interest credit cards first');
  console.log('- Consider balance transfer offers for 0% APR periods');
  console.log('- Look for ways to increase monthly debt payments');
  console.log('- Keep making minimum payments on mortgages while attacking');
  console.log('  high-interest debt');
  console.log('='.repeat(70));

  // Save detailed payoff plans
  const payoffPlans = {
    timestamp: new Date().toISOString(),
    totalDebt,
    totalMinPayment,
    scenarios: {
      minimumOnly: {
        snowball: minOnlySnowball,
        avalanche: minOnlyAvalanche
      },
      extra500: {
        snowball: extra500Snowball,
        avalanche: extra500Avalanche
      },
      extra1000: {
        snowball: extra1000Snowball,
        avalanche: extra1000Avalanche
      }
    }
  };

  fs.writeFileSync('ynab_data/debt_payoff_plans.json', JSON.stringify(payoffPlans, null, 2));
  console.log('\n\nDetailed payoff plans saved to ynab_data/debt_payoff_plans.json');
}

main();
