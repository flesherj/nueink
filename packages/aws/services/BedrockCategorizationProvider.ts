/**
 * Bedrock AI Categorization Provider
 *
 * Implements AICategorizationProvider using AWS Bedrock (Claude)
 */

import type { Transaction } from '@nueink/core';
import type {
  AICategorizationProvider,
  CategorizationResult,
} from '@nueink/core/services/TransactionCategorizationService';
import { CATEGORY_METADATA } from '@nueink/core/models/TransactionCategory';
import { BedrockService } from './BedrockService';

/**
 * Bedrock-powered transaction categorization
 */
export class BedrockCategorizationProvider implements AICategorizationProvider {
  private bedrock: BedrockService;
  private categories: string[];

  constructor() {
    this.bedrock = new BedrockService();
    this.categories = CATEGORY_METADATA.map(m => m.category);
  }

  /**
   * Categorize transactions using Claude
   */
  public categorizeTransactions = async (
    transactions: Transaction[]
  ): Promise<CategorizationResult[]> => {
    const startTime = Date.now();
    console.log(`[BEDROCK] Invoking Claude 3.5 Haiku for ${transactions.length} transactions...`);

    // Prepare transaction data for AI
    const txData = transactions.map((tx, index) => ({
      index,
      id: tx.transactionId,
      merchant: tx.merchantName || tx.name,
      amount: tx.amount / 100, // Convert cents to dollars (preserve sign for income vs expense)
      name: tx.name,
      date: tx.date.toISOString().split('T')[0],
      isTransfer: !!(tx.rawData as any)?.transfer_account_id, // Flag transfers between accounts
    }));

    const prompt = this.buildCategorizationPrompt(txData);
    const promptTokens = Math.ceil(prompt.length / 4); // Rough estimate
    console.log(`[BEDROCK] Prompt size: ${prompt.length} chars (~${promptTokens} tokens)`);

    try {
      const bedrockStart = Date.now();
      const response = await this.bedrock.invokeSimple(prompt, {
        temperature: 0.2, // Low temperature for consistent categorization
        maxTokens: 6000,
      });
      const bedrockTime = Date.now() - bedrockStart;

      console.log(`[BEDROCK] Claude API call completed in ${bedrockTime}ms`);
      console.log(`[BEDROCK] Response size: ${response.length} chars`);

      // Parse JSON response
      const parseStart = Date.now();
      const parsed = JSON.parse(response);
      console.log(`[BEDROCK] JSON parsing completed in ${Date.now() - parseStart}ms`);

      // Map to CategorizationResult format
      const results = parsed.categorizations.map((cat: any) => ({
        transactionId: txData[cat.index].id,
        splits: cat.splits,
      }));

      const totalTime = Date.now() - startTime;
      console.log(`[BEDROCK] Total categorization time: ${totalTime}ms for ${transactions.length} transactions (${Math.round(totalTime / transactions.length)}ms per transaction)`);

      return results;
    } catch (error) {
      console.error('[BEDROCK] Categorization failed:', error);
      throw error;
    }
  };

  /**
   * Build AI prompt for categorization
   */
  private buildCategorizationPrompt = (txData: any[]): string => {
    return `You are a financial transaction categorization expert. Your task is to categorize transactions and optionally split them across multiple categories when appropriate.

AVAILABLE CATEGORIES:
${this.categories.join('\n')}

TRANSACTIONS TO CATEGORIZE:
${JSON.stringify(txData, null, 2)}

CATEGORIZATION RULES:

**CRITICAL FIRST RULE - TRANSFERS:**
- **If isTransfer is true, ALWAYS categorize as "Transfer: Between Accounts" (100% confidence)**
- Transfers are money moving between accounts (not income or expense)
- Do NOT categorize transfers as income, even if positive amount
- Example: {amount: +500, isTransfer: true} → 100% "Transfer: Between Accounts"

**SECOND RULE - INCOME DETECTION:**
- **ANY positive amount (> $0) that is NOT a transfer MUST be categorized as Income**
- Positive amounts are NEVER expenses - they are income deposits
- Merchant names like "Check #", "Payroll", "Direct Deposit", "Deposit" → "Income: Salary" (95-100% confidence)
- Other positive amounts → "Income: Other" (90-95% confidence)
- Examples:
  * {amount: +675.41, merchant: "Target Check #9100001"} → 100% "Income: Salary"
  * {amount: +2500, merchant: "PAYROLL DEPOSIT"} → 100% "Income: Salary"
  * {amount: +25.50, merchant: "Refund"} → 100% "Income: Other"
- **DO NOT categorize positive amounts as Shopping, Food, or any expense category**

1. **Single Category (Most Common)**
   - Assign 100% to one category when the transaction is clearly one type
   - Only applies to NEGATIVE amounts (expenses)
   - Examples:
     * Shell Gas Station -$45.00 → 100% "Transportation: Gas/Fuel"
     * Netflix -$15.99 → 100% "Entertainment: Streaming"
     * Publix -$87.50 → 100% "Food: Groceries"

2. **Split Categories (Use Sparingly)**
   - Only applies to NEGATIVE amounts (expenses)
   - **Only split amounts $75 or more** - smaller amounts are likely single-purpose purchases
   - Without itemized receipt data, be conservative - prefer single category
   - Split only when confident it's a multi-category shopping trip at stores like Walmart, Target, Amazon
   - **For amounts under $75, choose the MOST LIKELY single category**
   - Examples of when to split:
     * Walmart -$150 → 70% "Food: Groceries" + 30% "Shopping: Home Goods"
     * Amazon -$200 → 60% "Shopping: Electronics" + 40% "Shopping: General"
     * Target -$125 → 60% "Food: Groceries" + 40% "Shopping: General"
   - Examples of when NOT to split:
     * Target -$35.88 → 100% "Food: Groceries" (small amount, likely focused trip)
     * Walmart -$42 → 100% "Food: Groceries" (under threshold)
     * Amazon -$65 → 100% "Shopping: General" (under threshold)

3. **Confidence Scoring (0-100)**
   - 95-100: Obvious (Income deposits, gas station, specific subscription, mortgage)
   - 80-94: Very likely (Restaurant, grocery store with clear name)
   - 60-79: Probable (Could be multiple things, but one is most likely)
   - Below 60: Use "Uncategorized" instead

4. **Special Cases (Negative amounts only)**
   - Mortgage companies (Freedom Mortgage, NewRez, etc.) → "Housing: Mortgage/Rent"
   - Credit card/loan payments → "Bills: Credit Card Payment" or "Bills: Loan Payment"
   - Utilities (Electric, Gas companies) → "Housing: Utilities"
   - Phone/Internet providers → "Bills: Phone" or "Bills: Internet"
   - Note: Transfers are handled by isTransfer flag (see FIRST RULE above)

IMPORTANT:
- Return ONLY valid JSON, no markdown, no explanations
- Percentages in each split MUST sum to exactly 100
- If unsure or low confidence (<60), use single split with "Uncategorized"
- Most transactions should be single category (100%)
- Only split when you're confident it's a multi-purpose purchase

RESPONSE FORMAT (valid JSON only):
{
  "categorizations": [
    {
      "index": 0,
      "splits": [
        {"category": "exact category from list", "percentage": 100, "confidence": 95}
      ]
    },
    {
      "index": 1,
      "splits": [
        {"category": "Food: Groceries", "percentage": 60, "confidence": 80},
        {"category": "Shopping: Home Goods", "percentage": 40, "confidence": 75}
      ]
    }
  ]
}`;
  };
}
