/**
 * Transaction Categorization Service
 *
 * Uses AI to automatically categorize transactions and create splits.
 * Supports both single-category (100%) and multi-category splits.
 */

import type { Transaction, TransactionSplit } from '../models';
import type { TransactionCategory } from '../models/TransactionCategory';
import { CATEGORY_METADATA } from '../models/TransactionCategory';
import { v4 as uuidv4 } from 'uuid';
import type { TransactionService } from './TransactionService';
import type { TransactionSplitService } from './TransactionSplitService';

/**
 * AI categorization result for a single transaction
 */
export interface CategorizationResult {
  transactionId: string;
  splits: Array<{
    category: TransactionCategory;
    percentage: number; // 0-100, must sum to 100
    confidence: number; // 0-100
  }>;
}

/**
 * Interface for AI provider (Bedrock, OpenAI, etc.)
 */
export interface AICategorizationProvider {
  categorizeTransactions(
    transactions: Transaction[]
  ): Promise<CategorizationResult[]>;
}

/**
 * Service for AI-powered transaction categorization
 */
export class TransactionCategorizationService {
  constructor(
    private transactionService: TransactionService,
    private splitService: TransactionSplitService<any>,
    private aiProvider: AICategorizationProvider
  ) {}

  /**
   * Categorize uncategorized transactions for an organization
   */
  public categorizeUncategorized = async (
    organizationId: string
  ): Promise<{
    processed: number;
    splitsCreated: number;
    errors: number;
  }> => {
    const perfStart = Date.now();
    console.log('[AI CATEGORIZATION] Starting AI categorization process');

    // Find all transactions without splits
    const findStart = Date.now();
    const uncategorized =
      await this.findUncategorizedTransactions(organizationId);
    console.log(`[AI CATEGORIZATION] Found ${uncategorized.length} uncategorized transactions in ${Date.now() - findStart}ms`);

    if (uncategorized.length === 0) {
      console.log('[AI CATEGORIZATION] No uncategorized transactions, skipping AI categorization');
      return { processed: 0, splitsCreated: 0, errors: 0 };
    }

    // Get AI categorizations in batches
    const batchSize = 50;
    const results: CategorizationResult[] = [];
    let errors = 0;

    const aiStart = Date.now();
    console.log(`[AI CATEGORIZATION] Processing ${uncategorized.length} transactions in batches of ${batchSize}`);

    for (let i = 0; i < uncategorized.length; i += batchSize) {
      const batch = uncategorized.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(uncategorized.length / batchSize);

      const batchStart = Date.now();
      console.log(`[AI CATEGORIZATION] Processing batch ${batchNum}/${totalBatches} (${batch.length} transactions)...`);

      try {
        const batchResults =
          await this.aiProvider.categorizeTransactions(batch);
        results.push(...batchResults);
        console.log(`[AI CATEGORIZATION] Batch ${batchNum}/${totalBatches} completed in ${Date.now() - batchStart}ms (${batchResults.length} results)`);
      } catch (error) {
        console.error(
          `[AI CATEGORIZATION] Failed to categorize batch ${batchNum}/${totalBatches}:`,
          error
        );
        errors += batch.length;
      }
    }
    console.log(`[AI CATEGORIZATION] AI inference completed in ${Date.now() - aiStart}ms (${results.length} transactions categorized)`);

    // Create splits from AI results
    let splitsCreated = 0;
    const splitsStart = Date.now();
    console.log(`[AI CATEGORIZATION] Creating splits for ${results.length} categorized transactions...`);

    for (const result of results) {
      try {
        const transaction = uncategorized.find(
          (t) => t.transactionId === result.transactionId
        );
        if (!transaction) continue;

        await this.createSplitsFromAI(transaction, result);
        splitsCreated += result.splits.length;
      } catch (error) {
        console.error(
          `[AI CATEGORIZATION] Failed to create splits for ${result.transactionId}:`,
          error
        );
        errors++;
      }
    }
    console.log(`[AI CATEGORIZATION] Created ${splitsCreated} splits in ${Date.now() - splitsStart}ms`);
    console.log(`[AI CATEGORIZATION] Total AI categorization time: ${Date.now() - perfStart}ms (${results.length} transactions, ${splitsCreated} splits, ${errors} errors)`);

    return {
      processed: results.length,
      splitsCreated,
      errors,
    };
  };

  /**
   * Categorize specific transactions
   */
  public categorizeTransactions = async (
    transactions: Transaction[]
  ): Promise<void> => {
    if (transactions.length === 0) return;

    // Get AI categorizations
    const results = await this.aiProvider.categorizeTransactions(transactions);

    // Create splits
    for (const result of results) {
      const transaction = transactions.find(
        (t) => t.transactionId === result.transactionId
      );
      if (!transaction) continue;

      await this.createSplitsFromAI(transaction, result);
    }
  };

  /**
   * Create transaction splits from AI categorization result
   * Replaces any existing uncategorized splits
   */
  private createSplitsFromAI = async (
    transaction: Transaction,
    result: CategorizationResult
  ): Promise<void> => {
    const now = new Date();

    // Delete existing splits for this transaction (they're all "Uncategorized")
    await this.splitService.deleteByTransaction(transaction.transactionId);
    console.log(`[Categorization] Deleted existing uncategorized splits for transaction ${transaction.transactionId}`);

    // Validate percentages sum to 100
    const totalPercentage = result.splits.reduce(
      (sum, s) => sum + s.percentage,
      0
    );
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error(
        `Split percentages must sum to 100, got ${totalPercentage}`
      );
    }

    // Create splits
    const splits: TransactionSplit[] = result.splits.map((aiSplit) => {
      const splitAmount = Math.round(
        (transaction.amount * aiSplit.percentage) / 100
      );

      return {
        splitId: uuidv4(),
        transactionId: transaction.transactionId,
        organizationId: transaction.organizationId,
        category: aiSplit.category,
        amount: splitAmount,
        percentage: aiSplit.percentage,
        aiGenerated: true,
        confidence: aiSplit.confidence,
        notes: undefined,
        createdAt: now,
        updatedAt: now,
        profileOwner: transaction.profileOwner,
      };
    });

    // Validate amounts sum to transaction amount (accounting for rounding)
    const totalAmount = splits.reduce((sum, s) => sum + s.amount, 0);
    if (totalAmount !== transaction.amount) {
      // Adjust last split to match exactly
      const diff = transaction.amount - totalAmount;
      splits[splits.length - 1].amount += diff;
    }

    // Save all splits
    for (const split of splits) {
      await this.splitService.create(split);
    }

    console.log(
      `Created ${splits.length} AI splits for transaction ${transaction.transactionId}`
    );
  };

  /**
   * Find transactions with uncategorized splits (need AI categorization)
   */
  private findUncategorizedTransactions = async (
    organizationId: string
  ): Promise<Transaction[]> => {
    const findStart = Date.now();

    // Get all transactions for org
    const txStart = Date.now();
    const txResult = await this.transactionService.findByOrganization(
      organizationId,
      10000
    );
    const allTransactions = txResult.items;
    console.log(`[CATEGORIZATION] Fetched ${allTransactions.length} transactions in ${Date.now() - txStart}ms`);

    // Get all existing splits
    const splitStart = Date.now();
    const splitResult = await this.splitService.findByOrganization(
      organizationId,
      100000
    );
    const existingSplits = splitResult.items;
    console.log(`[CATEGORIZATION] Fetched ${existingSplits.length} splits in ${Date.now() - splitStart}ms`);

    // Build map of transactionId -> splits
    const mapStart = Date.now();
    const splitsByTransaction = new Map<string, TransactionSplit[]>();
    for (const split of existingSplits) {
      const splits = splitsByTransaction.get(split.transactionId) || [];
      splits.push(split);
      splitsByTransaction.set(split.transactionId, splits);
    }
    console.log(`[CATEGORIZATION] Built split lookup map in ${Date.now() - mapStart}ms`);

    // Find transactions that need AI categorization:
    // Transactions with ONLY "Uncategorized" splits (auto-created defaults by TransactionService)
    const filterStart = Date.now();
    const uncategorized = allTransactions.filter((tx) => {
      const splits = splitsByTransaction.get(tx.transactionId);

      // No splits - needs categorization (edge case, shouldn't happen normally)
      if (!splits || splits.length === 0) {
        return true;
      }

      // Has only uncategorized splits - needs AI to improve
      return splits.every(s => s.category === 'Uncategorized');
    });
    console.log(`[CATEGORIZATION] Filtered ${uncategorized.length} uncategorized transactions in ${Date.now() - filterStart}ms`);
    console.log(`[CATEGORIZATION] Total findUncategorized time: ${Date.now() - findStart}ms`);

    return uncategorized;
  };
}
