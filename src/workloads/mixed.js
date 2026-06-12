const BaseWorkload = require('./base');

class MixedWorkload extends BaseWorkload {
  async prepare() {
    // Insert 10,000 seed records for realistic queries
    const batchSize = 1000;
    const totalRecords = 10000;
    const batches = Math.ceil(totalRecords / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const values = [];
      for (let j = 0; j < batchSize; j++) {
        const idx = i * batchSize + j;
        values.push(`('User${idx}', 'user${idx}@example.com', 'active', ${(Math.random() * 1000).toFixed(2)}, '{}')`);
      }
      
      const query = `INSERT INTO test_table (name, email, status, amount, metadata) VALUES ${values.join(',')}`;
      await this.db.execute(query);
    }
    
    console.log(`✅ ${this.db.getName()}: Seeded ${totalRecords} records for mixed workload`);
  }

  async execute() {
    const random = Math.random();
    const randomId = Math.floor(Math.random() * 10000) + 1;
    const dbName = this.db.getName();
    
    // 70% SELECT, 20% INSERT, 10% UPDATE
    if (random < 0.70) {
      // SELECT queries
      const selectQueries = [
        `SELECT * FROM test_table WHERE id = ${randomId}`,
        `SELECT * FROM test_table WHERE name LIKE 'User${Math.floor(Math.random() * 5000)}%'`,
        `SELECT status, COUNT(*) FROM test_table GROUP BY status`,
        `SELECT * FROM test_table ORDER BY id LIMIT 100 OFFSET ${Math.floor(Math.random() * 9000)}`
      ];
      const query = selectQueries[Math.floor(Math.random() * selectQueries.length)];
      const result = await this.db.execute(query);
      return { ...result, queryType: 'select' };
    } else if (random < 0.90) {
      // INSERT queries
      const newId = Math.floor(Math.random() * 1000000);
      const query = `INSERT INTO test_table (name, email, status, amount, metadata) VALUES ('NewUser${newId}', 'new${newId}@example.com', 'active', ${(Math.random() * 1000).toFixed(2)}, '{}')`;
      const result = await this.db.execute(query);
      return { ...result, queryType: 'insert' };
    } else {
      // UPDATE queries
      const newAmount = (Math.random() * 1000).toFixed(2);
      const query = `UPDATE test_table SET amount = ${newAmount}, status = 'updated' WHERE id = ${randomId}`;
      const result = await this.db.execute(query);
      return { ...result, queryType: 'update' };
    }
  }

  getName() {
    return 'Mixed';
  }

  getDescription() {
    return 'Mixed workload: 70% SELECT, 20% INSERT, 10% UPDATE';
  }
}

module.exports = MixedWorkload;
