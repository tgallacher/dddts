# ddd-typescript

TypeScript building blocks for Domain-Driven Design (DDD) tactical patterns.

## Installation

```bash
npm install ddd-typescript
```

## Features

- **Entity**: Objects defined by identity rather than attributes
- **Value Object**: Immutable objects defined by their attributes
- **Aggregate Root**: Cluster of entities and value objects with a consistency
  boundary
- **Domain Events**: Event-driven architecture support with an in-process broker

## Usage

### Entity

```typescript
import { AbstractEntity } from "ddd-typescript";

type UserProps = {
  id?: string;
  name: string;
  email: string;
};

class User extends AbstractEntity<UserProps> {
  get name() {
    return this._data.name;
  }

  get email() {
    return this._data.email;
  }
}

const user = new User({ name: "John", email: "john@example.com" });
console.log(user.id); // Auto-generated UUID
```

### Value Object

```typescript
import { ValueObject } from "ddd-typescript";

type EmailProps = {
  value: string;
};

class Email extends ValueObject<EmailProps> {
  constructor(email: string) {
    super({ value: email });
  }

  get address() {
    return this._data.value;
  }
}

const email1 = new Email("user@example.com");
const email2 = new Email("user@example.com");
console.log(email1.equals(email2)); // true
```

### Aggregate Root with Domain Events

```typescript
import {
  AbstractAggregateRoot,
  AbstractDomainEvent,
  DomainEventsBroker,
} from "ddd-typescript";

class UserCreatedEvent extends AbstractDomainEvent<{ email: string }> {}

type UserProps = {
  id?: string;
  email: string;
};

class User extends AbstractAggregateRoot<UserProps> {
  static create(email: string) {
    const user = new User({ email });
    user.addDomainEvent(
      new UserCreatedEvent({ aggregateId: user.id }, { email }),
    );
    return user;
  }

  get email() {
    return this._data.email;
  }
}

// Register event handler
DomainEventsBroker.registerEventHandler("UserCreatedEvent", (event) => {
  console.log("User created:", event.data);
});

const user = User.create("user@example.com");
DomainEventsBroker.dispatchAggregateEvents(user);
```

## API Reference

### AbstractEntity

Base class for entities with identity-based equality.

- `id: string` - Unique identifier (auto-generated UUID)
- `equals(object?: Entity): boolean` - Compare entities by identity

### ValueObject

Base class for value objects with attribute-based equality.

- `value: T` - Immutable data
- `equals(vo?: ValueObject<T>): boolean` - Compare by shallow equality

### AbstractAggregateRoot

Base class for aggregate roots with domain event support.

- `domainEvents: DomainEvent[]` - Array of pending domain events
- `addDomainEvent(event: DomainEvent): void` - Add event to aggregate
- `clearDomainEvents(): void` - Clear all events

### DomainEventsBroker

In-process message broker for domain events.

- `registerEventHandler(eventName: string, handler: DomainEventHandler): void` -
  Register handler
- `registerAggregate(aggregate: AggregateRoot): void` - Register aggregate for
  dispatch
- `dispatchAggregateEvents(aggregate: AggregateRoot): void` - Dispatch aggregate
  events
- `clearEventHandlers(): void` - Clear all handlers
- `clearRegisteredAggregates(): void` - Clear all registered aggregates

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Type check
npm run typecheck

# Watch mode
npm run dev
```

## License

ISC
