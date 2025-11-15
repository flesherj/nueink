import { PersonRepository } from '@nueink/core';
import type { AmplifyDataClient } from './types';
import { PersonEntity } from '../models';

export class AmplifyPersonRepository implements PersonRepository<PersonEntity> {
  constructor(private dbClient: AmplifyDataClient) {}

  public findById = async (id: string): Promise<PersonEntity | null> => {
    const response = await this.dbClient.models.Person.get({ personId: id });
    if (!response.data) {
      return null;
    }
    return this.toPerson(response.data);
  };

  public findAll = async (): Promise<PersonEntity[]> => {
    const response = await this.dbClient.models.Person.list({});
    return response.data.map((item: any) => this.toPerson(item));
  };

  public save = async (entity: PersonEntity): Promise<PersonEntity> => {
    const response = await this.dbClient.models.Person.create({
      personId: entity.personId,
      organizationId: entity.organizationId,
      name: entity.name,
      color: entity.color,
      avatarUrl: entity.avatarUrl,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt,
      profileOwner: entity.profileOwner,
    });

    if (!response.data) {
      throw new Error('Failed to create Person: response.data is null');
    }
    return this.toPerson(response.data);
  };

  public update = async (id: string, entity: Partial<PersonEntity>): Promise<PersonEntity> => {
    const updates: any = { personId: id };

    if (entity.name !== undefined) updates.name = entity.name;
    if (entity.color !== undefined) updates.color = entity.color;
    if (entity.avatarUrl !== undefined) updates.avatarUrl = entity.avatarUrl;
    if (entity.sortOrder !== undefined) updates.sortOrder = entity.sortOrder;

    const response = await this.dbClient.models.Person.update(updates);
    if (!response.data) {
      throw new Error('Failed to update Person: response.data is null');
    }
    return this.toPerson(response.data);
  };

  public delete = async (id: string): Promise<void> => {
    await this.dbClient.models.Person.delete({ personId: id });
  };

  public findByOrganization = async (organizationId: string): Promise<PersonEntity[]> => {
    const response = await this.dbClient.models.Person.listPersonByOrganizationId({
      organizationId,
    });
    return response.data.map((item: any) => this.toPerson(item));
  };

  /**
   * Convert Amplify Person entity to PersonEntity
   */
  private toPerson = (data: any): PersonEntity => {
    return {
      personId: data.personId,
      organizationId: data.organizationId,
      name: data.name,
      color: data.color ?? undefined,
      avatarUrl: data.avatarUrl ?? undefined,
      sortOrder: data.sortOrder ?? undefined,
      createdAt: data.createdAt,
      profileOwner: data.profileOwner ?? undefined,
    };
  };
}
