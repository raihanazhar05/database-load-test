const BaseWorkload = require('./base');

class SelectHeavyWorkload extends BaseWorkload {
  async prepare() {
    // Insert 10,000 seed records for realistic SELECT queries
    const batchSize = 1000;
    const totalRecords = 10000;
    const batches = Math.ceil(totalRecords / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const values = [];
      for (let j = 0; j < batchSize; j++) {
        const idx = i * batchSize + j;
        const dbName = this.db.getName();
        if (dbName === 'PostgreSQL') {
          values.push(`('User${idx}', 'user${idx}@example.com', 'active', ${(Math.random() * 1000).toFixed(2)}, '{"key": "value${idx}"}')`);
        } else {
          values.push(`('User${idx}', 'user${idx}@example.com', 'active', ${(Math.random() * 1000).toFixed(2)}, '{}')`);
        }
      }
      
      const query = dbName === 'PostgreSQL'
        ? `INSERT INTO test_table (name, email, status, amount, metadata) VALUES ${values.join(',')}`
        : `INSERT INTO test_table (name, email, status, amount, metadata) VALUES ${values.join(',')}`;
        
      await this.db.execute(query);
    }
    
    console.log(`✅ ${this.db.getName()}: Seeded ${totalRecords} records`);
  }

  async execute() {
    const queries = [
      // Simple SELECT by name
      () => {
        const randomName = `User${Math.floor(Math.random() * 10000)}`;
        return {
          query: `SELECT * FROM test_table WHERE name = '${randomName}'`,
          type: 'select_by_name'
        };
      },
      // SELECT with range filter
      () => {
        const minAmount = Math.random() * 500;
        const maxAmount = minAmount + 500;
        return {
          query: `SELECT * FROM test_table WHERE amount BETWEEN ${minAmount} AND ${maxAmount} ORDER BY amount`,
          type: 'select_range'
        };
      },
      // SELECT with aggregation
      () => {
        return {
          query: `SELECT status, COUNT(*) as count, AVG(amount) as avg_amount FROM test_table GROUP BY status`,
          type: 'select_aggregate'
        };
      },
      // SELECT with pagination
      () => {
        const offset = Math.floor(Math.random() * 9000);
        return {
          query: `SELECT * FROM test_table ORDER BY id LIMIT 100 OFFSET ${offset}`,
          type: 'select_pagination'
        };
      },
      // Complex SELECT with multiple conditions
      () => {
        const randomName = `User${Math.floor(Math.random() * 5000)}`;
        return {
          query: `SELECT * FROM test_table WHERE name LIKE '${randomName}%' AND status = 'active' AND amount > 100 ORDER BY created_at DESC LIMIT 50`,
          type: 'select_complex'
        };
      }
    ];

    const randomQuery = queries[Math.floor(Math.random() * queries.length)]();
    const result = await this.db.execute(randomQuery.query);
    return { ...result, queryType: randomQuery.type };
  }

  getName() {
    return 'SelectHeavy';
  }

  getDescription() {
    return 'High-query SELECT workload with filtering, aggregation, and pagination';
  }
}

module.exports = SelectHeavyWorkload;
