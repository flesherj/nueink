/**
 * Generic converter interface for transforming between entity and domain models
 *
 * @template TEntity - The entity type (infrastructure/AWS layer)
 * @template TDomain - The domain model type (business logic layer)
 */
export interface Converter<TEntity, TDomain> {
  /**
   * Convert from domain model to entity
   * Used when saving to the database
   */
  toEntity(domain: TDomain): TEntity;

  /**
   * Convert from entity to domain model
   * Used when reading from the database
   */
  toDomain(entity: TEntity): TDomain;
}
