# Muthmer Order Processing — NestJS Microservices with Apache Kafka

An event-driven system composed of two NestJS microservices that communicate asynchronously over Apache Kafka. The system processes customer orders through the **Orders Service** (REST API + Kafka) and the **Inventory Service** (pure Kafka microservice).

## Architecture

```
┌────────────┐       POST /orders        ┌─────────────────┐
│   Client   │ ─────────────────────────▶ │  Orders Service │
│            │ ◀───────────────────────── │  (REST + Kafka) │
│            │       GET /orders/:id      │                 │
└────────────┘                            └────────┬────────┘
                                                   │
                                          order.created ▼
                                          ┌────────────────────┐
                                          │       Kafka        │
                                          └────────────────────┘
                                   order.confirmed / ▲        │ order.created
                                   order.failed      │        ▼
                                          ┌────────────────────┐
                                          │ Inventory Service  │
                                          │   (Kafka only)     │
                                          └────────────────────┘
```

## Event Flow

1. **Client** calls `POST /api/orders` on the Orders Service with a list of items and quantities.
2. The order is saved to PostgreSQL with status `PENDING` and an `order.created` event is published to Kafka.
3. **Inventory Service** consumes `order.created`, checks stock levels in the database for the requested items.
4. If all items are in stock, stock is **deducted** and `order.confirmed` is published. Otherwise, `order.failed` is published with a reason.
5. **Orders Service** consumes `order.confirmed` / `order.failed` and updates the order status to `CONFIRMED` or `FAILED`.
6. **Client** can call `GET /api/orders/:id` at any time to read the current status.

### Order Status Lifecycle

```
PENDING ──▶ CONFIRMED   (all items in stock)
PENDING ──▶ FAILED      (insufficient stock / error)
```

## Tech Stack

- **NestJS** — Framework for both services
- **Apache Kafka** — Async messaging between services via `@nestjs/microservices`
- **PostgreSQL** — Database for orders, items, and customers
- **Prisma** — ORM with migrations and seeding
- **Docker Compose** — Orchestrates Kafka, PostgreSQL, and both services

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js](https://nodejs.org/) v20+ (for local development)

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd muthmer-order-processing
```

### 2. Configure environment

Copy the example `.env` file and adjust values as needed:

```bash
cp example.env .env
```

Key environment variables:

| Variable                | Description                        | Default                                                   |
| ----------------------- | ---------------------------------- | --------------------------------------------------------- |
| `PORT`                  | Orders Service HTTP port           | `3000`                                                    |
| `API_PREFIX`            | REST API prefix                    | `api`                                                     |
| `DATABASE_URL`          | PostgreSQL connection string       | `postgresql://postgres:postgres@localhost:5432/muthmerDB` |
| `JWT_SECRET`            | Secret key for JWT tokens          | `super-secret-key`                                        |
| `KAFKA_BROKER`          | Kafka broker address               | `localhost:9092`                                          |
| `KAFKA_ORDERS_GROUP`    | Kafka consumer group for Orders    | `orders-consumer-group`                                   |
| `KAFKA_INVENTORY_GROUP` | Kafka consumer group for Inventory | `inventory-consumer-group`                                |

### 3. Start infrastructure with Docker Compose

Spin up Kafka, PostgreSQL, the database migration service, and both application services:

```bash
docker-compose up --build -d
```

> This starts Kafka (KRaft mode) and PostgreSQL. A dedicated `db-migrate` service will then automatically run Prisma migrations and seed the database. Once completed, the Orders Service and Inventory Service will start automatically.

The automated seed populates the database with **test data** for development and demonstration. It creates:

**Customers** (3 pre-registered users):

| Name            | Email                     | Password             |
| --------------- | ------------------------- | -------------------- |
| Ahmed Yousry    | ahmedyousry098@gmail.com  | `SecurePassword@123` |
| Mohammed Ali    | mohammed.ali@gmail.com    | `SecurePassword@123` |
| Zainab Mohammed | zainab.mohammed@gmail.com | `SecurePassword@123` |

**Items** (3 products with stock):

| Name                | SKU          | Price  | Stock |
| ------------------- | ------------ | ------ | ----- |
| Wireless Mouse      | MOUSE-001    | $29.99 | 150   |
| Mechanical Keyboard | KEYBOARD-001 | $89.99 | 75    |
| USB-C Hub           | HUB-001      | $45.00 | 200   |

> ⚠️ **Note**: Seed data is for testing and development only. All customer passwords are hashed with bcrypt.

## Local Development (without Docker for services)

If you prefer to run the services locally during development:

```bash
# Start only Kafka and PostgreSQL via Docker
docker-compose up -d kafka postgres

# Install dependencies
npm install

# Run migrations
npm run prisma:migrate

# Seed the database
npm run prisma:seed

# Start Orders Service (terminal 1)
npm run start:orders

# Start Inventory Service (terminal 2)
npm run start:inventory
```

## API Documentation

Once the Orders Service is running, Swagger documentation is available at:

```
http://localhost:<PORT>/docs
```

### Endpoints

#### Auth

| Method | Endpoint             | Description             |
| ------ | -------------------- | ----------------------- |
| POST   | `/api/auth/register` | Register a new customer |
| POST   | `/api/auth/login`    | Login and get JWT token |
| POST   | `/api/auth/logout`   | Logout (clears cookie)  |

#### Orders (requires authentication)

| Method | Endpoint          | Description                         |
| ------ | ----------------- | ----------------------------------- |
| POST   | `/api/orders`     | Create a new order                  |
| GET    | `/api/orders/:id` | Get order by ID with current status |

### Example Usage

**1. Login to get a token:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ahmedyousry098@gmail.com", "password": "SecurePassword@123"}'
```

**2. Create an order (use the access_token from login):**

> **Note**: This endpoint requires a valid UUID v4 in the `x-idempotency-key` header to prevent duplicate orders. Swagger UI is pre-configured with a default key for easy testing.

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -H "x-idempotency-key: $(uuidgen)" \
  -d '{
    "items": [
      { "item_id": "<item-uuid>", "quantity": 2 },
      { "item_id": "<item-uuid>", "quantity": 1 }
    ]
  }'
```

**3. Check order status:**

```bash
curl http://localhost:3000/api/orders/<order-id> \
  -H "Authorization: Bearer <access_token>"
```

## Project Structure

```
muthmer-order-processing/
├── apps/
│   ├── db-migrate/             # Dedicated Prisma migration & seeding service
│   ├── orders-service/         # REST API + Kafka consumer/producer
│   │   └── src/
│   │       ├── app/
│   │       │   ├── auth/       # Authentication (register, login, JWT)
│   │       │   │   ├── dto/
│   │       │   │   ├── guards/
│   │       │   │   ├── interfaces/
│   │       │   │   └── middleware/
│   │       │   └── orders/     # Orders module (CRUD + Kafka events)
│   │       │       └── dto/
│   │       └── i18n/           # Internationalization (en, ar)
│   └── inventory-service/      # Pure Kafka microservice
│       └── src/
│           └── app/
├── libs/
│   └── shared/                 # Shared library
│       ├── prisma/
│       │   ├── migrations/
│       │   ├── schema.prisma
│       │   └── seed/           # Database seed scripts
│       └── src/
│           ├── config/         # AppConfigService, env validation
│           ├── dto/
│           ├── filters/        # Global exception filter
│           ├── i18n/
│           └── prisma/         # PrismaService
├── docker-compose.yaml
├── .env
└── example.env
```

## Available Scripts

| Command                   | Description                         |
| ------------------------- | ----------------------------------- |
| `npm run start:orders`    | Start Orders Service in dev mode    |
| `npm run start:inventory` | Start Inventory Service in dev mode |
| `npm run build:orders`    | Build Orders Service                |
| `npm run build:inventory` | Build Inventory Service             |
| `npm run prisma:migrate`  | Run Prisma migrations               |
| `npm run prisma:seed`     | Seed the database with test data    |
| `npm run prisma:studio`   | Open Prisma Studio (database GUI)   |
| `npm run format`          | Format code with Prettier           |
