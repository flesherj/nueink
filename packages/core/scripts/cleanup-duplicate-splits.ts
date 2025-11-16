/**
 * Cleanup Script: Remove Duplicate Uncategorized Splits
 *
 * This script fixes transactions that have duplicate Uncategorized splits
 * caused by the bug where re-syncing would create additional default splits.
 *
 * Run this once after deploying the fix to clean up existing data.
 */

export interface CleanupResult {
  transactionsChecked: number;
  duplicatesFound: number;
  duplicatesRemoved: number;
  errors: Array<{ transactionId: string; error: string }>;
}

/**
 * Remove duplicate Uncategorized splits from a transaction
 * Keeps only one Uncategorized split (the most recent one)
 */
export const cleanupDuplicateSplits = async (
  transactionId: string,
  splits: Array<{ splitId: string; category: string; createdAt: Date }>,
  deleteSplit: (splitId: string) => Promise<void>
): Promise<number> => {
  // Find all Uncategorized splits
  const uncategorizedSplits = splits
    .filter(s => s.category === 'Uncategorized')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first

  // If there's more than one Uncategorized split, remove the duplicates
  if (uncategorizedSplits.length > 1) {
    const [keep, ...remove] = uncategorizedSplits;

    console.log(`Transaction ${transactionId}: Found ${uncategorizedSplits.length} Uncategorized splits, keeping newest (${keep.splitId})`);

    // Delete duplicates
    for (const split of remove) {
      await deleteSplit(split.splitId);
      console.log(`  - Deleted duplicate split ${split.splitId}`);
    }

    return remove.length;
  }

  return 0;
};

/**
 * Run cleanup on all transactions for an organization
 */
export const cleanupOrganizationSplits = async (
  organizationId: string,
  getTransactions: () => Promise<Array<{ transactionId: string }>>,
  getSplits: (transactionId: string) => Promise<Array<{ splitId: string; category: string; createdAt: Date }>>,
  deleteSplit: (splitId: string) => Promise<void>
): Promise<CleanupResult> => {
  const result: CleanupResult = {
    transactionsChecked: 0,
    duplicatesFound: 0,
    duplicatesRemoved: 0,
    errors: [],
  };

  try {
    const transactions = await getTransactions();
    console.log(`Checking ${transactions.length} transactions for duplicate Uncategorized splits...`);

    for (const tx of transactions) {
      result.transactionsChecked++;

      try {
        const splits = await getSplits(tx.transactionId);
        const uncategorizedCount = splits.filter(s => s.category === 'Uncategorized').length;

        if (uncategorizedCount > 1) {
          result.duplicatesFound++;
          const removed = await cleanupDuplicateSplits(tx.transactionId, splits, deleteSplit);
          result.duplicatesRemoved += removed;
        }
      } catch (error: any) {
        console.error(`Error cleaning up transaction ${tx.transactionId}:`, error);
        result.errors.push({
          transactionId: tx.transactionId,
          error: error.message || 'Unknown error',
        });
      }
    }

    console.log('\nCleanup Summary:');
    console.log(`- Transactions checked: ${result.transactionsChecked}`);
    console.log(`- Transactions with duplicates: ${result.duplicatesFound}`);
    console.log(`- Duplicate splits removed: ${result.duplicatesRemoved}`);
    console.log(`- Errors: ${result.errors.length}`);

    return result;
  } catch (error: any) {
    console.error('Cleanup failed:', error);
    throw error;
  }
};
