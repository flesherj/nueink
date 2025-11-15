import { Membership } from '../models';
import { MembershipConverter } from '../converters';
import { MembershipRepository } from '../repositories';
import { MembershipEntity } from '@nueink/aws';

/**
 * Membership service - handles business logic for membership operations
 */
export class MembershipService {
  private converter: MembershipConverter;

  constructor(private repository: MembershipRepository<MembershipEntity>) {
    this.converter = new MembershipConverter();
  }

  public findById = async (id: string): Promise<Membership | null> => {
    const entity = await this.repository.findById(id);
    return entity ? this.converter.toDomain(entity) : null;
  };

  public findAll = async (): Promise<Membership[]> => {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findByOrganization = async (orgId: string): Promise<Membership[]> => {
    const entities = await this.repository.findByOrganization(orgId);
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findByAccount = async (accountId: string): Promise<Membership[]> => {
    const entities = await this.repository.findByAccount(accountId);
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findByAccountAndOrganization = async (accountId: string, orgId: string): Promise<Membership | null> => {
    const entity = await this.repository.findByAccountAndOrganization(accountId, orgId);
    return entity ? this.converter.toDomain(entity) : null;
  };

  public create = async (membership: Membership): Promise<Membership> => {
    const entity = this.converter.toEntity(membership);
    const saved = await this.repository.save(entity);
    return this.converter.toDomain(saved);
  };

  public update = async (id: string, updates: Partial<Membership>): Promise<Membership> => {
    const entityUpdates = this.converter.toEntity(updates as Membership);
    const updated = await this.repository.update(id, entityUpdates);
    return this.converter.toDomain(updated);
  };

  public delete = async (id: string): Promise<void> => {
    await this.repository.delete(id);
  };
}
