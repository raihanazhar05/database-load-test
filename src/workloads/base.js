class BaseWorkload {
  constructor(dbTarget, seedData = null) {
    this.db = dbTarget;
    this.seedData = seedData;
  }

  async prepare() {
    // Override in subclasses to prepare data
  }

  async execute() {
    throw new Error('execute() must be implemented by subclass');
  }

  getName() {
    return 'base';
  }

  getDescription() {
    return 'Base workload';
  }
}

module.exports = BaseWorkload;
