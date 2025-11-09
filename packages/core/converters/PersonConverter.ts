import { Converter } from './Converter';
import { Person } from '../models';
import { PersonEntity } from '@nueink/aws';

/**
 * Converter for Person domain model and PersonEntity
 */
export class PersonConverter implements Converter<PersonEntity, Person> {
  toEntity(domain: Person): PersonEntity {
    return {
      personId: domain.personId,
      organizationId: domain.organizationId,
      name: domain.name,
      color: domain.color,
      avatarUrl: domain.avatarUrl,
      sortOrder: domain.sortOrder,
      createdAt: domain.createdAt.toISOString(),
      profileOwner: domain.profileOwner,
    };
  }

  toDomain(entity: PersonEntity): Person {
    return {
      personId: entity.personId,
      organizationId: entity.organizationId,
      name: entity.name,
      color: entity.color,
      avatarUrl: entity.avatarUrl,
      sortOrder: entity.sortOrder,
      createdAt: new Date(entity.createdAt),
      profileOwner: entity.profileOwner!,
    };
  }
}
