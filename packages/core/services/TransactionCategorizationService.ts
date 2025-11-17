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
   *
   * Optimization: If both existing and new splits are single-category,
   * update the existing split instead of delete+create
   */
  private createSplitsFromAI = async (
    transaction: Transaction,
    result: CategorizationResult
  ): Promise<void> => {
    const now = new Date();

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

    // Fetch existing splits to check if we can optimize with update
    const existingSplits = await this.splitService.findByTransaction(transaction.transactionId);

    // Optimization: If both existing and new are single-category, update instead of delete+create
    if (existingSplits.length === 1 && result.splits.length === 1) {
      const existingSplit = existingSplits[0];
      const aiSplit = result.splits[0];
      const splitAmount = transaction.amount; // Single split = 100% of amount

      await this.splitService.update(existingSplit.splitId, {
        category: aiSplit.category,
        amount: splitAmount,
        percentage: aiSplit.percentage,
        aiGenerated: true,
        confidence: aiSplit.confidence,
        updatedAt: now,
      });

      console.log(
        `[Categorization] Updated existing split for transaction ${transaction.transactionId} (${existingSplit.category} → ${aiSplit.category})`
      );
      return;
    }

    // Multi-category or mismatch: delete existing and create new splits
    await this.splitService.deleteByTransaction(transaction.transactionId);
    console.log(`[Categorization] Deleted ${existingSplits.length} existing splits for transaction ${transaction.transactionId}`);

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
      `[Categorization] Created ${splits.length} AI splits for transaction ${transaction.transactionId}`
    );
  };

  /**
   * Find transactions with uncategorized splits (need AI categorization)
   *
   * Optimization: Uses GSI to query splits by category="Uncategorized" directly
   * instead of fetching all splits and filtering in memory.
   */
  private findUncategorizedTransactions = async (
    organizationId: string
  ): Promise<Transaction[]> => {
    const findStart = Date.now();

    // Fetch ALL uncategorized splits using cursor pagination
    // Optimize: Extract transaction IDs immediately instead of storing full splits
    const splitStart = Date.now();
    const transactionIds = new Set<string>();
    let cursor: string | undefined;
    let pageCount = 0;
    let totalSplits = 0;

    do {
      const result = await this.splitService.findByOrganizationAndCategory(
        organizationId,
        'Uncategorized',
        1000, // Fetch 1000 at a time for efficiency
        cursor
      );

      // Extract transaction IDs immediately and discard full split objects
      result.items.forEach(split => transactionIds.add(split.transactionId));
      totalSplits += result.items.length;
      cursor = result.nextCursor;
      pageCount++;
    } while (cursor);

    console.log(`[CATEGORIZATION] Queried ${totalSplits} uncategorized splits via GSI in ${pageCount} pages (${Date.now() - splitStart}ms)`);
    console.log(`[CATEGORIZATION] Found ${transactionIds.size} unique transactions with uncategorized splits`);

    // Fetch only those transactions in parallel batches
    const txStart = Date.now();
    const txIds = Array.from(transactionIds);
    const BATCH_SIZE = 50; // Parallel requests
    const transactions: Transaction[] = [];

    for (let i = 0; i < txIds.length; i += BATCH_SIZE) {
      const batch = txIds.slice(i, i + BATCH_SIZE);
      const txResults = await Promise.all(
        batch.map(id => this.transactionService.findById(id))
      );
      transactions.push(...txResults.filter(tx => tx !== null) as Transaction[]);
    }

    console.log(`[CATEGORIZATION] Fetched ${transactions.length} transactions in ${Math.ceil(txIds.length / BATCH_SIZE)} batches (${Date.now() - txStart}ms)`);
    console.log(`[CATEGORIZATION] Total findUncategorized time: ${Date.now() - findStart}ms`);

    return transactions;
  };
}
