const BaseWorkload = require('./base');
const fs = require('fs');
const path = require('path');

class CustomSqlWorkload extends BaseWorkload {
  constructor(dbTarget, sqlFilePath) {
    super(dbTarget);
    this.sqlFilePath = sqlFilePath;
    this.queries = [];
  }

  async prepare() {
    if (!fs.existsSync(this.sqlFilePath)) {
      throw new Error(`SQL file not found: ${this.sqlFilePath}`);
    }
    
    const content = fs.readFileSync(this.sqlFilePath, 'utf-8');
    // Split by semicolon, filter out empty statements
    this.queries = content
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);
    
    if (this.queries.length === 0) {
      throw new Error('No valid SQL queries found in file');
    }
    
    console.log(`✅ ${this.db.getName()}: Loaded ${this.queries.length} custom queries from ${this.sqlFilePath}`);
  }

  async execute() {
    const query = this.queries[Math.floor(Math.random() * this.queries.length)];
    const result = await this.db.execute(query);
    return { ...result, queryType: 'custom' };
  }

  getName() {
    return 'CustomSql';
  }

  getDescription() {
    return `Custom SQL workload from ${this.sqlFilePath}`;
  }
}

module.exports = CustomSqlWorkload;
