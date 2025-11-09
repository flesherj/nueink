import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../../../backend/data/resource';
import { PersonEntity } from '../models';
import { PersonRepository } from './PersonRepository';

export class AmplifyPersonRepository implements PersonRepository {
  constructor(private dbClient = generateClient<Schema>()) {}

  async findById(id: string): Promise<PersonEntity | null> {
    const response = await this.dbClient.models.Person.get({ personId: id });
    if (!response.data) {
      return null;
    }
    return this.toPerson(response.data);
  }

  async findAll(): Promise<PersonEntity[]> {
    const response = await this.dbClient.models.Person.list();
    return response.data.map((item) => this.toPerson(item));
  }

  async save(entity: PersonEntity): Promise<PersonEntity> {
    const response = await this.dbClient.models.Person.create({
      personId: entity.personId,
      organizationId: entity.organizationId,
      name: entity.name,
      color: entity.color,
      avatarUrl: entity.avatarUrl,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt.toISOString(),
      profileOwner: entity.profileOwner,
    });

    return this.toPerson(response.data!);
  }

  async update(id: string, entity: Partial<PersonEntity>): Promise<PersonEntity> {
    const updates: any = { personId: id };

    if (entity.name !== undefined) updates.name = entity.name;
    if (entity.color !== undefined) updates.color = entity.color;
    if (entity.avatarUrl !== undefined) updates.avatarUrl = entity.avatarUrl;
    if (entity.sortOrder !== undefined) updates.sortOrder = entity.sortOrder;

    const response = await this.dbClient.models.Person.update(updates);
    return this.toPerson(response.data!);
  }

  async delete(id: string): Promise<void> {
    await this.dbClient.models.Person.delete({ personId: id });
  }

  async findByOrganization(organizationId: string): Promise<PersonEntity[]> {
    const response = await this.dbClient.models.Person.listPersonByOrganizationId({
      organizationId,
    });
    return response.data.map((item) => this.toPerson(item));
  }

  /**
   * Convert Amplify Person entity to PersonEntity
   */
  private toPerson(data: any): PersonEntity {
    return {
      personId: data.personId,
      organizationId: data.organizationId,
      name: data.name,
      color: data.color ?? undefined,
      avatarUrl: data.avatarUrl ?? undefined,
      sortOrder: data.sortOrder ?? undefined,
      createdAt: new Date(data.createdAt),
      profileOwner: data.profileOwner ?? undefined,
    };
  }
}
