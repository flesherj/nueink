import { Institution } from '../models';
import { InstitutionRepository } from '@nueink/aws';
import { InstitutionConverter } from '../converters';

/**
 * Institution service - handles business logic for institution operations
 */
export class InstitutionService {
  private converter: InstitutionConverter;

  constructor(private repository: InstitutionRepository) {
    this.converter = new InstitutionConverter();
  }

  async findById(id: string): Promise<Institution | null> {
    const entity = await this.repository.findById(id);
    return entity ? this.converter.toDomain(entity) : null;
  }

  async findAll(): Promise<Institution[]> {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.converter.toDomain(entity));
  }

  async findByOrganization(organizationId: string): Promise<Institution[]> {
    const entities = await this.repository.findByOrganization(organizationId);
    return entities.map((entity) => this.converter.toDomain(entity));
  }

  async create(institution: Institution): Promise<Institution> {
    const entity = this.converter.toEntity(institution);
    const saved = await this.repository.save(entity);
    return this.converter.toDomain(saved);
  }

  async update(id: string, updates: Partial<Institution>): Promise<Institution> {
    const entityUpdates = this.converter.toEntity(updates as Institution);
    const updated = await this.repository.update(id, entityUpdates);
    return this.converter.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
