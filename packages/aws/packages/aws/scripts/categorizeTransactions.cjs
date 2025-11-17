#!/usr/bin/env node
/**
 * AI Transaction Categorization using AWS Bedrock
 *
 * Automatically categorizes uncategorized transactions using Claude AI
 */

const fs = require('fs');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

// ========== Configuration ==========

const AWS_REGION = 'us-east-1';
const MODEL_ID = 'us.anthropic.claude-3-5-haiku-20241022-v1:0'; // Fast and cheap for categorization
const BATCH_SIZE = 50; // Categorize 50 transactions at a time

// ========== Initialize Bedrock Client ==========

const bedrockClient = new BedrockRuntimeClient({
  region: AWS_REGION,
});

// ========== Standard Categories ==========

const CATEGORIES = [
  'Housing: Mortgage/Rent',
  'Housing: Utilities',
  'Housing: Insurance',
  'Housing: Maintenance',
  'Transportation: Car Payment',
  'Transportation: Gas/Fuel',
  'Transportation: Insurance',
  'Transportation: Maintenance',
  'Transportation: Public Transit',
  'Food: Groceries',
  'Food: Restaurants',
  'Food: Coffee/Snacks',
  'Food: Delivery',
  'Healthcare: Insurance',
  'Healthcare: Doctor/Dentist',
  'Healthcare: Pharmacy',
  'Personal: Clothing',
  'Personal: Hair/Beauty',
  'Personal: Subscriptions',
  'Entertainment: Streaming',
  'Entertainment: Movies/Events',
  'Entertainment: Travel',
  'Shopping: General',
  'Shopping: Electronics',
  'Shopping: Home Goods',
  'Bills: Phone',
  'Bills: Internet',
  'Bills: Credit Card Payment',
  'Bills: Loan Payment',
  'Kids: Childcare',
  'Kids: School',
  'Kids: Activities',
  'Pets: Food',
  'Pets: Veterinary',
  'Charity: Donations',
  'Uncategorized',
];

// ========== AI Categorization ==========

/**
 * Call Bedrock to categorize a batch of transactions
 */
const categorizeBatch = async (transactions) => {
  // Prepare transaction list for AI
  const txList = transactions.map((tx, i) => ({
    index: i,
    merchant: tx.merchant,
    amount: (Math.abs(tx.amount) / 100).toFixed(2),
    name: tx.name,
  }));

  const prompt = `You are a financial transaction categorization expert. Categorize each transaction into ONE of the following categories:

${CATEGORIES.join('\n')}

Here are the transactions to categorize (JSON format):
${JSON.stringify(txList, null, 2)}

IMPORTANT RULES:
1. Return ONLY valid JSON - no explanations, no markdown
2. Match each transaction index to exactly ONE category from the list above
3. Use common sense: "Walmart" = Food: Groceries, "Shell" = Transportation: Gas/Fuel, "Netflix" = Entertainment: Streaming
4. Mortgage companies = Housing: Mortgage/Rent
5. Check numbers and bank transfers for payments = Bills: Credit Card Payment or Bills: Loan Payment
6. If truly uncertain, use "Uncategorized"

Return format (MUST be valid JSON):
{
  "categorizations": [
    {"index": 0, "category": "exact category from list"},
    {"index": 1, "category": "exact category from list"}
  ]
}`;

  const requestBody = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 4000,
    temperature: 0.3, // Low temperature for consistent categorization
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  };

  try {
    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const aiResponse = responseBody.content[0].text;

    // Parse AI response
    const result = JSON.parse(aiResponse);

    // Apply categories to transactions
    result.categorizations.forEach(({ index, category }) => {
      if (transactions[index]) {
        transactions[index].aiCategory = category;
      }
    });

    return transactions;
  } catch (error) {
    console.error('Bedrock API error:', error);
    throw error;
  }
};

/**
 * Categorize all transactions in batches
 */
const categorizeAllTransactions = async (transactions) => {
  const categorized = [];
  const total = transactions.length;

  console.log(`\n🤖 Categorizing ${total} transactions using Claude AI...\n`);

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(total / BATCH_SIZE);

    console.log(`   Processing batch ${batchNum}/${totalBatches} (${batch.length} transactions)...`);

    const categorizedBatch = await categorizeBatch(batch);
    categorized.push(...categorizedBatch);

    // Small delay to avoid rate limits
    if (i + BATCH_SIZE < total) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return categorized;
};

// ========== Main Script ==========

const main = async () => {
  try {
    console.log('\n🔍 NueInk AI Transaction Categorization\n');
    console.log('═'.repeat(80));

    // Load transactions
    const allTransactions = JSON.parse(fs.readFileSync('/tmp/transactions.json', 'utf8'));

    // Filter to actual spending transactions (same as analyze.cjs)
    const isActualSpending = (tx) => {
      if (tx.amount >= 0) return false;
      if (tx.merchant.includes('Starting Balance')) return false;
      if (tx.merchant.includes('Transfer to') || tx.merchant.includes('Transfer from')) return false;
      if (tx.category && tx.category.includes('Inflow')) return false;
      return true;
    };

    const transactions = allTransactions.filter(isActualSpending);

    console.log(`\n✅ Loaded ${transactions.length} spending transactions`);
    console.log(`   Using model: ${MODEL_ID}\n`);
    console.log('═'.repeat(80));

    // Categorize using AI
    const categorized = await categorizeAllTransactions(transactions);

    console.log('\n✅ Categorization complete!\n');
    console.log('═'.repeat(80));

    // Show sample results
    console.log('\n📊 Sample categorizations:\n');
    categorized.slice(0, 10).forEach((tx, i) => {
      console.log(`   ${i + 1}. ${tx.merchant}`);
      console.log(`      Amount: $${(Math.abs(tx.amount) / 100).toFixed(2)}`);
      console.log(`      Category: ${tx.aiCategory || 'NOT CATEGORIZED'}`);
      console.log('');
    });

    // Save categorized transactions
    fs.writeFileSync('/tmp/transactions_categorized.json', JSON.stringify(categorized, null, 2));

    console.log('═'.repeat(80));
    console.log(`\n💾 Saved categorized transactions to /tmp/transactions_categorized.json\n`);

    // Calculate category distribution
    const categoryCount = {};
    categorized.forEach(tx => {
      const cat = tx.aiCategory || 'NOT CATEGORIZED';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    console.log('📈 Category distribution:\n');
    Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        const percent = ((count / categorized.length) * 100).toFixed(1);
        console.log(`   ${category}: ${count} (${percent}%)`);
      });

    console.log('\n✨ Done!\n');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
};

main();
