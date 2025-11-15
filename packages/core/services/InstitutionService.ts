import { Institution } from '../models';
import { InstitutionConverter } from '../converters';
import { InstitutionRepository } from '../repositories';
import { InstitutionEntity } from '@nueink/aws';

/**
 * Institution service - handles business logic for institution operations
 */
export class InstitutionService {
  private converter: InstitutionConverter;

  constructor(private repository: InstitutionRepository<InstitutionEntity>) {
    this.converter = new InstitutionConverter();
  }

  public findById = async (id: string): Promise<Institution | null> => {
    const entity = await this.repository.findById(id);
    return entity ? this.converter.toDomain(entity) : null;
  };

  public findAll = async (): Promise<Institution[]> => {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findByOrganization = async (organizationId: string): Promise<Institution[]> => {
    const entities = await this.repository.findByOrganization(organizationId);
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public create = async (institution: Institution): Promise<Institution> => {
    const entity = this.converter.toEntity(institution);
    const saved = await this.repository.save(entity);
    return this.converter.toDomain(saved);
  };

  public update = async (id: string, updates: Partial<Institution>): Promise<Institution> => {
    const entityUpdates = this.converter.toEntity(updates as Institution);
    const updated = await this.repository.update(id, entityUpdates);
    return this.converter.toDomain(updated);
  };

  public delete = async (id: string): Promise<void> => {
    await this.repository.delete(id);
  };
}
