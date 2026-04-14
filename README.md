# Leaderboards api

REST API built with `Express`, `TypeScript`, and `MariaDB` for managing a user leaderboard.  
The service allows you to:

- add score events for a user;
- retrieve the top 100 leaderboard entries;
- get the current rank of a specific user.

The project stores raw score events in the `scores` table and maintains an aggregated `user_score_stats` table for fast leaderboard queries.

## Load

- 50,000 users regularly earning and updating scores
- 100,000 user records
- 500,000 records in the `scores` table

## Architectural Design

The product requirements call for designing three endpoints. To start, we’ll use the simplest data model with two tables: `users` and `scores` (one-to-many). We’ll design SQL queries and, based on them, decide which indexes to use. The greatest performance degradation occurs for read operations due to the use of aggregate functions and heavy queries with GROUP BY and sorting, which require scanning the entire table and sorting. A query to the database via /users/:id/rank requires calculating the total score of all users and ranking them.  The query for the leaderboard requires iterating through all users (100k – aggregation + sorting) to display the top 100 leaders. These two queries are the bottleneck. Write operations are cheaper (/scores). With the base data model (users and scores tables), query optimization and indexing do not yield significant performance gains. 

We improve the data model: we create an intermediate table, user_score_stats. The complexity shifts to the write operation, since we need to write to two tables (transaction). The query for the leaderboard does not contain aggregate functions, since the sum of scores is calculated before insertion.

Further improvements:  As the load increases, a single database server will become a bottleneck because read and write operations are performed simultaneously. In other words, it is necessary to write to /scores and read from /leaderboard at the same time. Additionally, as the size of the user_stats table grows, queries with ORDER BY will become slower. Here, Redis can be used for fast reading of rankings, since it is assumed that the order of users in the ranking will not change rapidly or significantly over a short period of time. To reduce the write load, you can use queues and batch processing. Since you need to write to multiple locations at once, this will increase the load and response time, while a queue will allow you to load data gradually and smooth out load spikes.

Next Steps
1) If there is a high read load on the leaderboard, consider using Redis as a cache for the top results
2) If write latency increases, consider using queues for asynchronous updates to the read model
To test hypotheses about bottlenecks, use local k6 scenarios

## Running MariaDB Locally with Docker

0. Set up `.env` using `.env.example`.

1. Start MariaDB:

```bash
docker compose up -d
```

If the container was already created before changes to `docker-compose.yml`, recreate it:

```bash
docker compose up -d --force-recreate mariadb
```

2. Verify that the container is running:

```bash
docker compose ps
```

3. Run the seed script:

```bash
npm run seed
```

The `seed` script creates the tables automatically, so you do not need to apply `schema.sql` separately beforehand.

4. Start the server:

```bash
npm run dev
```

Docker Compose creates the `leaderboard_app` database automatically, so there is no need to create it manually.

## Run

Development mode:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Run the compiled version:

```bash
npm start
```

By default, the server starts on `http://localhost:3000`.

## Stack

- Node.js
- Express 5
- TypeScript
- MariaDB
- `tsx` for local development

## Project Structure

```text
src/
  controllers/    HTTP handlers
  services/       business logic
  repositories/   SQL queries and database access
  middleware/     error handling
  utils/          helper utilities
  index.ts        entry point
  server.ts       Express setup
  seed.ts         test data generation
schema.sql        database schema
```

## Requirements

- Node.js 20+
- MariaDB 10.5+ or a compatible version with window function support
- npm

## Installation

```bash
npm install
```

## Environment Configuration

Create `.env` from the example:

```bash
cp .env.example .env
```

For local runs with `docker-compose.yml`, the default connection values are:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=app_user
DB_PASSWORD=app_password
DB_NAME=leaderboard_app
```

Available variables:

| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | HTTP server port | `3000` |
| `DB_HOST` | MariaDB host | `localhost` |
| `DB_PORT` | MariaDB port | `3306` |
| `DB_USER` | Database user | `app_user` |
| `DB_PASSWORD` | Database password | `app_password` |
| `DB_NAME` | Database name | `leaderboard_app` |
| `DB_CONNECTION_LIMIT` | Connection pool limit | `1000` |

## Applying the Schema Manually

If you want to run the application without `seed`, you can apply the schema from `schema.sql` manually:

```bash
mysql -u app_user -p leaderboard_app < schema.sql
```

After that, the application can be started normally.

## Seeding Test Data

The `seed` script:

- creates tables if needed;
- clears existing data;
- inserts `100000` users;
- inserts `700000` score records;
- rebuilds the `user_score_stats` table.

Run it with:

```bash
npm run seed
```

Important: the script deletes existing data from the `users`, `scores`, and `user_score_stats` tables.

## API

### `GET /leaderboard`

Returns the top 100 users sorted by `total_score DESC, user_id ASC`.

Example request:

```bash
curl http://localhost:3000/leaderboard
```

Example response:

```json
[
  {
    "rank": 1,
    "username": "user_42",
    "total_score": 15890,
    "average_score": 512.58,
    "last_activity": "2026-04-13T10:15:30.000Z"
  }
]
```

### `GET /users/:id/rank`

Returns the user's rank and aggregated statistics.

Example request:

```bash
curl http://localhost:3000/users/1/rank
```

Example response:

```json
{
  "rank": 245,
  "user_id": 1,
  "username": "user_1",
  "total_score": 8940,
  "average_score": 447,
  "last_activity": "2026-04-13T10:15:30.000Z"
}
```

If the user is not found, the service returns `404`.

### `POST /scores`

Adds a new score record and updates the user's aggregated statistics in the same transaction.

Request body:

```json
{
  "user_id": 1,
  "value": 250
}
```

Example request:

```bash
curl -X POST http://localhost:3000/scores \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"value":250}'
```

Example response:

```json
{
  "id": 700001,
  "user_id": 1,
  "value": 250,
  "created_at": "2026-04-13T10:15:30.000Z"
}
```
