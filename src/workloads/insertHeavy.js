const BaseWorkload = require('./base');

class InsertHeavyWorkload extends BaseWorkload {
  async prepare() {
    // Insert initial 1,000 records for referential integrity
    const batchSize = 1000;
    const values = [];
    
    for (let i = 0; i < batchSize; i++) {
      const dbName = this.db.getName();
      if (dbName === 'PostgreSQL') {
        values.push(`('SeedUser${i}', 'seed${i}@example.com', 'active', ${(Math.random() * 1000).toFixed(2)}, '{}')`);
      } else {
        values.push(`('SeedUser${i}', 'seed${i}@example.com', 'active', ${(Math.random() * 1000).toFixed(2)}, '{}')`);
      }
    }
    
    const query = `INSERT INTO test_table (name, email, status, amount, metadata) VALUES ${values.join(',')}`;
    await this.db.execute(query);
    
    console.log(`✅ ${this.db.getName()}: Seeded initial ${batchSize} records`);
  }

  async execute() {
    const randomId = Math.floor(Math.random() * 1000000);
    const dbName = this.db.getName();
    
    const query = dbName === 'PostgreSQL'
      ? `INSERT INTO test_table (name, email, status, amount, metadata) VALUES ('NewUser${randomId}', 'new${randomId}@example.com', 'active', ${(Math.random() * 1000).toFixed(2)}, '{"created": "now"}')`
      : `INSERT INTO test_table (name, email, status, amount, metadata) VALUES ('NewUser${randomId}', 'new${randomId}@example.com', 'active', ${(Math.random() * 1000).toFixed(2)}, '{"created": "now"}')`;
    
    const result = await this.db.execute(query);
    return { ...result, queryType: 'insert' };
  }

  getName() {
    return 'InsertHeavy';
  }

  getDescription() {
    return 'High INSERT throughput workload';
  }
}

module.exports = InsertHeavyWorkload;
