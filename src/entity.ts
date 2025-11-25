import { v7 as uuid } from "uuid";

export interface Entity {
	readonly id: string;

	equals(object?: Entity): boolean;
}

export type TEntity = {
	[key: string]: unknown;
	id?: Entity["id"];
};

const isEntity = <T extends TEntity>(v: unknown): v is AbstractEntity<T> =>
	v instanceof AbstractEntity;

/**
 * An object whose definition is based on `identity` over just its attributes.
 *
 * Also known as `Reference Objects`.
 */
export abstract class AbstractEntity<T extends TEntity = TEntity>
	implements Entity
{
	private readonly _id: Entity["id"];

	protected readonly _data: Omit<T, "id">;

	constructor(data: T) {
		// Optional `id`: allow for re-consituting objects from persistence
		this._id = data?.id ?? uuid();

		delete data?.id;

		this._data = data ?? {};
	}

	public get id() {
		return this._id;
	}

	public equals(object?: AbstractEntity<T>): boolean {
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
export type BuildEntityInterface<T> = Entity & Exclude<T, "TEntity">;
