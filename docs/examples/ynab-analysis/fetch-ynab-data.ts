#!/usr/bin/env node

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import {
  YNABBudget,
  YNABAccount,
  YNABTransaction,
  YNABCategoryGroup,
  AccountSummary
} from './types';

// Load environment variables
dotenv.config();

const API_TOKEN = process.env.YNAB_API_TOKEN;
const BASE_URL = 'https://api.ynab.com/v1';

if (!API_TOKEN) {
  console.error('Error: YNAB_API_TOKEN not found in .env file');
  process.exit(1);
}

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${API_TOKEN}`
  }
});

async function fetchBudgets(): Promise<YNABBudget[]> {
  const response = await axiosInstance.get('/budgets');
  return response.data.data.budgets;
}

async function fetchAccounts(budgetId: string): Promise<YNABAccount[]> {
  const response = await axiosInstance.get(`/budgets/${budgetId}/accounts`);
  return response.data.data.accounts;
}

async function fetchTransactions(budgetId: string): Promise<YNABTransaction[]> {
  const response = await axiosInstance.get(`/budgets/${budgetId}/transactions`);
  return response.data.data.transactions;
}

async function fetchCategories(budgetId: string): Promise<YNABCategoryGroup[]> {
  const response = await axiosInstance.get(`/budgets/${budgetId}/categories`);
  return response.data.data.category_groups;
}

function saveData(data: any, filename: string): void {
  const dataDir = 'ynab_data';
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const filePath = path.join(dataDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Saved ${filename}`);
}

function milliunitsToDollars(milliunits: number): number {
  return milliunits / 1000;
}

async function main() {
  try {
    console.log('Fetching YNAB data...\n');

    // Fetch budgets
    console.log('Fetching budgets...');
    const budgets = await fetchBudgets();
    saveData(budgets, 'budgets.json');

    console.log(`\nFound ${budgets.length} budget(s):`);
    budgets.forEach((budget, index) => {
      console.log(`${index + 1}. ${budget.name} (ID: ${budget.id})`);
    });

    // Use the first budget
    const budget = budgets[0];
    console.log(`\nUsing budget: ${budget.name}`);

    // Fetch accounts
    console.log('\nFetching accounts...');
    const accounts = await fetchAccounts(budget.id);
    saveData(accounts, 'accounts.json');
    console.log(`Found ${accounts.length} accounts`);

    // Fetch transactions
    console.log('\nFetching transactions...');
    const transactions = await fetchTransactions(budget.id);
    saveData(transactions, 'transactions.json');
    console.log(`Found ${transactions.length} transactions`);

    // Fetch categories
    console.log('\nFetching categories...');
    const categories = await fetchCategories(budget.id);
    saveData(categories, 'categories.json');
    console.log(`Found ${categories.length} category groups`);

    console.log('\n' + '='.repeat(50));
    console.log('Data fetch complete!');
    console.log('='.repeat(50));

    // Summary
    console.log('\nAccount Summary:');
    console.log('-'.repeat(50));

    const debtAccounts: AccountSummary[] = [];
    const assetAccounts: AccountSummary[] = [];

    for (const account of accounts) {
      if (!account.closed) {
        const balance = milliunitsToDollars(account.balance);
        const accountType = account.type;

        if (
          balance < 0 ||
          ['creditCard', 'lineOfCredit', 'otherLiability'].includes(accountType)
        ) {
          debtAccounts.push({
            name: account.name,
            balance: balance,
            type: accountType
          });
        } else {
          assetAccounts.push({
            name: account.name,
            balance: balance,
            type: accountType
          });
        }
      }
    }

    console.log('\nDEBT ACCOUNTS:');
    let totalDebt = 0;
    for (const acc of debtAccounts) {
      console.log(`  ${acc.name}: $${Math.abs(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      totalDebt += Math.abs(acc.balance);
    }

    console.log(`\nTOTAL DEBT: $${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

    console.log('\nASSET ACCOUNTS:');
    let totalAssets = 0;
    for (const acc of assetAccounts) {
      console.log(`  ${acc.name}: $${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      totalAssets += acc.balance;
    }

    console.log(`\nTOTAL ASSETS: $${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`\nNET WORTH: $${(totalAssets - totalDebt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('\nAPI Error:', error.response?.status, error.response?.statusText);
      console.error('Message:', error.response?.data);
    } else {
      console.error('\nError:', error);
    }
    process.exit(1);
  }
}

main();
