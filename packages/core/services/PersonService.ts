import { Person } from '../models';
import { PersonConverter } from '../converters';
import { PersonRepository } from '../repositories';
import { PersonEntity } from '@nueink/aws';

/**
 * Person service - handles business logic for person operations
 */
export class PersonService {
  private converter: PersonConverter;

  constructor(private repository: PersonRepository<PersonEntity>) {
    this.converter = new PersonConverter();
  }

  public findById = async (id: string): Promise<Person | null> => {
    const entity = await this.repository.findById(id);
    return entity ? this.converter.toDomain(entity) : null;
  };

  public findAll = async (): Promise<Person[]> => {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public findByOrganization = async (organizationId: string): Promise<Person[]> => {
    const entities = await this.repository.findByOrganization(organizationId);
    return entities.map((entity) => this.converter.toDomain(entity));
  };

  public create = async (person: Person): Promise<Person> => {
    const entity = this.converter.toEntity(person);
    const saved = await this.repository.save(entity);
    return this.converter.toDomain(saved);
  };

  public update = async (id: string, updates: Partial<Person>): Promise<Person> => {
    const entityUpdates = this.converter.toEntity(updates as Person);
    const updated = await this.repository.update(id, entityUpdates);
    return this.converter.toDomain(updated);
  };

  public delete = async (id: string): Promise<void> => {
    await this.repository.delete(id);
  };
}
