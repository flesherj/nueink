import { Budget, CategoryBudget, FinancialAnalysis } from '../models';
import { BudgetConverter } from '../converters';
import { BudgetRepository } from '../repositories';
import { BudgetEntity } from '@nueink/aws';

/**
 * Budget service - handles business logic for budget operations
 */
export class BudgetService {
  private converter: BudgetConverter;

  constructor(private repository: BudgetRepository<BudgetEntity>) {
    this.converter = new BudgetConverter();
  }

  public findById = async (id: string): Promise<Budget | null> => {
    const entity = await this.repository.findById(id);
    return entity ? this.converter.toDomain(entity) : null;
  };

  public findAll = async (): Promise<Budget[]> => {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findByOrganization = async (organizationId: string): Promise<Budget[]> => {
    const entities = await this.repository.findByOrganization(organizationId);
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findActiveBudget = async (organizationId: string): Promise<Budget | null> => {
    const entity = await this.repository.findActiveByOrganization(organizationId);
    return entity ? this.converter.toDomain(entity) : null;
  };

  public create = async (budget: Budget): Promise<Budget> => {
    const entity = this.converter.toEntity(budget);
    const saved = await this.repository.save(entity);
    return this.converter.toDomain(saved);
  };

  public update = async (id: string, updates: Partial<Budget>): Promise<Budget> => {
    const entityUpdates = this.converter.toEntity(updates as Budget);
    const updated = await this.repository.update(id, entityUpdates);
    return this.converter.toDomain(updated);
  };

  public delete = async (id: string): Promise<void> => {
    await this.repository.delete(id);
  };

  /**
   * Create a baseline monthly budget from a financial analysis
   * Uses monthly averages from historical spending patterns
   *
   * @param analysis Financial analysis with monthly averages
   * @param name Optional budget name (defaults to "Monthly Budget")
   * @returns Created baseline monthly budget
   */
  public createBaselineFromAnalysis = async (
    analysis: FinancialAnalysis,
    name?: string
  ): Promise<Budget> => {
    // Generate budget name - emphasize it's a monthly budget
    const budgetName =
      name ||
      this.generateMonthlyBudgetName(
        analysis.periodStart,
        analysis.periodEnd,
        analysis.monthsAnalyzed
      );

    // Convert spending categories to monthly budget categories
    // Use monthly averages instead of period totals
    const categoryBudgets: CategoryBudget[] = analysis.spendingByCategory.map((spending) => ({
      category: spending.category,
      budgetAmount: spending.monthlyAverage, // Monthly average, not period total
      currentSpending: 0, // Reset for new budget period
      percentage: spending.percentage,
      trend: spending.trend,
      notes: `Based on ${spending.transactionCount} transactions over ${analysis.monthsAnalyzed} months`,
    }));

    // Calculate current month period for the budget
    // Budget is for the current/upcoming month
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1); // First of month
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last of month

    // Calculate surplus (income - spending)
    const monthlyIncome = analysis.monthlyAverageIncome;
    const surplus = monthlyIncome - analysis.monthlyAverageSpending;

    // Create baseline monthly budget
    const budget: Budget = {
      budgetId: this.generateBudgetId(),
      accountId: analysis.accountId,
      organizationId: analysis.organizationId,
      name: budgetName,
      periodStart, // Current month start
      periodEnd, // Current month end
      categoryBudgets,
      totalBudget: analysis.monthlyAverageSpending, // Monthly average, not period total
      monthlyIncome, // Average monthly income from analysis
      surplus, // Income - spending
      status: 'baseline',
      sourceAnalysisId: analysis.analysisId,
      createdAt: new Date(),
      updatedAt: new Date(),
      profileOwner: analysis.profileOwner,
    };

    // Save and return
    return this.create(budget);
  };

  /**
   * Generate a budget ID
   */
  private generateBudgetId = (): string => {
    return `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * Generate a monthly budget name based on analysis period
   * Examples:
   *   - "Monthly Budget (Based on 12 months)"
   *   - "Monthly Budget (Based on Jan-Dec 2024)"
   */
  private generateMonthlyBudgetName = (
    analysisStart: Date,
    analysisEnd: Date,
    monthsAnalyzed: number
  ): string => {
    const startMonth = analysisStart.toLocaleDateString('en-US', { month: 'short' });
    const startYear = analysisStart.getFullYear();
    const endMonth = analysisEnd.toLocaleDateString('en-US', { month: 'short' });
    const endYear = analysisEnd.getFullYear();

    // Simple format: "Monthly Budget (Based on X months)"
    if (monthsAnalyzed <= 3) {
      return `Monthly Budget (Based on ${monthsAnalyzed} months)`;
    }

    // Include date range for longer periods
    if (startYear === endYear) {
      return `Monthly Budget (Based on ${startMonth}-${endMonth} ${startYear})`;
    }

    return `Monthly Budget (Based on ${startMonth} ${startYear}-${endMonth} ${endYear})`;
  };

  /**
   * Generate a budget name based on the period
   * Examples: "January 2024 Budget", "Q1 2024 Budget"
   */
  private generateBudgetName = (periodStart: Date, periodEnd: Date): string => {
    const startMonth = periodStart.toLocaleDateString('en-US', { month: 'long' });
    const startYear = periodStart.getFullYear();
    const endMonth = periodEnd.toLocaleDateString('en-US', { month: 'long' });
    const endYear = periodEnd.getFullYear();

    // If same month and year, use single month name
    if (startMonth === endMonth && startYear === endYear) {
      return `${startMonth} ${startYear} Budget`;
    }

    // If same year but different months
    if (startYear === endYear) {
      return `${startMonth} - ${endMonth} ${startYear} Budget`;
    }

    // Different years
    return `${startMonth} ${startYear} - ${endMonth} ${endYear} Budget`;
  };
}
