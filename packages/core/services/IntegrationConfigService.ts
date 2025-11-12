import { IntegrationConfig } from '../models';
import { IntegrationConfigConverter } from '../converters';
import { IntegrationConfigRepository } from '../repositories';
import { IntegrationConfigEntity } from '@nueink/aws';

/**
 * IntegrationConfig service - handles business logic for integration configuration
 */
export class IntegrationConfigService {
  private converter: IntegrationConfigConverter;

  constructor(private repository: IntegrationConfigRepository<IntegrationConfigEntity>) {
    this.converter = new IntegrationConfigConverter();
  }

  async findById(id: string): Promise<IntegrationConfig | null> {
    const entity = await this.repository.findById(id);
    return entity ? this.converter.toDomain(entity) : null;
  }

  async findAll(): Promise<IntegrationConfig[]> {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.converter.toDomain(entity));
  }

  async findByAccountId(accountId: string): Promise<IntegrationConfig[]> {
    const entities = await this.repository.findByAccountId(accountId);
    return entities.map((entity) => this.converter.toDomain(entity));
  }

  async findByAccountIdAndProvider(accountId: string, provider: string): Promise<IntegrationConfig | null> {
    const entity = await this.repository.findByAccountIdAndProvider(accountId, provider);
    return entity ? this.converter.toDomain(entity) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<IntegrationConfig[]> {
    const entities = await this.repository.findByOrganizationId(organizationId);
    return entities.map((entity) => this.converter.toDomain(entity));
  }

  async findActiveByAccountId(accountId: string): Promise<IntegrationConfig[]> {
    const entities = await this.repository.findActiveByAccountId(accountId);
    return entities.map((entity) => this.converter.toDomain(entity));
  }

  async create(config: IntegrationConfig): Promise<IntegrationConfig> {
    const entity = this.converter.toEntity(config);
    const saved = await this.repository.save(entity);
    return this.converter.toDomain(saved);
  }

  async update(id: string, updates: Partial<IntegrationConfig>): Promise<IntegrationConfig> {
    const entityUpdates = this.converter.toEntity(updates as IntegrationConfig);
    const updated = await this.repository.update(id, entityUpdates);
    return this.converter.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
