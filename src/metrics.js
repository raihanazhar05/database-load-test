class MetricsCollector {
  constructor() {
    this.results = [];
    this.errors = [];
    this.startTime = null;
    this.endTime = null;
  }

  start() {
    this.startTime = Date.now();
  }

  stop() {
    this.endTime = Date.now();
  }

  record(duration, success, error = null, queryType = 'unknown') {
    this.results.push({
      timestamp: Date.now(),
      duration,
      success,
      queryType
    });
    
    if (!success && error) {
      this.errors.push({
        timestamp: Date.now(),
        message: error.message || error,
        queryType
      });
    }
  }

  getSummary() {
    const total = this.results.length;
    const successful = this.results.filter(r => r.success).length;
    const failed = total - successful;
    const durations = this.results.filter(r => r.success).map(r => r.duration);
    
    if (durations.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        qps: 0,
        avgLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        duration: this.endTime - this.startTime
      };
    }

    durations.sort((a, b) => a - b);
    const totalDuration = this.endTime - this.startTime;
    
    return {
      total,
      successful,
      failed,
      qps: (successful / (totalDuration / 1000)).toFixed(2),
      avgLatency: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2),
      minLatency: durations[0].toFixed(2),
      maxLatency: durations[durations.length - 1].toFixed(2),
      p50: this.percentile(durations, 0.5).toFixed(2),
      p95: this.percentile(durations, 0.95).toFixed(2),
      p99: this.percentile(durations, 0.99).toFixed(2),
      duration: totalDuration
    };
  }

  percentile(sortedArray, p) {
    const index = Math.ceil(sortedArray.length * p) - 1;
    return sortedArray[Math.max(0, index)];
  }

  getTimeSeries(intervalMs = 1000) {
    if (!this.startTime || this.results.length === 0) return [];
    
    const series = [];
    let currentBucket = this.startTime;
    let bucketCount = 0;
    let bucketLatency = [];
    
    for (const result of this.results) {
      if (result.timestamp >= currentBucket + intervalMs) {
        series.push({
          timestamp: currentBucket,
          qps: bucketCount,
          avgLatency: bucketLatency.length > 0 
            ? bucketLatency.reduce((a, b) => a + b, 0) / bucketLatency.length 
            : 0
        });
        currentBucket += intervalMs;
        bucketCount = 0;
        bucketLatency = [];
      }
      
      if (result.success) {
        bucketCount++;
        bucketLatency.push(result.duration);
      }
    }
    
    if (bucketCount > 0) {
      series.push({
        timestamp: currentBucket,
        qps: bucketCount,
        avgLatency: bucketLatency.length > 0 
          ? bucketLatency.reduce((a, b) => a + b, 0) / bucketLatency.length 
          : 0
      });
    }
    
    return series;
  }
}

module.exports = MetricsCollector;
