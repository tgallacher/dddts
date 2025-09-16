import { describe, expect, it } from "vitest";
import { type IValueObject, ValueObject } from "./value-object";

class StringValueObject extends ValueObject<string> {}
class NumberValueObject extends ValueObject<number> {}
class ObjectValueObject extends ValueObject<{ name: string; age: number }> {}
class ArrayValueObject extends ValueObject<string[]> {}

describe("ValueObject", () => {
	describe("Constructor and Immutability", () => {
		it("should create instance with string data", () => {
			const vo = new StringValueObject("hello");
			expect(vo.value).toBe("hello");
		});

		it("should create instance with number data", () => {
			const vo = new NumberValueObject(42);
			expect(vo.value).toBe(42);
		});

		it("should create instance with object data", () => {
			const data = { name: "John", age: 30 };
			const vo = new ObjectValueObject(data);
			expect(vo.value).toEqual(data);
		});

		it("should create instance with array data", () => {
			const data = ["a", "b", "c"];
			const vo = new ArrayValueObject(data);
			expect(vo.value).toEqual(data);
		});

		it("should freeze the data to prevent mutations", () => {
			const data = { name: "John", age: 30 };
			const vo = new ObjectValueObject(data);
			expect(Object.isFrozen(vo.value)).toBe(true);
		});

		it("should prevent mutations on array data", () => {
			const data = ["a", "b", "c"];
			const vo = new ArrayValueObject(data);
			expect(Object.isFrozen(vo.value)).toBe(true);
		});
	});

	describe("equals() method", () => {
		it("should return true for identical string values", () => {
			const vo1 = new StringValueObject("hello");
			const vo2 = new StringValueObject("hello");
			expect(vo1.equals(vo2)).toBe(true);
		});

		it("should return false for different string values", () => {
			const vo1 = new StringValueObject("hello");
			const vo2 = new StringValueObject("world");
			expect(vo1.equals(vo2)).toBe(false);
		});

		it("should return true for identical number values", () => {
			const vo1 = new NumberValueObject(42);
			const vo2 = new NumberValueObject(42);
			expect(vo1.equals(vo2)).toBe(true);
		});

		it("should return false for different number values", () => {
			const vo1 = new NumberValueObject(42);
			const vo2 = new NumberValueObject(24);
			expect(vo1.equals(vo2)).toBe(false);
		});

		it("should return true for identical object values", () => {
			const data = { name: "John", age: 30 };
			const vo1 = new ObjectValueObject(data);
			const vo2 = new ObjectValueObject({ name: "John", age: 30 });
			expect(vo1.equals(vo2)).toBe(true);
		});

		it("should return false for different object values", () => {
			const vo1 = new ObjectValueObject({ name: "John", age: 30 });
			const vo2 = new ObjectValueObject({ name: "Jane", age: 25 });
			expect(vo1.equals(vo2)).toBe(false);
		});

		it("should return true for identical array values", () => {
			const vo1 = new ArrayValueObject(["a", "b", "c"]);
			const vo2 = new ArrayValueObject(["a", "b", "c"]);
			expect(vo1.equals(vo2)).toBe(true);
		});

		it("should return false for different array values", () => {
			const vo1 = new ArrayValueObject(["a", "b", "c"]);
			const vo2 = new ArrayValueObject(["x", "y", "z"]);
			expect(vo1.equals(vo2)).toBe(false);
		});

		it("should return false for undefined input", () => {
			const vo = new StringValueObject("hello");
			expect(vo.equals(undefined)).toBe(false);
		});

		it("should return false when comparing value objects of different types", () => {
			const stringVo = new StringValueObject("42");
			const numberVo = new NumberValueObject(42);
			expect(stringVo.equals(numberVo as any)).toBe(false);
		});

		it("should handle partial object equality correctly", () => {
			const vo1 = new ObjectValueObject({ name: "John", age: 30 });
			const vo2 = new ObjectValueObject({ name: "John", age: 25 });
			expect(vo1.equals(vo2)).toBe(false);
		});
	});

	describe("value getter", () => {
		it("should return the correct string data", () => {
			const vo = new StringValueObject("test");
			expect(vo.value).toBe("test");
		});

		it("should return the correct object data", () => {
			const data = { name: "John", age: 30 };
			const vo = new ObjectValueObject(data);
			expect(vo.value).toEqual(data);
		});

		it("should return frozen data", () => {
			const data = { name: "John", age: 30 };
			const vo = new ObjectValueObject(data);
			expect(Object.isFrozen(vo.value)).toBe(true);
		});

		it("should maintain reference equality for the same instance", () => {
			const data = { name: "John", age: 30 };
			const vo = new ObjectValueObject(data);
			expect(vo.value).toBe(vo.value);
		});
	});

	describe("Interface compliance", () => {
		it("should implement IValueObject interface", () => {
			const vo: IValueObject<string> = new StringValueObject("test");
			expect(vo.value).toBe("test");
			expect(typeof vo.equals).toBe("function");
		});

		it("should work with generic types", () => {
			const stringVo: IValueObject<string> = new StringValueObject("test");
			const numberVo: IValueObject<number> = new NumberValueObject(42);
			const objectVo: IValueObject<{ name: string; age: number }> =
				new ObjectValueObject({ name: "John", age: 30 });

			expect(stringVo.value).toBe("test");
			expect(numberVo.value).toBe(42);
			expect(objectVo.value).toEqual({ name: "John", age: 30 });
		});
	});

	describe("Edge cases", () => {
		it("should handle null values in objects", () => {
			const vo1 = new ObjectValueObject({ name: null as any, age: 30 });
			const vo2 = new ObjectValueObject({ name: null as any, age: 30 });
			expect(vo1.equals(vo2)).toBe(true);
		});

		it("should handle empty arrays", () => {
			const vo1 = new ArrayValueObject([]);
			const vo2 = new ArrayValueObject([]);
			expect(vo1.equals(vo2)).toBe(true);
		});

		it("should handle empty objects", () => {
			const vo1 = new ObjectValueObject({} as any);
			const vo2 = new ObjectValueObject({} as any);
			expect(vo1.equals(vo2)).toBe(true);
		});

		it("should handle zero values", () => {
			const vo1 = new NumberValueObject(0);
			const vo2 = new NumberValueObject(0);
			expect(vo1.equals(vo2)).toBe(true);
		});

		it("should handle empty strings", () => {
			const vo1 = new StringValueObject("");
			const vo2 = new StringValueObject("");
			expect(vo1.equals(vo2)).toBe(true);
		});
	});
});

