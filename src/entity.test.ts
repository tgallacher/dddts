import { v4 as uuid } from "uuid";
import { beforeEach, describe, expect, it } from "vitest";
import {
  AbstractEntity,
  type BuildEntityInterface,
  type EntityConfig,
  type TEntity,
} from "./entity";

class UserEntity extends AbstractEntity<{
  name: string;
  email: string;
  id?: string;
}> {}
class ProductEntity extends AbstractEntity<{
  title: string;
  price: number;
  id?: string;
}> {}
class SimpleEntity extends AbstractEntity<{ value: string; id?: string }> {}
class ComplexEntity extends AbstractEntity<{
  nested: { prop: string };
  array: number[];
  id?: string;
}> {}

// Custom ID type entities for testing
class NumericIdEntity extends AbstractEntity<
  { name: string; id?: number },
  number
> {
  private static counter = 0;

  constructor(data: { name: string; id?: number }) {
    super(data, { generateId: () => ++NumericIdEntity.counter });
  }

  static resetCounter() {
    NumericIdEntity.counter = 0;
  }
}

type CustomId = { prefix: string; value: number };
class CustomIdEntity extends AbstractEntity<
  { name: string; id?: CustomId },
  CustomId
> {
  private static counter = 0;

  constructor(data: { name: string; id?: CustomId }) {
    super(data, {
      generateId: () => ({ prefix: "CUSTOM", value: ++CustomIdEntity.counter }),
    });
  }

  static resetCounter() {
    CustomIdEntity.counter = 0;
  }
}

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

  describe("Interface compliance", () => {
    it("should implement IEntity interface", () => {
      const entity: AbstractEntity<{
        name: string;
        email: string;
        id?: string;
      }> = new UserEntity({
        name: "John",
        email: "john@test.com",
      });

      expect(entity.id).toBeDefined();
      expect(typeof entity.equals).toBe("function");
      expect(typeof entity.id).toBe("string");
    });

    it("should work with generic type constraints", () => {
      const userData = { name: "John", email: "john@test.com" };
      const entity: AbstractEntity<typeof userData & TEntity<string>, string> =
        new UserEntity(userData);

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
        extends AbstractEntity<{ name: string; email: string }>
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

  describe("Custom ID types", () => {
    beforeEach(() => {
      NumericIdEntity.resetCounter();
      CustomIdEntity.resetCounter();
    });

    it("should support numeric ID type with custom generateId", () => {
      const entity = new NumericIdEntity({ name: "Test" });

      expect(entity.id).toBe(1);
      expect(typeof entity.id).toBe("number");
    });

    it("should generate sequential numeric IDs", () => {
      const entity1 = new NumericIdEntity({ name: "First" });
      const entity2 = new NumericIdEntity({ name: "Second" });
      const entity3 = new NumericIdEntity({ name: "Third" });

      expect(entity1.id).toBe(1);
      expect(entity2.id).toBe(2);
      expect(entity3.id).toBe(3);
    });

    it("should use provided numeric ID when reconstituting", () => {
      const entity = new NumericIdEntity({ name: "Test", id: 999 });

      expect(entity.id).toBe(999);
    });

    it("should support complex custom ID type", () => {
      const entity = new CustomIdEntity({ name: "Test" });

      expect(entity.id).toEqual({ prefix: "CUSTOM", value: 1 });
      expect(entity.id.prefix).toBe("CUSTOM");
      expect(entity.id.value).toBe(1);
    });

    it("should use provided custom ID when reconstituting", () => {
      const customId: CustomId = { prefix: "RESTORED", value: 42 };
      const entity = new CustomIdEntity({ name: "Test", id: customId });

      expect(entity.id).toEqual(customId);
    });

    it("should correctly compare entities with numeric IDs", () => {
      const entity1 = new NumericIdEntity({ name: "First", id: 100 });
      const entity2 = new NumericIdEntity({ name: "Second", id: 100 });
      const entity3 = new NumericIdEntity({ name: "Third", id: 200 });

      expect(entity1.equals(entity2)).toBe(true);
      expect(entity1.equals(entity3)).toBe(false);
    });

    it("should correctly compare entities with custom IDs", () => {
      const id1: CustomId = { prefix: "TEST", value: 1 };
      const id2: CustomId = { prefix: "TEST", value: 1 };
      const id3: CustomId = { prefix: "TEST", value: 2 };

      const entity1 = new CustomIdEntity({ name: "First", id: id1 });
      const entity2 = new CustomIdEntity({ name: "Second", id: id2 });
      const entity3 = new CustomIdEntity({ name: "Third", id: id3 });

      // Note: Object equality comparison uses === which compares references
      // So different object instances with same values will not be equal
      expect(entity1.equals(entity1)).toBe(true); // Same instance
      expect(entity1.equals(entity2)).toBe(false); // Different object references
      expect(entity1.equals(entity3)).toBe(false);
    });

    it("should support BuildEntityInterface with custom ID type", () => {
      interface NumericEntityInterface
        extends BuildEntityInterface<
          {
            getName(): string;
          },
          number
        > {}

      class TestNumericEntity
        extends AbstractEntity<{ name: string; id?: number }, number>
        implements NumericEntityInterface
      {
        private static counter = 0;

        constructor(data: { name: string; id?: number }) {
          super(data, { generateId: () => ++TestNumericEntity.counter });
        }

        getName(): string {
          return (this as any)._data.name;
        }
      }

      const entity: NumericEntityInterface = new TestNumericEntity({
        name: "Test",
      });

      expect(typeof entity.id).toBe("number");
      expect(entity.getName()).toBe("Test");
      expect(typeof entity.equals).toBe("function");
    });
  });
});
