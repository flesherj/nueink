/**
 * Clear Transactions Script
 *
 * Deletes all transactions and transaction splits from the database.
 * Useful for testing AI categorization from scratch.
 *
 * Usage: yarn clear-transactions
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { fromIni } from '@aws-sdk/credential-providers';

const REGION = 'us-east-1';
const PROFILE = 'solotech';

// Table names - update these to match your sandbox
const TRANSACTION_TABLE = process.env.TRANSACTION_TABLE || 'Transaction-mf62wubvgrdnxhhqstqlaqtpsy-NONE';
const SPLIT_TABLE = process.env.SPLIT_TABLE || 'TransactionSplit-mf62wubvgrdnxhhqstqlaqtpsy-NONE';

const client = new DynamoDBClient({
  region: REGION,
  credentials: fromIni({ profile: PROFILE }),
});

const docClient = DynamoDBDocumentClient.from(client);

/**
 * Delete items in batches of 25 (DynamoDB limit)
 */
const batchDelete = async (tableName: string, items: any[], keyField: string): Promise<number> => {
  let deletedCount = 0;

  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25);

    const deleteRequests = batch.map(item => ({
      DeleteRequest: {
        Key: { [keyField]: item[keyField] }
      }
    }));

    try {
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [tableName]: deleteRequests
        }
      }));

      deletedCount += batch.length;
      console.log(`Deleted ${deletedCount} items from ${tableName}...`);
    } catch (error) {
      console.error(`Failed to delete batch from ${tableName}:`, error);
      throw error;
    }
  }

  return deletedCount;
};

/**
 * Scan and delete all items from a table
 */
const clearTable = async (tableName: string, keyField: string): Promise<number> => {
  console.log(`\nScanning ${tableName}...`);

  let items: any[] = [];
  let lastEvaluatedKey: any = undefined;

  // Scan all items
  do {
    const response = await docClient.send(new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey
    }));

    if (response.Items) {
      items.push(...response.Items);
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`Found ${items.length} items in ${tableName}`);

  if (items.length === 0) {
    console.log('No items to delete');
    return 0;
  }

  // Delete all items
  const deletedCount = await batchDelete(tableName, items, keyField);
  console.log(`✅ Deleted ${deletedCount} items from ${tableName}`);

  return deletedCount;
};

const main = async () => {
  console.log('🗑️  Clear Transactions and Splits\n');
  console.log(`Region: ${REGION}`);
  console.log(`Profile: ${PROFILE}`);
  console.log(`Transaction Table: ${TRANSACTION_TABLE}`);
  console.log(`Split Table: ${SPLIT_TABLE}`);

  try {
    // Clear splits first (foreign key dependency)
    const splitsDeleted = await clearTable(SPLIT_TABLE, 'splitId');

    // Then clear transactions
    const transactionsDeleted = await clearTable(TRANSACTION_TABLE, 'transactionId');

    console.log('\n✅ Complete!');
    console.log(`Total deleted: ${transactionsDeleted} transactions, ${splitsDeleted} splits`);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
};

main();
