import { v7 as uuid } from "uuid";

/**
 * Base Entity interface with generic ID type support.
 */
export interface Entity<Id = string> {
	readonly id: Id;

	equals(object?: Entity<Id>): boolean;
}

/**
 * Configuration options for creating an Entity.
 */
export type EntityConfig<Id = string> = {
	/**
	 * Custom function to generate IDs for new entities.
	 * If not provided, defaults to UUID v7 (requires Id to be string).
	 */
	generateId?: () => Id;
};

/**
 * Base type for entity data props.
 */
export type TEntity<Id = string> = {
	[key: string]: unknown;
	id?: Id;
};

const isEntity = <T extends TEntity<Id>, Id>(
	v: unknown,
): v is AbstractEntity<T, Id> => v instanceof AbstractEntity;

/**
 * Default ID generator using UUID v7.
 */
const defaultGenerateId = (): string => uuid();

/**
 * An object whose definition is based on `identity` over just its attributes.
 *
 * Also known as `Reference Objects`.
 *
 * @typeParam T - The shape of the entity's data properties
 * @typeParam Id - The type of the entity's identifier (defaults to string)
 */
export abstract class AbstractEntity<T extends TEntity<Id>, Id = string>
	implements Entity<Id>
{
	private readonly _id: Id;

	protected readonly _data: Omit<T, "id">;

	/**
	 * Creates a new Entity instance.
	 *
	 * @param data - The entity data, optionally including an id for reconstitution
	 * @param config - Configuration options including custom generateId function
	 *
	 * @example
	 * // Using default UUID string IDs
	 * class UserEntity extends AbstractEntity<{ name: string }> {}
	 *
	 * @example
	 * // Using custom numeric IDs
	 * class ProductEntity extends AbstractEntity<{ title: string }, number> {
	 *   constructor(data: { title: string; id?: number }) {
	 *     super(data, { generateId: () => Math.floor(Math.random() * 1000000) });
	 *   }
	 * }
	 */
	constructor(data: T, config?: EntityConfig<Id>) {
		const generateId = config?.generateId ?? (defaultGenerateId as () => Id);

		// Optional `id`: allow for re-consituting objects from persistence
		this._id = data?.id ?? generateId();

		delete data?.id;

		this._data = data ?? {};
	}

	public get id(): Id {
		return this._id;
	}

	public equals(object?: AbstractEntity<T, Id>): boolean {
		if (object === null || object === undefined || !isEntity(object)) {
			return false;
		}

		return Object.is(this, object) || this._id === object.id;
	}
}

//
// Utility Types
//

/**
 * Create the public interface of the resulting Entity.
 *
 * This allows you to depend on an abstraction over a concretion.
 */
export type BuildEntityInterface<T, Id = string> = Entity<Id> &
	Exclude<T, "TEntity">;
