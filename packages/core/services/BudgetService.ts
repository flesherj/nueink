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
   * Create a baseline budget from a financial analysis
   * Uses current spending patterns as the budget baseline
   *
   * @param analysis Financial analysis to convert
   * @param name Optional budget name (defaults to period-based name)
   * @returns Created baseline budget
   */
  public createBaselineFromAnalysis = async (
    analysis: FinancialAnalysis,
    name?: string
  ): Promise<Budget> => {
    // Generate budget name if not provided
    const budgetName = name || this.generateBudgetName(analysis.periodStart, analysis.periodEnd);

    // Convert spending categories to budget categories
    const categoryBudgets: CategoryBudget[] = analysis.spendingByCategory.map((spending) => ({
      category: spending.category,
      budgetAmount: spending.amount,          // Use current spending as baseline
      currentSpending: spending.amount,       // Same as budgetAmount for baseline
      percentage: spending.percentage,
      trend: spending.trend,
      notes: `Based on ${spending.transactionCount} transactions`,
    }));

    // Create baseline budget
    const budget: Budget = {
      budgetId: this.generateBudgetId(),
      accountId: analysis.accountId,
      organizationId: analysis.organizationId,
      name: budgetName,
      periodStart: analysis.periodStart,
      periodEnd: analysis.periodEnd,
      categoryBudgets,
      totalBudget: analysis.totalSpending,
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
