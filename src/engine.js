const MetricsCollector = require('./metrics');

class WorkloadEngine {
  constructor(dbTarget, workload, options = {}) {
    this.db = dbTarget;
    this.workload = workload;
    this.duration = (options.durationSeconds || 60) * 1000;
    this.warmup = (options.warmupSeconds || 10) * 1000;
    this.concurrency = options.concurrency || 10;
    this.metrics = new MetricsCollector();
    this.running = false;
    this.workers = [];
  }

  async run() {
    console.log(`\n🚀 Starting ${this.workload.getName()} workload on ${this.db.getName()}`);
    console.log(`   Duration: ${this.duration / 1000}s | Warmup: ${this.warmup / 1000}s | Concurrency: ${this.concurrency}`);
    
    // Setup database and prepare workload
    await this.db.setupTestTable();
    await this.workload.prepare();
    
    // Warmup phase
    if (this.warmup > 0) {
      console.log(`\n⏱️  Warmup phase (${this.warmup / 1000}s)...`);
      await this.runPhase(this.warmup, false);
    }
    
    // Test phase
    console.log(`\n🔥 Test phase (${this.duration / 1000}s)...`);
    this.metrics = new MetricsCollector(); // Reset metrics for actual test
    await this.runPhase(this.duration, true);
    
    return this.metrics.getSummary();
  }

  async runPhase(durationMs, collectMetrics) {
    this.running = true;
    const endTime = Date.now() + durationMs;
    
    if (collectMetrics) {
      this.metrics.start();
    }
    
    // Spawn concurrent workers
    const promises = [];
    for (let i = 0; i < this.concurrency; i++) {
      promises.push(this.worker(endTime, collectMetrics));
    }
    
    await Promise.all(promises);
    
    if (collectMetrics) {
      this.metrics.stop();
    }
    
    this.running = false;
  }

  async worker(endTime, collectMetrics) {
    while (Date.now() < endTime && this.running) {
      try {
        const result = await this.workload.execute();
        if (collectMetrics) {
          this.metrics.record(result.duration, result.success, result.error, result.queryType);
        }
      } catch (error) {
        if (collectMetrics) {
          this.metrics.record(0, false, error, 'error');
        }
      }
    }
  }

  getMetrics() {
    return this.metrics;
  }
}

module.exports = WorkloadEngine;
