/**
 * Abstract base entity with identity comparison
 * Implements equality based on ID rather than reference
 */
export abstract class Entity<TId = string | number> {
  private readonly _id: TId;

  protected constructor(id: TId) {
    this._id = id;
  }

  get id(): TId {
    return this._id;
  }

  public equals(other: Entity<TId>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof Entity)) {
      return false;
    }
    return this._id === other._id;
  }

  public toString(): string {
    return `${this.constructor.name}(${this._id})`;
  }
}