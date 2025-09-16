import { v4 as uuid } from "uuid";

export interface IEntity {
	readonly id: string;

	equals(object?: IEntity): boolean;
}

export type TEntityCore = {
	[key: string]: unknown;
	id?: IEntity["id"];
};

const isEntity = <T extends TEntityCore>(v: unknown): v is Entity<T> =>
	v instanceof Entity;

/**
 * An object whose definition is based on `identity` over just its attributes.
 *
 * Also known as `Reference Objects`.
 */
export abstract class Entity<T extends TEntityCore = TEntityCore>
	implements IEntity
{
	private readonly _id: IEntity["id"];

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

	public equals(object?: Entity<T>): boolean {
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
export type BuildEntityInterface<T> = IEntity & Exclude<T, "TEntityCore">;
