const BaseWorkload = require('./base');

class UpdateHeavyWorkload extends BaseWorkload {
  async prepare() {
    // Insert 10,000 seed records for realistic UPDATE queries
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
    
    console.log(`✅ ${this.db.getName()}: Seeded ${totalRecords} records for UPDATE testing`);
  }

  async execute() {
    const randomId = Math.floor(Math.random() * 10000) + 1;
    const newAmount = (Math.random() * 1000).toFixed(2);
    const newStatus = Math.random() > 0.5 ? 'active' : 'inactive';
    
    const queries = [
      // Simple UPDATE by ID
      () => {
        return {
          query: `UPDATE test_table SET amount = ${newAmount}, status = '${newStatus}' WHERE id = ${randomId}`,
          type: 'update_by_id'
        };
      },
      // UPDATE with range condition
      () => {
        const minId = Math.floor(Math.random() * 5000) + 1;
        const maxId = minId + 100;
        return {
          query: `UPDATE test_table SET status = 'inactive' WHERE id BETWEEN ${minId} AND ${maxId}`,
          type: 'update_range'
        };
      },
      // UPDATE with transaction-like logic
      () => {
        const randomName = `User${Math.floor(Math.random() * 5000)}`;
        return {
          query: `UPDATE test_table SET amount = amount + 10, status = 'updated' WHERE name LIKE '${randomName}%' AND status = 'active'`,
          type: 'update_transactional'
        };
      }
    ];

    const randomQuery = queries[Math.floor(Math.random() * queries.length)]();
    const result = await this.db.execute(randomQuery.query);
    return { ...result, queryType: randomQuery.type };
  }

  getName() {
    return 'UpdateHeavy';
  }

  getDescription() {
    return 'High UPDATE workload with single-row and batch updates';
  }
}

module.exports = UpdateHeavyWorkload;
