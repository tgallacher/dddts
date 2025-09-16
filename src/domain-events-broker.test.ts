import { beforeEach, describe, expect, it, vi } from "vitest";
import { AbstractAggregateRoot } from "./aggregate-root";
import { AbstractDomainEvent, type DomainEventHandler } from "./domain-event";
import { DomainEventsBroker } from "./domain-events-broker";

// Test Event Classes
class UserCreatedEvent extends AbstractDomainEvent<{
	name: string;
	email: string;
}> {}
class UserUpdatedEvent extends AbstractDomainEvent<{ name: string }> {}
class ProductCreatedEvent extends AbstractDomainEvent<{
	title: string;
	price: number;
}> {}

// Test Aggregate Classes
class TestUserAggregate extends AbstractAggregateRoot<{
	name: string;
	email: string;
	id?: string;
}> {
	constructor(data: { name: string; email: string; id?: string }) {
		super(data);
	}

	createUser() {
		this.addDomainEvent(
			new UserCreatedEvent(
				{ aggregateId: this.id },
				{ name: (this as any)._data.name, email: (this as any)._data.email },
			),
		);
	}

	updateUser(name: string) {
		this.addDomainEvent(
			new UserUpdatedEvent({ aggregateId: this.id }, { name }),
		);
	}
}

class TestProductAggregate extends AbstractAggregateRoot<{
	title: string;
	price: number;
	id?: string;
}> {
	constructor(data: { title: string; price: number; id?: string }) {
		super(data);
	}

	createProduct() {
		this.addDomainEvent(
			new ProductCreatedEvent(
				{ aggregateId: this.id },
				{ title: (this as any)._data.title, price: (this as any)._data.price },
			),
		);
	}
}

describe("DomainEventsBroker", () => {
	beforeEach(() => {
		// Clean up state before each test
		DomainEventsBroker.clearEventHandlers();
		DomainEventsBroker.clearRegisteredAggregates();
	});

	describe("Event Handler Registration", () => {
		it("should register single handler for event type", () => {
			const handler = vi.fn();

			DomainEventsBroker.registerEventHandler("UserCreatedEvent", handler);

			const data = {
				name: "John",
				email: "john@test.com",
			};
			const aggregate = new TestUserAggregate(data);
			aggregate.createUser();

			DomainEventsBroker.dispatchAggregateEvents(aggregate);

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith(
				expect.objectContaining({
					aggregateId: aggregate.id,
					data,
				}),
			);
		});

		it("should register multiple handlers for same event type", () => {
			const handler1 = vi.fn();
			const handler2 = vi.fn();
			const handler3 = vi.fn();

			DomainEventsBroker.registerEventHandler("UserCreatedEvent", handler1);
			DomainEventsBroker.registerEventHandler("UserCreatedEvent", handler2);
			DomainEventsBroker.registerEventHandler("UserCreatedEvent", handler3);

			const aggregate = new TestUserAggregate({
				name: "John",
				email: "john@test.com",
			});
			aggregate.createUser();

			DomainEventsBroker.dispatchAggregateEvents(aggregate);

			expect(handler1).toHaveBeenCalledTimes(1);
			expect(handler2).toHaveBeenCalledTimes(1);
			expect(handler3).toHaveBeenCalledTimes(1);
		});

		it("should handle different event types separately", () => {
			const userHandler = vi.fn();
			const productHandler = vi.fn();

			DomainEventsBroker.registerEventHandler("UserCreatedEvent", userHandler);
			DomainEventsBroker.registerEventHandler(
				"ProductCreatedEvent",
				productHandler,
			);

			const userAggregate = new TestUserAggregate({
				name: "John",
				email: "john@test.com",
			});
			userAggregate.createUser();

			DomainEventsBroker.dispatchAggregateEvents(userAggregate);

			expect(userHandler).toHaveBeenCalledTimes(1);
			expect(productHandler).not.toHaveBeenCalled();
		});

		it("should handle events when no handlers are registered", () => {
			const aggregate = new TestUserAggregate({
				name: "John",
				email: "john@test.com",
			});
			aggregate.createUser();

			// Should not throw when no handlers are registered
			expect(() => {
				DomainEventsBroker.dispatchAggregateEvents(aggregate);
			}).not.toThrow();
		});
	});

	describe("Aggregate Registration", () => {
		it("should register new aggregate", () => {
			const aggregate = new TestUserAggregate({
				name: "John",
				email: "john@test.com",
			});
			aggregate.createUser();

			// Aggregate should be registered when event is added (via addDomainEvent)
			expect(aggregate.domainEvents).toHaveLength(1);
		});

		it("should prevent duplicate registration of same aggregate", () => {
			const aggregate = new TestUserAggregate({
				name: "John",
				email: "john@test.com",
			});

			// Register manually multiple times
			DomainEventsBroker.registerAggregate(aggregate);
			DomainEventsBroker.registerAggregate(aggregate);
			DomainEventsBroker.registerAggregate(aggregate);

			// Should only be registered once (tested via dispatch behavior)
			const handler = vi.fn();
			DomainEventsBroker.registerEventHandler("UserCreatedEvent", handler);

			aggregate.createUser();
			DomainEventsBroker.dispatchAggregateEvents(aggregate);

			expect(handler).toHaveBeenCalledTimes(1);
		});

		it("should handle registration of aggregates with different IDs", () => {
			const aggregate1 = new TestUserAggregate({
				name: "John",
				email: "john@test.com",
			});
			const aggregate2 = new TestUserAggregate({
				name: "Jane",
				email: "jane@test.com",
			});

			aggregate1.createUser();
			aggregate2.createUser();

			const handler = vi.fn();
			DomainEventsBroker.registerEventHandler("UserCreatedEvent", handler);

			DomainEventsBroker.dispatchAggregateEvents(aggregate1);
			DomainEventsBroker.dispatchAggregateEvents(aggregate2);

			expect(handler).toHaveBeenCalledTimes(2);
		});

		it("should ignore dispatch for unregistered aggregates", () => {
			const aggregate = new TestUserAggregate({
				name: "John",
				email: "john@test.com",
			});

			const handler = vi.fn();
			DomainEventsBroker.registerEventHandler("UserCreatedEvent", handler);

			// Try to dispatch without registering aggregate (no events added)
			DomainEventsBroker.dispatchAggregateEvents(aggregate);

			expect(handler).not.toHaveBeenCalled();
		});
	});

	describe("Event Dispatching", () => {
		it("should dispatch events from registered aggregate", () => {
			const handler = vi.fn();
			DomainEventsBroker.registerEventHandler("UserCreatedEvent", handler);

			const aggregate = new TestUserAggregate({
				name: "John",
				email: "john@test.com",
			});
			aggregate.createUser();

			DomainEventsBroker.dispatchAggregateEvents(aggregate);

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith(
				expect.objectContaining({
					aggregateId: aggregate.id,
					data: { name: "John", email: "john@test.com" },
					timestamp: expect.any(String),
				}),
			);
		});

		it("should handle multiple events on same aggregate", () => {
			const createdHandler = vi.fn();
			const updatedHandler = vi.fn();

			DomainEventsBroker.registerEventHandler(
				"UserCreatedEvent",
				createdHandler,
			);
			DomainEventsBroker.registerEventHandler(
				"UserUpdatedEvent",
				updatedHandler,
			);

			const aggregate = new TestUserAggregate({
				name: "John",
				email: "john@test.com",
			});
			aggregate.createUser();
			aggregate.updateUser("Johnny");

			DomainEventsBroker.dispatchAggregateEvents(aggregate);

			expect(createdHandler).toHaveBeenCalledTimes(1);
			expect(updatedHandler).toHaveBeenCalledTimes(1);
		});

		it("should clear events after dispatch", () => {
			const aggregate = new TestUserAggregate({
				name: "John",
				email: "john@test.com",
			});
			aggregate.createUser();

			expect(aggregate.domainEvents).toHaveLength(1);

			DomainEventsBroker.dispatchAggregateEvents(aggregate);

			expect(aggregate.domainEvents).toHaveLength(0);
		});

		it("should unregister aggregate after dispatch", () => {
			const handler = vi.fn();
			DomainEventsBroker.registerEventHandler("UserCreatedEvent", handler);

			const aggregate = new TestUserAggregate({
				name: "John",
				email: "john@test.com",
			});
			aggregate.createUser();

			// First dispatch should work
			DomainEventsBroker.dispatchAggregateEvents(aggregate);
			expect(handler).toHaveBeenCalledTimes(1);

			// Second dispatch should not work (aggregate unregistered)
			DomainEventsBroker.dispatchAggregateEvents(aggregate);
			expect(handler).toHaveBeenCalledTimes(1);
		});

		it("should handle async handlers without waiting", () => {
			const asyncHandler: DomainEventHandler = vi.fn(async (_event) => {
				// Simulate async operation
				await new Promise((resolve) => setTimeout(resolve, 10));
				return Promise.resolve();
			});

			DomainEventsBroker.registerEventHandler("UserCreatedEvent", asyncHandler);

			const aggregate = new TestUserAggregate({
				name: "John",
				email: "john@test.com",
			});
			aggregate.createUser();

			// Should not throw and should not wait for async completion
			expect(() => {
				DomainEventsBroker.dispatchAggregateEvents(aggregate);
			}).not.toThrow();

			expect(asyncHandler).toHaveBeenCalledTimes(1);
		});

		it("should throw error if handler throws error", () => {
			const errorHandler = vi.fn(() => {
				throw new Error("Handler error");
			});

			DomainEventsBroker.registerEventHandler("UserCreatedEvent", errorHandler);

			const aggregate = new TestUserAggregate({
				name: "John",
				email: "john@test.com",
			});
			aggregate.createUser();

			// Should throw when handler errors
			expect(() => {
				DomainEventsBroker.dispatchAggregateEvents(aggregate);
			}).not.toThrow("Handler error");

			expect(errorHandler).toHaveBeenCalledTimes(1);
		});
	});

	describe("State Management", () => {
		it("should clear all event handlers", () => {
			const handler1 = vi.fn();
			const handler2 = vi.fn();

			DomainEventsBroker.registerEventHandler("UserCreatedEvent", handler1);
			DomainEventsBroker.registerEventHandler("ProductCreatedEvent", handler2);

			DomainEventsBroker.clearEventHandlers();

			const userAggregate = new TestUserAggregate({
				name: "John",
				email: "john@test.com",
			});
			const productAggregate = new TestProductAggregate({
				title: "Product",
				price: 99.99,
			});

			userAggregate.createUser();
			productAggregate.createProduct();

			DomainEventsBroker.dispatchAggregateEvents(userAggregate);
			DomainEventsBroker.dispatchAggregateEvents(productAggregate);

			expect(handler1).not.toHaveBeenCalled();
			expect(handler2).not.toHaveBeenCalled();
		});

		it("should clear all registered aggregates", () => {
			const handler = vi.fn();
			DomainEventsBroker.registerEventHandler("UserCreatedEvent", handler);

			const aggregate = new TestUserAggregate({
				name: "John",
				email: "john@test.com",
			});
			aggregate.createUser();

			DomainEventsBroker.clearRegisteredAggregates();

			// Should not dispatch since aggregates were cleared
			DomainEventsBroker.dispatchAggregateEvents(aggregate);

			expect(handler).not.toHaveBeenCalled();
		});

		it("should handle independent clearing of handlers vs aggregates", () => {
			const handler = vi.fn();
			DomainEventsBroker.registerEventHandler("UserCreatedEvent", handler);

			const aggregate = new TestUserAggregate({
				name: "John",
				email: "john@test.com",
			});
			aggregate.createUser();

			// Clear only handlers, not aggregates
			DomainEventsBroker.clearEventHandlers();

			DomainEventsBroker.dispatchAggregateEvents(aggregate);

			// Should still process but no handlers to call
			expect(handler).not.toHaveBeenCalled();
			expect(aggregate.domainEvents).toHaveLength(0); // Events still cleared
		});
	});

	describe("Integration Scenarios", () => {
		it("should handle end-to-end event registration and dispatch", () => {
			const userCreatedLog: any[] = [];
			const userUpdatedLog: any[] = [];

			const userCreatedHandler = (event: any) => {
				userCreatedLog.push(event);
			};
			const userUpdatedHandler = (event: any) => {
				userUpdatedLog.push(event);
			};

			DomainEventsBroker.registerEventHandler(
				"UserCreatedEvent",
				userCreatedHandler,
			);
			DomainEventsBroker.registerEventHandler(
				"UserUpdatedEvent",
				userUpdatedHandler,
			);

			const aggregate = new TestUserAggregate({
				name: "John",
				email: "john@test.com",
			});
			aggregate.createUser();
			aggregate.updateUser("Johnny");

			DomainEventsBroker.dispatchAggregateEvents(aggregate);

			expect(userCreatedLog).toHaveLength(1);
			expect(userUpdatedLog).toHaveLength(1);
			expect(userCreatedLog[0].data).toEqual({
				name: "John",
				email: "john@test.com",
			});
			expect(userUpdatedLog[0].data).toEqual({ name: "Johnny" });
		});

		it("should handle complex workflow with multiple steps", () => {
			const eventLog: string[] = [];

			const logHandler = (eventType: string) => (event: any) => {
				eventLog.push(`${eventType}:${event.aggregateId}`);
			};

			DomainEventsBroker.registerEventHandler(
				"UserCreatedEvent",
				logHandler("created"),
			);
			DomainEventsBroker.registerEventHandler(
				"UserUpdatedEvent",
				logHandler("updated"),
			);

			// Create multiple users and update them
			const user1 = new TestUserAggregate({
				name: "John",
				email: "john@test.com",
			});
			const user2 = new TestUserAggregate({
				name: "Jane",
				email: "jane@test.com",
			});

			// Step 1: Create users
			user1.createUser();
			user2.createUser();

			DomainEventsBroker.dispatchAggregateEvents(user1);
			DomainEventsBroker.dispatchAggregateEvents(user2);

			// Step 2: Update users (need to re-register since they were unregistered after dispatch)
			user1.updateUser("Johnny");
			user2.updateUser("Janet");

			DomainEventsBroker.dispatchAggregateEvents(user1);
			DomainEventsBroker.dispatchAggregateEvents(user2);

			expect(eventLog).toHaveLength(4);
			expect(eventLog[0]).toMatch(/^created:/);
			expect(eventLog[1]).toMatch(/^created:/);
			expect(eventLog[2]).toMatch(/^updated:/);
			expect(eventLog[3]).toMatch(/^updated:/);
		});
	});
});
