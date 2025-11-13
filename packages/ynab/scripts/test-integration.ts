#!/usr/bin/env tsx
/**
 * YNAB Integration Test Script
 *
 * Tests the YNAB integration end-to-end without needing OAuth.
 * Uses a personal access token to verify:
 * - Connection status
 * - Account fetching
 * - Transaction fetching
 * - Data conversion (milliunits → cents)
 *
 * Usage:
 * 1. Get personal access token from https://app.ynab.com/settings/developer
 * 2. export YNAB_ACCESS_TOKEN="your-token-here"
 * 3. tsx packages/ynab/scripts/test-integration.ts
 */

import { api as YNABApi } from 'ynab';
import { YnabIntegration } from '../src/client/YnabIntegration';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color: keyof typeof COLORS, message: string) {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log('cyan', `  ${title}`);
  console.log('='.repeat(60) + '\n');
}

async function main() {
  // Get access token from environment
  const accessToken = process.env.YNAB_ACCESS_TOKEN;

  if (!accessToken) {
    log('red', '❌ Error: YNAB_ACCESS_TOKEN environment variable not set');
    log('yellow', '\nHow to get a token:');
    log('yellow', '1. Go to https://app.ynab.com/settings/developer');
    log('yellow', '2. Click "New Token"');
    log('yellow', '3. Copy the token');
    log('yellow', '4. Run: export YNAB_ACCESS_TOKEN="your-token-here"');
    log('yellow', '5. Run this script again\n');
    process.exit(1);
  }

  log('blue', '🚀 Starting YNAB Integration Test\n');

  try {
    // Initialize YNAB client
    const ynabClient = new YNABApi(accessToken);

    // Create integration (using placeholder IDs for testing)
    const integration = new YnabIntegration(
      ynabClient,
      'test-org-123',
      'test-account-123'
    );

    // Test 1: Connection Status
    logSection('Test 1: Connection Status');
    const status = await integration.getStatus();

    if (status.connected) {
      log('green', '✅ Connected to YNAB successfully');
    } else {
      log('red', `❌ Connection failed: ${status.error}`);
      process.exit(1);
    }

    // Test 2: Fetch Accounts
    logSection('Test 2: Fetch Accounts');
    const accounts = await integration.getAccounts();

    log('green', `✅ Fetched ${accounts.length} accounts\n`);

    if (accounts.length > 0) {
      log('cyan', 'Sample accounts:');
      accounts.slice(0, 3).forEach((account, i) => {
        console.log(`  ${i + 1}. ${account.name}`);
        console.log(`     Type: ${account.type}`);
        console.log(`     Balance: $${(account.currentBalance! / 100).toFixed(2)}`);
        console.log(`     Mask: ${account.mask || 'N/A'}`);
        console.log(`     External ID: ${account.externalAccountId}`);
        console.log('');
      });
    }

    // Test 3: Fetch Transactions (last 30 days)
    logSection('Test 3: Fetch Transactions (Last 30 Days)');

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    log('blue', `Date range: ${startDateStr} to ${endDateStr}\n`);

    const transactions = await integration.getTransactions(startDateStr, endDateStr);

    log('green', `✅ Fetched ${transactions.length} transactions\n`);

    if (transactions.length > 0) {
      log('cyan', 'Sample transactions:');
      transactions.slice(0, 5).forEach((txn, i) => {
        const amount = (txn.amount / 100).toFixed(2);
        const sign = txn.amount >= 0 ? '+' : '';
        console.log(`  ${i + 1}. ${txn.name}`);
        console.log(`     Date: ${new Date(txn.date).toLocaleDateString()}`);
        console.log(`     Amount: ${sign}$${amount}`);
        console.log(`     Category: ${txn.category?.join(', ') || 'Uncategorized'}`);
        console.log(`     Account: ${txn.financialAccountId}`);
        console.log('');
      });
    }

    // Test 4: Refresh Balances
    logSection('Test 4: Refresh Balances');
    const balances = await integration.refreshBalances();

    log('green', `✅ Refreshed balances for ${balances.length} accounts\n`);

    // Test 5: Data Validation
    logSection('Test 5: Data Validation');

    let validationPassed = true;

    // Validate accounts
    if (accounts.length > 0) {
      const sampleAccount = accounts[0];

      // Check required fields
      if (!sampleAccount.financialAccountId) {
        log('red', '❌ Account missing financialAccountId');
        validationPassed = false;
      }
      if (!sampleAccount.organizationId) {
        log('red', '❌ Account missing organizationId');
        validationPassed = false;
      }
      if (!sampleAccount.name) {
        log('red', '❌ Account missing name');
        validationPassed = false;
      }
      if (!sampleAccount.type) {
        log('red', '❌ Account missing type');
        validationPassed = false;
      }
      if (!sampleAccount.externalAccountId) {
        log('red', '❌ Account missing externalAccountId');
        validationPassed = false;
      }

      // Check balance is in cents (should be a reasonable integer)
      if (sampleAccount.currentBalance !== undefined) {
        if (!Number.isInteger(sampleAccount.currentBalance)) {
          log('red', '❌ Balance is not an integer (should be in cents)');
          validationPassed = false;
        }
      }
    }

    // Validate transactions
    if (transactions.length > 0) {
      const sampleTxn = transactions[0];

      // Check required fields
      if (!sampleTxn.transactionId) {
        log('red', '❌ Transaction missing transactionId');
        validationPassed = false;
      }
      if (!sampleTxn.financialAccountId) {
        log('red', '❌ Transaction missing financialAccountId');
        validationPassed = false;
      }
      if (!sampleTxn.name) {
        log('red', '❌ Transaction missing name');
        validationPassed = false;
      }

      // Check amount is in cents
      if (!Number.isInteger(sampleTxn.amount)) {
        log('red', '❌ Transaction amount is not an integer (should be in cents)');
        validationPassed = false;
      }
    }

    if (validationPassed) {
      log('green', '✅ All data validation checks passed');
    }

    // Summary
    logSection('Test Summary');
    log('green', '✅ Connection: Success');
    log('green', `✅ Accounts: ${accounts.length} fetched`);
    log('green', `✅ Transactions: ${transactions.length} fetched`);
    log('green', `✅ Balances: ${balances.length} refreshed`);
    log('green', `✅ Data Validation: ${validationPassed ? 'Passed' : 'Failed'}`);

    log('blue', '\n🎉 YNAB Integration Test Complete!\n');

  } catch (error) {
    log('red', '\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
main();
