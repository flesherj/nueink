import { Organization } from '../models';
import { OrganizationConverter } from '../converters';
import { OrganizationRepository } from '../repositories';
import { OrganizationEntity } from '@nueink/aws';

/**
 * Organization service - handles business logic for organization operations
 */
export class OrganizationService {
  private converter: OrganizationConverter;

  constructor(private repository: OrganizationRepository<OrganizationEntity>) {
    this.converter = new OrganizationConverter();
  }

  public findById = async (id: string): Promise<Organization | null> => {
    const entity = await this.repository.findById(id);
    return entity ? this.converter.toDomain(entity) : null;
  };

  public findAll = async (): Promise<Organization[]> => {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findByParentOrgId = async (parentOrgId: string): Promise<Organization[]> => {
    const entities = await this.repository.findByParentOrgId(parentOrgId);
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findByName = async (name: string): Promise<Organization[]> => {
    const entities = await this.repository.findByName(name);
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public create = async (organization: Organization): Promise<Organization> => {
    const entity = this.converter.toEntity(organization);
    const saved = await this.repository.save(entity);
    return this.converter.toDomain(saved);
  };

  public update = async (id: string, updates: Partial<Organization>): Promise<Organization> => {
    const entityUpdates = this.converter.toEntity(updates as Organization);
    const updated = await this.repository.update(id, entityUpdates);
    return this.converter.toDomain(updated);
  };

  public delete = async (id: string): Promise<void> => {
    await this.repository.delete(id);
  };
}
