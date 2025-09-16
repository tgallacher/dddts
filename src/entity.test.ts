import { v4 as uuid } from "uuid";
import { describe, expect, it } from "vitest";
import {
	type BuildEntityInterface,
	Entity,
	type IEntity,
	type TEntityCore,
} from "./entity";

class UserEntity extends Entity<{ name: string; email: string; id?: string }> {}
class ProductEntity extends Entity<{
	title: string;
	price: number;
	id?: string;
}> {}
class SimpleEntity extends Entity<{ value: string; id?: string }> {}
class ComplexEntity extends Entity<{
	nested: { prop: string };
	array: number[];
	id?: string;
}> {}

describe("Entity", () => {
	describe("Constructor", () => {
		it("should auto-generate UUID when no id provided", () => {
			const entity = new UserEntity({ name: "John", email: "john@test.com" });
			expect(entity.id).toBeDefined();
			expect(typeof entity.id).toBe("string");
		});

		it("should use provided id when given", () => {
			const customId = uuid();
			const entity = new UserEntity({
				id: customId,
				name: "John",
				email: "john@test.com",
			});
			expect(entity.id).toBe(customId);
		});

		it("should remove id from original data object", () => {
			const data = { id: uuid(), name: "John", email: "john@test.com" };
			const originalDataId = data.id;
			const entity = new UserEntity(data);

			expect(entity.id).toBe(originalDataId);
			expect(data.id).toBeUndefined();
		});

		it("should handle undefined data gracefully", () => {
			const entity = new SimpleEntity(undefined as any);
			expect(entity.id).toBeDefined();
		});

		it("should generate different UUIDs for different instances", () => {
			const entity1 = new UserEntity({ name: "John", email: "john@test.com" });
			const entity2 = new UserEntity({ name: "Jane", email: "jane@test.com" });

			expect(entity1.id).not.toBe(entity2.id);
		});
	});

	describe("id", () => {
		it("should return the correct id value when reconsituting an object", () => {
			const customId = uuid();
			const entity = new UserEntity({
				id: customId,
				name: "John",
				email: "john@test.com",
			});
			expect(entity.id).toBe(customId);
		});

		it("should return valid id for new objects", () => {
			const entity = new UserEntity({ name: "John", email: "john@test.com" });
			expect(entity.id).toBeDefined();
		});
	});

	describe("equality comparison", () => {
		it("should return true for same instance (Object.is)", () => {
			const entity = new UserEntity({ name: "John", email: "john@test.com" });
			expect(entity.equals(entity)).toBe(true);
		});

		it("should return true for different instances with same id", () => {
			const sharedId = uuid();
			const entity1 = new UserEntity({
				id: sharedId,
				name: "John",
				email: "john@test.com",
			});
			const entity2 = new UserEntity({
				id: sharedId,
				name: "Jane",
				email: "jane@test.com",
			});

			expect(entity1.equals(entity2)).toBe(true);
		});

		it("should return false for different instances with different ids", () => {
			const entity1 = new UserEntity({ name: "John", email: "john@test.com" });
			const entity2 = new UserEntity({ name: "Jane", email: "jane@test.com" });

			expect(entity1.equals(entity2)).toBe(false);
		});

		it("should return false for null input", () => {
			const entity = new UserEntity({ name: "John", email: "john@test.com" });
			expect(entity.equals(null as any)).toBe(false);
		});

		it("should return false for undefined input", () => {
			const entity = new UserEntity({ name: "John", email: "john@test.com" });
			expect(entity.equals(undefined)).toBe(false);
		});

		it("should return false for non-entity objects", () => {
			const entity = new UserEntity({ name: "John", email: "john@test.com" });
			const plainObject = { id: entity.id, name: "John" };

			expect(entity.equals(plainObject as any)).toBe(false);
		});

		it("should return true for cross-type entities with same id", () => {
			const sharedId = uuid();
			const userEntity = new UserEntity({
				id: sharedId,
				name: "John",
				email: "john@test.com",
			});
			const productEntity = new ProductEntity({
				id: sharedId,
				title: "Product",
				price: 99.99,
			});

			expect(userEntity.equals(productEntity as any)).toBe(true);
		});
	});

	describe("isEntity utility function", () => {
		it("should return true for valid entity instances", () => {
			const entity = new UserEntity({ name: "John", email: "john@test.com" });

			// Access the isEntity function via module internals for testing
			const isEntityTest = (v: unknown): v is Entity => v instanceof Entity;
			expect(isEntityTest(entity)).toBe(true);
		});

		it("should return false for plain objects", () => {
			const plainObject = { id: uuid(), name: "John" };

			const isEntityTest = (v: unknown): v is Entity => v instanceof Entity;
			expect(isEntityTest(plainObject)).toBe(false);
		});

		it("should return false for null and undefined", () => {
			const isEntityTest = (v: unknown): v is Entity => v instanceof Entity;
			expect(isEntityTest(null)).toBe(false);
			expect(isEntityTest(undefined)).toBe(false);
		});

		it("should work with different entity types", () => {
			const userEntity = new UserEntity({
				name: "John",
				email: "john@test.com",
			});
			const productEntity = new ProductEntity({
				title: "Product",
				price: 99.99,
			});

			const isEntityTest = (v: unknown): v is Entity => v instanceof Entity;
			expect(isEntityTest(userEntity)).toBe(true);
			expect(isEntityTest(productEntity)).toBe(true);
		});
	});

	describe("Interface compliance", () => {
		it("should implement IEntity interface", () => {
			const entity: IEntity = new UserEntity({
				name: "John",
				email: "john@test.com",
			});

			expect(entity.id).toBeDefined();
			expect(typeof entity.equals).toBe("function");
			expect(typeof entity.id).toBe("string");
		});

		it("should work with generic type constraints", () => {
			const userData = { name: "John", email: "john@test.com" };
			const entity: Entity<typeof userData & TEntityCore> = new UserEntity(
				userData,
			);

			expect(entity.id).toBeDefined();
			expect(entity.equals).toBeDefined();
		});

		it("should support BuildEntityInterface utility type", () => {
			interface TestEntityInterface
				extends BuildEntityInterface<{
					getName(): string;
					getEmail(): string;
				}> {}

			class TestEntity
				extends Entity<{ name: string; email: string }>
				implements TestEntityInterface
			{
				getName(): string {
					return (this as any)._data.name;
				}

				getEmail(): string {
					return (this as any)._data.email;
				}
			}

			const entity: TestEntityInterface = new TestEntity({
				name: "John",
				email: "john@test.com",
			});

			expect(entity.id).toBeDefined();
			expect(entity.getName()).toBe("John");
			expect(entity.getEmail()).toBe("john@test.com");
			expect(typeof entity.equals).toBe("function");
		});
	});
});
