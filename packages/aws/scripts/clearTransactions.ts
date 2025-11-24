/**
 * Clear Tables Script
 *
 * Deletes data from specified tables in the database.
 * Useful for testing and development.
 *
 * Usage: yarn clear-transactions
 *
 * To skip clearing a table, comment it out in the TABLES_TO_CLEAR array.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { fromIni } from '@aws-sdk/credential-providers';

const REGION = 'us-east-1';
const PROFILE = 'solotech';
const SANDBOX_ID = 'mf62wubvgrdnxhhqstqlaqtpsy';
const STAGE = 'NONE';

/**
 * Table configuration
 * Comment out any tables you don't want to clear
 */
const TABLES_TO_CLEAR = [
  // Financial Data - Commonly cleared for testing
  { name: 'Transaction', key: 'transactionId' },
  { name: 'TransactionSplit', key: 'splitId' },
  { name: 'FinancialAccount', key: 'financialAccountId' },
  { name: 'Institution', key: 'institutionId' },

  // Budgets and Debts
  // { name: 'Budget', key: 'budgetId' },
  // { name: 'Debt', key: 'debtId' },

  // AI/ML Data
  // { name: 'UserCategorizationFeedback', key: 'feedbackId' },
  // { name: 'Insight', key: 'insightId' },

  // User/Organization Data - CAREFUL! Uncomment only if you want to reset everything
  // { name: 'Account', key: 'accountId' },
  // { name: 'Organization', key: 'orgId' },
  // { name: 'Membership', key: 'accountId', sortKey: 'orgId' }, // Composite key
  // { name: 'Person', key: 'personId' },
  // { name: 'Comment', key: 'commentId' },

  // Integration Configs - CAREFUL! Contains OAuth tokens
  // { name: 'IntegrationConfig', key: 'configId' },
];

const client = new DynamoDBClient({
  region: REGION,
  credentials: fromIni({ profile: PROFILE }),
});

const docClient = DynamoDBDocumentClient.from(client);

/**
 * Build full table name with sandbox ID and stage
 */
const getFullTableName = (tableName: string): string => {
  return `${tableName}-${SANDBOX_ID}-${STAGE}`;
};

/**
 * Delete items in batches of 25 (DynamoDB limit)
 */
const batchDelete = async (
  tableName: string,
  items: any[],
  keyField: string,
  sortKeyField?: string
): Promise<number> => {
  let deletedCount = 0;

  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25);

    const deleteRequests = batch.map(item => {
      const key: any = { [keyField]: item[keyField] };
      if (sortKeyField) {
        key[sortKeyField] = item[sortKeyField];
      }
      return {
        DeleteRequest: { Key: key }
      };
    });

    try {
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [tableName]: deleteRequests
        }
      }));

      deletedCount += batch.length;
      console.log(`  Deleted ${deletedCount}/${items.length} items...`);
    } catch (error) {
      console.error(`  Failed to delete batch:`, error);
      throw error;
    }
  }

  return deletedCount;
};

/**
 * Scan and delete all items from a table
 */
const clearTable = async (
  tableName: string,
  keyField: string,
  sortKeyField?: string
): Promise<number> => {
  const fullTableName = getFullTableName(tableName);
  console.log(`\n📋 ${tableName}`);
  console.log(`   Table: ${fullTableName}`);

  let items: any[] = [];
  let lastEvaluatedKey: any = undefined;

  // Scan all items
  try {
    do {
      const response = await docClient.send(new ScanCommand({
        TableName: fullTableName,
        ExclusiveStartKey: lastEvaluatedKey
      }));

      if (response.Items) {
        items.push(...response.Items);
      }

      lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      console.log(`   ⚠️  Table not found - skipping`);
      return 0;
    }
    throw error;
  }

  console.log(`   Found: ${items.length} items`);

  if (items.length === 0) {
    console.log(`   ✓ Already empty`);
    return 0;
  }

  // Delete all items
  const deletedCount = await batchDelete(fullTableName, items, keyField, sortKeyField);
  console.log(`   ✅ Deleted: ${deletedCount} items`);

  return deletedCount;
};

const main = async () => {
  console.log('🗑️  Clear Database Tables\n');
  console.log(`Region: ${REGION}`);
  console.log(`Profile: ${PROFILE}`);
  console.log(`Sandbox: ${SANDBOX_ID}`);
  console.log(`\nClearing ${TABLES_TO_CLEAR.length} table(s)...`);

  try {
    let totalDeleted = 0;

    for (const table of TABLES_TO_CLEAR) {
      const deleted = await clearTable(table.name, table.key, table.sortKey);
      totalDeleted += deleted;
    }

    console.log('\n✅ Complete!');
    console.log(`Total deleted: ${totalDeleted} items across ${TABLES_TO_CLEAR.length} table(s)`);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
};

main();
