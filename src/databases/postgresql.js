const { Pool } = require('pg');

class PostgreSqlTarget {
  constructor(config) {
    this.config = config;
    this.pool = null;
  }

  async connect() {
    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      max: this.config.maxConnections || 20
    });
    
    // Test connection
    const client = await this.pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    console.log('✅ Connected to PostgreSQL');
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      console.log('🔌 Disconnected from PostgreSQL');
    }
  }

  async execute(query, params = []) {
    const start = Date.now();
    try {
      const result = await this.pool.query(query, params);
      const duration = Date.now() - start;
      return { success: true, duration, rows: result.rows };
    } catch (error) {
      const duration = Date.now() - start;
      return { success: false, duration, error: error.message };
    }
  }

  async setupTestTable() {
    const queries = [
      `DROP TABLE IF EXISTS test_table`,
      `CREATE TABLE test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'active',
        amount DECIMAL(10,2) DEFAULT 0.00,
        metadata JSONB DEFAULT '{}'
      )`,
      `CREATE INDEX idx_test_table_name ON test_table(name)`,
      `CREATE INDEX idx_test_table_status ON test_table(status)`,
      `CREATE INDEX idx_test_table_created_at ON test_table(created_at)`
    ];
    
    for (const query of queries) {
      await this.execute(query);
    }
    
    console.log('✅ PostgreSQL test table created');
  }

  getName() {
    return 'PostgreSQL';
  }
}

module.exports = PostgreSqlTarget;
