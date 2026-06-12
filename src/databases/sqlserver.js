const sql = require('mssql');

class SqlServerTarget {
  constructor(config) {
    this.config = config;
    this.pool = null;
  }

  async connect() {
    const poolConfig = {
      server: this.config.server,
      port: this.config.port || 1433,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      options: this.config.options || {
        trustServerCertificate: true
      },
      pool: {
        max: (this.config.pool && this.config.pool.max) || 20,
        min: 0,
        idleTimeoutMillis: 30000
      }
    };
    
    this.pool = await sql.connect(poolConfig);
    console.log('✅ Connected to SQL Server');
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.close();
      console.log('🔌 Disconnected from SQL Server');
    }
  }

  async execute(query, params = []) {
    const start = Date.now();
    try {
      const request = this.pool.request();
      
      // Add parameters if provided
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
      
      const result = await request.query(query);
      const duration = Date.now() - start;
      return { success: true, duration, rows: result.recordset };
    } catch (error) {
      const duration = Date.now() - start;
      return { success: false, duration, error: error.message };
    }
  }

  async setupTestTable() {
    const queries = [
      `IF OBJECT_ID('test_table', 'U') IS NOT NULL DROP TABLE test_table`,
      `CREATE TABLE test_table (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        email NVARCHAR(100) NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        status NVARCHAR(20) DEFAULT 'active',
        amount DECIMAL(10,2) DEFAULT 0.00,
        metadata NVARCHAR(MAX) DEFAULT '{}'
      )`,
      `CREATE INDEX idx_test_table_name ON test_table(name)`,
      `CREATE INDEX idx_test_table_status ON test_table(status)`,
      `CREATE INDEX idx_test_table_created_at ON test_table(created_at)`
    ];
    
    for (const query of queries) {
      await this.execute(query);
    }
    
    console.log('✅ SQL Server test table created');
  }

  getName() {
    return 'SQL Server';
  }
}

module.exports = SqlServerTarget;
