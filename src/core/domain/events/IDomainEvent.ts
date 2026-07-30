import { Entity } from '../entities/Entity';

/**
 * Contract for all domain events
 * Enables event-driven architecture within the domain
 */
export interface IDomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly eventName: string;
}

export abstract class DomainEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly aggregateId: string;
  public readonly eventName: string;

  protected constructor(aggregate: Entity, eventName: string) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.aggregateId = aggregate.id.toString();
    this.eventName = eventName;
  }
}