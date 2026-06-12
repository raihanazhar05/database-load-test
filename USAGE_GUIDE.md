# 📖 Database Load Test - Usage Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Configuration](#configuration)
3. [Running Tests](#running-tests)
4. [Workloads Explained](#workloads-explained)
5. [Understanding Results](#understanding-results)
6. [Reports & Output](#reports--output)
7. [Docker Setup](#docker-setup)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Usage](#advanced-usage)

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Your Databases
You need PostgreSQL and/or SQL Server running. See [Docker Setup](#docker-setup) for the quickest way.

### 3. Configure Connections
Edit `config.json` with your database credentials.

### 4. Run the Test
```bash
npm start
```

---

## Configuration

The `config.json` file controls everything. Here are all the settings:

### Database Connections

```json
{
  "databases": {
    "postgresql": {
      "host": "localhost",
      "port": 5432,
      "database": "testdb",
      "user": "postgres",
      "password": "password",
      "maxConnections": 100
    },
    "sqlserver": {
      "server": "localhost",
      "port": 1433,
      "database": "testdb",
      "user": "sa",
      "password": "Password123!",
      "options": {
        "trustServerCertificate": true
      },
      "pool": {
        "max": 100
      }
    }
  }
}
```

**Note:** You can test just one database by removing the other from the config. For example, to test only PostgreSQL, remove the entire `sqlserver` section.

### Test Settings

```json
{
  "testSettings": {
    "durationSeconds": 60,
    "warmupSeconds": 10,
    "concurrencyLevels": [10, 50, 100, 200],
    "workload": "SelectHeavy",
    "outputDirectory": "./reports",
    "reportFormats": ["html", "json", "csv"]
  }
}
```

| Setting | Description | Default |
|---------|-------------|---------|
| `durationSeconds` | How long each test runs (in seconds) | 60 |
| `warmupSeconds` | Warmup period before measurement (in seconds) | 10 |
| `concurrencyLevels` | Array of concurrent connection levels to test | [10, 50, 100, 200] |
| `workload` | Which workload to run | SelectHeavy |
| `outputDirectory` | Where reports are saved | ./reports |
| `reportFormats` | Output formats: html, json, csv | ["html", "json", "csv"] |

---

## Running Tests

### Basic Usage
```bash
# Run with default config
npm start

# Run with custom config file
node index.js ./my-config.json
```

### Workload-Specific Commands
```bash
# Select-heavy workload (default)
npm run test:select

# Insert-heavy workload
npm run test:insert

# Update-heavy workload
npm run test:update

# Mixed workload
npm run test:mixed
```

### Custom SQL Queries
```bash
# Create a .sql file with your queries (separated by semicolons)
# Then run:
node index.js ./config.json CustomSql ./my-queries.sql
```

**Example custom-queries.sql:**
```sql
SELECT * FROM users WHERE active = 1;
UPDATE orders SET status = 'shipped' WHERE id = 100;
SELECT COUNT(*) FROM products WHERE price > 50;
```

### Changing Workload in Config
Edit `config.json` and change the `workload` field:
```json
"workload": "InsertHeavy"
```

Available workloads: `SelectHeavy`, `InsertHeavy`, `UpdateHeavy`, `Mixed`, `CustomSql`

---

## Workloads Explained

### 1. SelectHeavy
- **Purpose:** Test read performance under heavy load
- **Queries:** Simple SELECT, range filters, aggregation, pagination, complex multi-condition queries
- **Data:** 10,000 seed records inserted before testing
- **Best For:** OLAP, reporting, analytics workloads

### 2. InsertHeavy
- **Purpose:** Test write/insert throughput
- **Queries:** Single INSERT statements with randomized data
- **Data:** 1,000 initial seed records
- **Best For:** Data ingestion, ETL, logging workloads

### 3. UpdateHeavy
- **Purpose:** Test update performance and locking behavior
- **Queries:** Single-row updates, batch range updates, conditional updates
- **Data:** 10,000 seed records
- **Best For:** OLTP, transactional workloads

### 4. Mixed
- **Purpose:** Simulate real-world application load
- **Queries:** 70% SELECT, 20% INSERT, 10% UPDATE
- **Data:** 10,000 seed records
- **Best For:** General application benchmarking

### 5. CustomSql
- **Purpose:** Run your own specific queries
- **Queries:** Loaded from a .sql file you provide
- **Data:** Depends on your queries
- **Best For:** Testing specific business logic, stored procedures, complex joins

---

## Understanding Results

### Console Output

```
┌──────────────────────────────────────────┐
│ PostgreSQL (SelectHeavy)                   │
│ Concurrency: 100                           │
│                                            │
│ QPS: 1250.50                               │
│ Total: 75,030  Success: 75,030  Failed: 0   │
│                                            │
│ Latency: avg 2.50ms  p50 2.10ms  p95 5.20ms  p99 8.50ms
└──────────────────────────────────────────┘
```

### Metrics Explained

| Metric | What It Means | Good Value |
|--------|--------------|------------|
| **QPS** | Queries Per Second - how many queries the database handles per second | Higher is better |
| **Total** | Total queries executed during the test | Should be large for accurate stats |
| **Success** | Queries that completed without errors | Should equal Total |
| **Failed** | Queries that returned errors | Should be 0 or very low |
| **Avg Latency** | Average query response time | Lower is better |
| **P50 (Median)** | 50% of queries are faster than this | Lower is better |
| **P95** | 95% of queries are faster than this | Lower is better |
| **P99** | 99% of queries are faster than this | Lower is better - watch for outliers |

### Head-to-Head Comparison

```
⚡ Head-to-Head Comparison:

┌──────────────┬──────────────────┬──────────────────┬──────────┐
│ Metric       │ PostgreSQL 🐘   │ SQL Server 🎯   │ Winner   │
├──────────────┼──────────────────┼──────────────────┼──────────┤
│ QPS          │ 1250.50         │ 980.30           │ 🐘       │
│ Avg Latency  │ 2.50ms          │ 3.20ms           │ 🐘       │
│ P95 Latency  │ 5.20ms          │ 6.80ms           │ 🐘       │
│ P99 Latency  │ 8.50ms          │ 12.10ms          │ 🐘       │
└──────────────┴──────────────────┴──────────────────┴──────────┘
```

---

## Reports & Output

After the test completes, reports are generated in the `./reports/` folder.

### HTML Report
- **File:** `Report_2024-06-12T10-00-00-000Z.html`
- **Features:**
  - Interactive charts (Chart.js)
  - QPS comparison bar chart
  - Latency percentile line chart
  - Summary statistics per database
  - Works offline after generation
- **How to View:** Open in any web browser (Chrome, Firefox, Edge, Safari)

### JSON Report
- **File:** `Report_2024-06-12T10-00-00-000Z.json`
- **Use For:** CI/CD pipelines, programmatic analysis, archiving raw data
- **Structure:** Array of test results with full metrics and time-series data

### CSV Report
- **File:** `Report_2024-06-12T10-00-00-000Z.csv`
- **Use For:** Excel, Google Sheets, data analysis
- **Columns:** Database, Workload, Concurrency, Total, Successful, Failed, QPS, AvgLatency, MinLatency, MaxLatency, P50, P95, P99, Duration

---

## Docker Setup

The fastest way to get databases running for testing:

### PostgreSQL
```bash
docker run -d \
  --name pg-loadtest \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=testdb \
  postgres:15
```

Update `config.json`:
```json
"postgresql": {
  "host": "localhost",
  "port": 5432,
  "database": "testdb",
  "user": "postgres",
  "password": "password",
  "maxConnections": 100
}
```

### SQL Server
```bash
docker run -d \
  --name mssql-loadtest \
  -p 1433:1433 \
  -e ACCEPT_EULA=Y \
  -e SA_PASSWORD=Password123! \
  mcr.microsoft.com/mssql/server:2022-latest
```

Update `config.json`:
```json
"sqlserver": {
  "server": "localhost",
  "port": 1433,
  "database": "testdb",
  "user": "sa",
  "password": "Password123!",
  "options": { "trustServerCertificate": true },
  "pool": { "max": 100 }
}
```

### Start Both
```bash
# Run these commands in your terminal, then wait 30-60 seconds for the databases to initialize
# Then run the test:
npm start
```

### Stop & Clean Up
```bash
docker stop pg-loadtest mssql-loadtest
docker rm pg-loadtest mssql-loadtest
```

---

## Single Database Testing

You can test only one database without needing to remove anything from `config.json`:

### Test Only PostgreSQL
```bash
node index.js --db postgresql

# Or via npm script:
npm run test:pg
```

### Test Only SQL Server
```bash
node index.js --db sqlserver

# Or via npm script:
npm run test:mssql
```

**Note:** The `--db` flag accepts `postgresql` or `sqlserver`. If the database isn't found in your config, you'll get an error with the available options.

---

## Troubleshooting

### Connection Errors
```
✖ Failed to connect to PostgreSQL: Connection refused
```
**Solution:** Check that your database is running and the host/port in `config.json` are correct.

### Authentication Errors
```
✖ Failed to connect to SQL Server: Login failed for user 'sa'
```
**Solution:** Verify the username and password in `config.json`. For SQL Server, the password must meet complexity requirements (uppercase, lowercase, number, special character).

### ESM Module Errors
```
Error [ERR_REQUIRE_ESM]: require() of ES Module not supported
```
**Solution:** This app uses CommonJS (`require()`) syntax. The dependencies are already pinned to CommonJS-compatible versions in `package.json`. If you see this, run:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Out of Memory
```
FATAL ERROR: Ineffective mark-compacts near heap limit
```
**Solution:** Reduce `concurrencyLevels` or `durationSeconds` in `config.json`. For example, try `[10, 50]` instead of `[10, 50, 100, 200]`.

### Slow Performance / Timeouts
- Check if the database server has enough resources (CPU, RAM)
- Increase database connection pool limits
- Check network latency if connecting to remote databases
- Ensure indexes exist on the test table (they are created automatically)

---

## Advanced Usage

### Test Only One Database
Remove the database you don't want to test from `config.json`:
```json
{
  "databases": {
    "postgresql": {
      "host": "localhost",
      "port": 5432,
      "database": "testdb",
      "user": "postgres",
      "password": "password",
      "maxConnections": 100
    }
  }
}
```

### Adjust Concurrency Levels
```json
"concurrencyLevels": [1, 10, 25, 50, 100, 250, 500]
```
Higher concurrency = more simultaneous connections. Good for finding the database's breaking point.

### Shorter/Faster Tests
```json
{
  "testSettings": {
    "durationSeconds": 10,
    "warmupSeconds": 2,
    "concurrencyLevels": [10, 50]
  }
}
```
Use this for quick sanity checks during development.

### Longer Stress Tests
```json
{
  "testSettings": {
    "durationSeconds": 300,
    "warmupSeconds": 30,
    "concurrencyLevels": [50, 100, 200, 500, 1000]
  }
}
```
Use this for production-like stress testing.

### Custom Test Table
The app automatically creates a `test_table` with:
- `id` (primary key, auto-increment)
- `name` (varchar, indexed)
- `email` (varchar)
- `created_at` (timestamp, indexed)
- `status` (varchar, indexed)
- `amount` (decimal)
- `metadata` (json for PostgreSQL, nvarchar(max) for SQL Server)

You can modify the `setupTestTable()` method in `src/databases/postgresql.js` or `src/databases/sqlserver.js` if you need a different schema.

### Adding a New Workload
1. Create a new file in `src/workloads/` (e.g., `myWorkload.js`)
2. Extend `BaseWorkload`:
```javascript
const BaseWorkload = require('./base');

class MyWorkload extends BaseWorkload {
  async prepare() {
    // Insert seed data if needed
  }

  async execute() {
    const query = `SELECT * FROM test_table WHERE ...`;
    const result = await this.db.execute(query);
    return { ...result, queryType: 'my_query' };
  }

  getName() { return 'MyWorkload'; }
  getDescription() { return 'My custom workload'; }
}

module.exports = MyWorkload;
```
3. Register it in `index.js`:
```javascript
const MyWorkload = require('./src/workloads/myWorkload');

const WORKLOADS = {
  SelectHeavy: SelectHeavyWorkload,
  // ... other workloads
  MyWorkload: MyWorkload
};
```
4. Use it: change `workload` in `config.json` to `"MyWorkload"`

---

## FAQ

**Q: Can I test against a remote database?**  
A: Yes! Just change the `host`/`server` in `config.json` to the remote IP or hostname. Make sure the database allows connections from your IP.

**Q: Can I test only PostgreSQL or only SQL Server?**  
A: Yes! Remove the database section you don't want to test from `config.json`. The app will only test the one that's configured.

**Q: Can I run multiple workloads in one test?**  
A: Currently, you run one workload per test execution. To compare workloads, run the test multiple times with different `workload` values in `config.json`.

**Q: Is the test data persistent?**  
A: No. The app creates and drops the `test_table` each time. Your existing data is safe.

**Q: Can I use this for non-test databases?**  
A: Yes, but be careful. The app creates and drops a table called `test_table`. If your database already has a `test_table`, it will be dropped! You can change the table name in the database adapter files.

**Q: Does this work on Mac/Linux?**  
A: Yes! The app is cross-platform and works on Windows, macOS, and Linux.

---

## Need Help?

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Verify your database is running and accessible
3. Double-check your `config.json` credentials
4. Check the console output for specific error messages
