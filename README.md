# 🗄️ Database Load Test

A high-performance database load testing tool for comparing **PostgreSQL** and **SQL Server** under various workloads.

## 🚀 Features

- **Dual Database Support**: Compare PostgreSQL vs SQL Server side-by-side
- **Multiple Workloads**:
  - `SelectHeavy` - High-query SELECT workload with filtering, aggregation, pagination
  - `InsertHeavy` - High INSERT throughput testing
  - `UpdateHeavy` - Transactional UPDATE workload
  - `Mixed` - Real-world mix: 70% SELECT, 20% INSERT, 10% UPDATE
  - `CustomSql` - Load your own SQL queries from file
- **Rich Reporting**:
  - Real-time CLI dashboard with live stats
  - Beautiful HTML reports with charts (Chart.js)
  - JSON export for CI/CD integration
  - CSV export for Excel analysis
- **Configurable**: JSON-based configuration, no code changes needed

## 📋 Prerequisites

- Node.js 18+ (v20 recommended)
- PostgreSQL 12+ or SQL Server 2019+ (or Docker)

## 📦 Installation

```bash
# Install dependencies
npm install
```

## ⚙️ Configuration

Edit `config.json` to set your database connections and test parameters:

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
      "options": { "trustServerCertificate": true },
      "pool": { "max": 100 }
    }
  },
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

## 🏃 Usage

```bash
# Run with default config (SelectHeavy workload)
npm start

# Run specific workload
node index.js ./config.json

# Custom SQL queries
node index.js ./config.json CustomSql ./custom-queries.sql
```

### Workload Options

Change `workload` in `config.json` or use the shorthand scripts:

```bash
# Select-heavy workload
npm run test:select

# Insert-heavy workload
npm run test:insert

# Update-heavy workload
npm run test:update

# Mixed workload
npm run test:mixed
```

## 📊 Output

### Console Output
```
🚀 Starting SelectHeavy workload on PostgreSQL
   Duration: 60s | Warmup: 10s | Concurrency: 100

📊 Final Results:

┌──────────────────────────────────────────┐
│ PostgreSQL (SelectHeavy)                   │
│ Concurrency: 100                           │
│                                            │
│ QPS: 1250.50                               │
│ Total: 75,030  Success: 75,030  Failed: 0   │
│                                            │
│ Latency: avg 2.50ms  p50 2.10ms  p95 5.20ms  p99 8.50ms
└──────────────────────────────────────────┘

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

### Generated Reports

Reports are saved in `./reports/` with timestamped filenames:

- `Report_2024-...html` - Interactive dashboard with charts
- `Report_2024-...json` - Raw JSON data
- `Report_2024-...csv` - Spreadsheet-friendly CSV

## 🐳 Docker Quick Start (Optional)

Run PostgreSQL and SQL Server in Docker for testing:

```bash
# PostgreSQL
docker run -d --name pg-test -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=testdb postgres:15

# SQL Server
docker run -d --name mssql-test -p 1433:1433 -e ACCEPT_EULA=Y -e SA_PASSWORD=Password123! mcr.microsoft.com/mssql/server:2022-latest
```

## 🛠️ Architecture

```
database-load-test/
├── src/
│   ├── config.js          # Configuration loader
│   ├── metrics.js         # Metrics collection & stats
│   ├── engine.js          # Workload orchestrator
│   ├── reports.js         # HTML/JSON/CSV generators
│   ├── cli.js             # Console UI & display
│   ├── databases/
│   │   ├── postgresql.js  # PostgreSQL adapter
│   │   └── sqlserver.js   # SQL Server adapter
│   └── workloads/
│       ├── base.js        # Base workload class
│       ├── selectHeavy.js # SELECT workload
│       ├── insertHeavy.js # INSERT workload
│       ├── updateHeavy.js # UPDATE workload
│       ├── mixed.js       # Mixed workload
│       └── customSql.js   # Custom SQL loader
├── config.json            # Test configuration
├── index.js               # Main entry point
└── reports/               # Generated reports
```

## 📈 Metrics Explained

| Metric | Description |
|--------|-------------|
| **QPS** | Queries Per Second - throughput measure |
| **Avg Latency** | Average query response time |
| **P50** | Median latency (50th percentile) |
| **P95** | 95th percentile latency - 95% of queries are faster |
| **P99** | 99th percentile latency - worst-case baseline |
| **Failed** | Number of queries that returned errors |

## 🔧 Customization

### Custom SQL Queries

Create a `.sql` file with your queries (separated by semicolons):

```sql
SELECT * FROM users WHERE active = 1;
UPDATE orders SET status = 'shipped' WHERE id = 100;
```

Then run:
```bash
node index.js ./config.json CustomSql ./my-queries.sql
```

### Adjusting Test Parameters

Modify `config.json`:
- `durationSeconds`: How long each test runs (default: 60s)
- `warmupSeconds`: Warmup period before measurement (default: 10s)
- `concurrencyLevels`: Array of concurrent connection levels to test
- `reportFormats`: Array of output formats: `["html", "json", "csv"]`

## 📄 License

ISC
