import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { AIInterestRateEstimator, InterestRateEstimate, FinancialAccount } from '@nueink/core';

/**
 * Bedrock-powered interest rate estimator
 * Uses Claude to estimate current market rates for debt accounts
 */
export class BedrockInterestRateEstimator implements AIInterestRateEstimator {
  constructor(private bedrock: BedrockRuntimeClient) {}

  public estimateInterestRate = async (
    account: FinancialAccount,
    currentDate: Date = new Date()
  ): Promise<InterestRateEstimate> => {
    const estimates = await this.estimateInterestRates([account], currentDate);
    const estimate = estimates.get(account.financialAccountId);

    if (!estimate) {
      throw new Error('Failed to estimate interest rate');
    }

    return estimate;
  };

  public estimateInterestRates = async (
    accounts: FinancialAccount[],
    currentDate: Date = new Date()
  ): Promise<Map<string, InterestRateEstimate>> => {
    if (accounts.length === 0) {
      return new Map();
    }

    const prompt = this.buildPrompt(accounts, currentDate);

    try {
      const response = await this.bedrock.send(
        new InvokeModelCommand({
          modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify({
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 2000,
            temperature: 0.3, // Lower temperature for more consistent estimates
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          }),
        })
      );

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const content = responseBody.content[0].text;

      return this.parseResponse(content, accounts);
    } catch (error) {
      console.error('Error estimating interest rates with Bedrock:', error);
      // Return fallback estimates
      return this.getFallbackEstimates(accounts);
    }
  };

  private buildPrompt = (accounts: FinancialAccount[], currentDate: Date): string => {
    const dateStr = currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const accountsJson = accounts.map((account) => {
      // Extract institution name from rawData if available
      const institutionName = account.rawData?.institution?.name;

      return {
        id: account.financialAccountId,
        type: account.type,
        balance: account.currentBalance ? account.currentBalance / 100 : 0,
        name: account.name,
        officialName: account.officialName,
        institutionName,
        provider: account.provider,
      };
    });

    return `You are a financial analyst estimating current market interest rates for debt accounts as of ${dateStr}.

For each account below, estimate the most likely current APR (Annual Percentage Rate) based on:
1. Current market conditions and Federal Reserve rates as of ${dateStr}
2. Account type (credit cards typically have higher rates than mortgages)
3. Specific institution and account name (e.g., "Chase Sapphire" vs "Amazon Store Card" have different typical rates)
4. Account balance (higher balances might indicate different risk profiles)
5. Whether it's a synced account (Plaid/YNAB) or manual entry
6. Known promotional periods (e.g., CareCredit often has 6-24 month interest-free periods, store cards may have 0% intro APR)

Accounts to analyze:
${JSON.stringify(accountsJson, null, 2)}

Provide your estimates in the following JSON format ONLY (no other text):
{
  "estimates": [
    {
      "accountId": "account-id-here",
      "estimatedRate": 0.1599,
      "confidence": "high|medium|low",
      "reasoning": "Brief explanation of why this rate",
      "marketContext": "Current market conditions affecting this rate",
      "hasPromotionalPeriod": false,
      "promotionalRate": null,
      "promotionalMonths": null,
      "hasDeferredInterest": false
    }
  ]
}

Guidelines:
- Credit cards: typically 15-25% APR (store cards often higher, premium cards often lower)
- Lines of credit: typically 10-18% APR
- Mortgages: typically 6-8% APR (as of late 2024)
- Auto loans: typically 5-9% APR
- Student loans: typically 4-7% APR
- Personal loans: typically 8-15% APR
- Medical debt: often 0% on payment plans (especially CareCredit, which commonly offers 6-24 month interest-free periods)

Special cases to detect:
- CareCredit: Usually 0% for 6, 12, 18, or 24 months, then ~26.99% APR with deferred interest
- Store cards (Amazon, Target, etc.): Often 0% intro APR for 6-12 months, then 20-28% APR
- Premium credit cards (Chase Sapphire, Amex Platinum): Often 18-21% APR
- Balance transfer cards: Often 0% intro APR for 12-21 months, then 15-25% APR

If you detect a likely promotional period based on the account name/institution:
- Set hasPromotionalPeriod to true
- Set promotionalRate (0 for interest-free)
- Set promotionalMonths (estimated duration)
- Set hasDeferredInterest to true if unpaid balance would accrue retroactive interest (common with CareCredit, store cards)

Consider the current economic environment, Federal Reserve rates, and typical lending practices.`;
  };

  private parseResponse = (
    content: string,
    accounts: FinancialAccount[]
  ): Map<string, InterestRateEstimate> => {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('No JSON found in AI response, using fallback');
        return this.getFallbackEstimates(accounts);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const estimates = new Map<string, InterestRateEstimate>();

      for (const estimate of parsed.estimates || []) {
        estimates.set(estimate.accountId, {
          estimatedRate: estimate.estimatedRate,
          confidence: estimate.confidence,
          reasoning: estimate.reasoning,
          marketContext: estimate.marketContext,
          hasPromotionalPeriod: estimate.hasPromotionalPeriod,
          promotionalRate: estimate.promotionalRate,
          promotionalMonths: estimate.promotionalMonths,
          hasDeferredInterest: estimate.hasDeferredInterest,
        });
      }

      // Fill in any missing estimates with fallbacks
      for (const account of accounts) {
        if (!estimates.has(account.financialAccountId)) {
          estimates.set(account.financialAccountId, this.getFallbackEstimate(account));
        }
      }

      return estimates;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.getFallbackEstimates(accounts);
    }
  };

  private getFallbackEstimates = (
    accounts: FinancialAccount[]
  ): Map<string, InterestRateEstimate> => {
    const estimates = new Map<string, InterestRateEstimate>();
    for (const account of accounts) {
      estimates.set(account.financialAccountId, this.getFallbackEstimate(account));
    }
    return estimates;
  };

  private getFallbackEstimate = (account: FinancialAccount): InterestRateEstimate => {
    const fallbackRates: Record<string, number> = {
      credit_card: 0.2099,
      line_of_credit: 0.1249,
      mortgage: 0.0699,
      auto_loan: 0.0699,
      student_loan: 0.0549,
      personal_loan: 0.1149,
      medical_debt: 0.0,
      liability: 0.0999,
    };

    return {
      estimatedRate: fallbackRates[account.type] || 0.1099,
      confidence: 'low',
      reasoning: 'Fallback estimate based on typical rates (AI estimation unavailable)',
    };
  };
}
