import { Person } from '../models';
import { PersonRepository } from '@nueink/aws';
import { PersonConverter } from '../converters';

/**
 * Person service - handles business logic for person operations
 */
export class PersonService {
  private converter: PersonConverter;

  constructor(private repository: PersonRepository) {
    this.converter = new PersonConverter();
  }

  async findById(id: string): Promise<Person | null> {
    const entity = await this.repository.findById(id);
    return entity ? this.converter.toDomain(entity) : null;
  }

  async findAll(): Promise<Person[]> {
    const entities = await this.repository.findAll();
    return entities.map((entity) => this.converter.toDomain(entity));
  }

  async findByOrganization(organizationId: string): Promise<Person[]> {
    const entities = await this.repository.findByOrganization(organizationId);
    return entities.map((entity) => this.converter.toDomain(entity));
  }

  async create(person: Person): Promise<Person> {
    const entity = this.converter.toEntity(person);
    const saved = await this.repository.save(entity);
    return this.converter.toDomain(saved);
  }

  async update(id: string, updates: Partial<Person>): Promise<Person> {
    const entityUpdates = this.converter.toEntity(updates as Person);
    const updated = await this.repository.update(id, entityUpdates);
    return this.converter.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
