export interface DomainEvent<T = null> {
	// When the event occured
	timestamp: string;
	// id for the Aggregate Root that this event belongs to
	aggregateId: string;
	// Optional Event data
	data: T | null;
}

// Prototype for functions that will consume Domain Events
export type DomainEventHandler<
	T = null,
	E extends DomainEvent<T> = DomainEvent<T>,
> = (event: E) => void | Promise<void>;

export type EventConstructorContext = {
	aggregateId: DomainEvent["aggregateId"];
};

/**
 * Base Domain Event class.
 *
 * All Domain Events MUST extend this class.
 */
export abstract class AbstractDomainEvent<T = null> implements DomainEvent<T> {
	public readonly data: DomainEvent<T>["data"];
	public readonly timestamp: DomainEvent<T>["timestamp"];
	public readonly aggregateId: DomainEvent<T>["aggregateId"];

	constructor(ctx: EventConstructorContext, data?: T) {
		this.aggregateId = ctx.aggregateId;
		this.timestamp = new Date().toISOString();
		this.data = data ?? null;
	}
}
