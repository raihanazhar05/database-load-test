const fs = require('fs');
const path = require('path');

class ReportGenerator {
  constructor(outputDir = './reports') {
    this.outputDir = outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  generateAll(results, options = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = `Report_${timestamp}`;
    
    const generated = [];
    
    if (options.formats.includes('json')) {
      const jsonPath = this.generateJson(results, baseName);
      generated.push({ format: 'JSON', path: jsonPath });
    }
    
    if (options.formats.includes('csv')) {
      const csvPath = this.generateCsv(results, baseName);
      generated.push({ format: 'CSV', path: csvPath });
    }
    
    if (options.formats.includes('html')) {
      const htmlPath = this.generateHtml(results, baseName);
      generated.push({ format: 'HTML', path: htmlPath });
    }
    
    return generated;
  }

  generateJson(results, baseName) {
    const filePath = path.join(this.outputDir, `${baseName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
    return filePath;
  }

  generateCsv(results, baseName) {
    const filePath = path.join(this.outputDir, `${baseName}.csv`);
    const rows = [];
    
    // Header
    rows.push('Database,Workload,Concurrency,TotalQueries,Successful,Failed,QPS,AvgLatency,MinLatency,MaxLatency,P50,P95,P99,DurationMs');
    
    // Data rows
    for (const result of results) {
      const s = result.summary;
      rows.push([
        result.database,
        result.workload,
        result.concurrency,
        s.total,
        s.successful,
        s.failed,
        s.qps,
        s.avgLatency,
        s.minLatency,
        s.maxLatency,
        s.p50,
        s.p95,
        s.p99,
        s.duration
      ].join(','));
    }
    
    fs.writeFileSync(filePath, rows.join('\n'));
    return filePath;
  }

  generateHtml(results, baseName) {
    const filePath = path.join(this.outputDir, `${baseName}.html`);
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Load Test Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; color: #333; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 1.1em; }
        .card { background: white; border-radius: 12px; padding: 30px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .card h2 { color: #667eea; margin-bottom: 20px; font-size: 1.5em; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-card .value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .stat-card .label { opacity: 0.9; font-size: 0.9em; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f8f9fa; font-weight: 600; color: #667eea; }
        tr:hover { background: #f8f9fa; }
        .winner { color: #28a745; font-weight: bold; }
        .loser { color: #dc3545; }
        .chart-container { position: relative; height: 400px; margin: 30px 0; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 0.85em; font-weight: 600; }
        .badge-pg { background: #336791; color: white; }
        .badge-mssql { background: #a91d22; color: white; }
        .comparison-section { margin-top: 40px; }
        .db-header { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗄️ Database Load Test Report</h1>
            <p>PostgreSQL vs SQL Server Benchmark • Generated on ${new Date().toLocaleString()}</p>
        </div>

        ${results.map((result, index) => this.generateResultCard(result, index)).join('')}

        <div class="card">
            <h2>📊 Comparison Charts</h2>
            <div class="chart-container">
                <canvas id="qpsChart"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="latencyChart"></canvas>
            </div>
        </div>
    </div>

    <script>
        const results = ${JSON.stringify(results)};
        
        // QPS Comparison Chart
        const qpsCtx = document.getElementById('qpsChart').getContext('2d');
        new Chart(qpsCtx, {
            type: 'bar',
            data: {
                labels: results.map(r => r.concurrency + ' concurrent'),
                datasets: [{
                    label: 'Queries Per Second (QPS)',
                    data: results.map(r => parseFloat(r.summary.qps)),
                    backgroundColor: results.map(r => r.database === 'PostgreSQL' ? '#336791' : '#a91d22'),
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Queries Per Second by Concurrency Level', font: { size: 16 } }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'QPS' } }
                }
            }
        });

        // Latency Comparison Chart
        const latencyCtx = document.getElementById('latencyChart').getContext('2d');
        new Chart(latencyCtx, {
            type: 'line',
            data: {
                labels: results.map(r => r.concurrency + ' concurrent'),
                datasets: [
                    {
                        label: 'P50 Latency',
                        data: results.map(r => parseFloat(r.summary.p50)),
                        borderColor: '#28a745',
                        backgroundColor: '#28a74520',
                        fill: false
                    },
                    {
                        label: 'P95 Latency',
                        data: results.map(r => parseFloat(r.summary.p95)),
                        borderColor: '#ffc107',
                        backgroundColor: '#ffc10720',
                        fill: false
                    },
                    {
                        label: 'P99 Latency',
                        data: results.map(r => parseFloat(r.summary.p99)),
                        borderColor: '#dc3545',
                        backgroundColor: '#dc354520',
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Latency Percentiles (ms)', font: { size: 16 } }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Latency (ms)' } }
                }
            }
        });
    </script>
</body>
</html>`;

    fs.writeFileSync(filePath, html);
    return filePath;
  }

  generateResultCard(result, index) {
    const s = result.summary;
    const badgeClass = result.database === 'PostgreSQL' ? 'badge-pg' : 'badge-mssql';
    const dbEmoji = result.database === 'PostgreSQL' ? '🐘' : '🎯';
    
    return `
        <div class="card">
            <div class="db-header">
                <span style="font-size: 2em;">${dbEmoji}</span>
                <h2>${result.database} <span class="badge ${badgeClass}">${result.workload}</span></h2>
            </div>
            <p style="color: #666; margin-bottom: 20px;">${result.description} • ${result.concurrency} concurrent connections</p>
            
            <div class="summary-grid">
                <div class="stat-card">
                    <div class="value">${s.qps}</div>
                    <div class="label">QPS</div>
                </div>
                <div class="stat-card">
                    <div class="value">${s.total.toLocaleString()}</div>
                    <div class="label">Total Queries</div>
                </div>
                <div class="stat-card">
                    <div class="value">${s.avgLatency}ms</div>
                    <div class="label">Avg Latency</div>
                </div>
                <div class="stat-card">
                    <div class="value">${s.p95}ms</div>
                    <div class="label">P95 Latency</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Successful Queries</td><td>${s.successful.toLocaleString()}</td></tr>
                    <tr><td>Failed Queries</td><td class="${s.failed > 0 ? 'loser' : ''}">${s.failed.toLocaleString()}</td></tr>
                    <tr><td>Min Latency</td><td>${s.minLatency}ms</td></tr>
                    <tr><td>Max Latency</td><td>${s.maxLatency}ms</td></tr>
                    <tr><td>P50 Latency</td><td>${s.p50}ms</td></tr>
                    <tr><td>P99 Latency</td><td>${s.p99}ms</td></tr>
                    <tr><td>Test Duration</td><td>${(s.duration / 1000).toFixed(1)}s</td></tr>
                </tbody>
            </table>
        </div>
    `;
  }
}

module.exports = ReportGenerator;
