/**
 * Generic Mapper interface for converting between Domain entities and Persistence models
 * Ensures clean separation between domain and infrastructure layers
 */
export interface Mapper<DomainEntity, PersistenceModel> {
  toDomain(model: PersistenceModel): DomainEntity;
  toPersistence(entity: DomainEntity): PersistenceModel;
}