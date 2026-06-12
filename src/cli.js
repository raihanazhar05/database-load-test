const chalk = require('chalk');
const Table = require('cli-table3');
const ora = require('ora');
const boxen = require('boxen');
const figlet = require('figlet');

class CLIDisplay {
  constructor() {
    this.spinner = null;
  }

  showBanner() {
    console.log(chalk.cyan(figlet.textSync('DB Load Test', { font: 'Small' })));
    console.log(chalk.gray('Database Load Testing Tool - PostgreSQL vs SQL Server\n'));
  }

  showConfig(config) {
    const table = new Table({
      head: [chalk.cyan('Setting'), chalk.cyan('Value')],
      colWidths: [25, 50]
    });

    table.push(
      ['Workloads', config.testSettings.workload],
      ['Duration', `${config.testSettings.durationSeconds}s`],
      ['Warmup', `${config.testSettings.warmupSeconds}s`],
      ['Concurrency Levels', config.testSettings.concurrencyLevels.join(', ')],
      ['Report Formats', config.testSettings.reportFormats.join(', ')]
    );

    console.log(chalk.bold.yellow('📋 Test Configuration:'));
    console.log(table.toString());
    console.log();
  }

  startProgress(text) {
    this.spinner = ora(text).start();
  }

  stopProgress(text) {
    if (this.spinner) {
      this.spinner.succeed(text);
      this.spinner = null;
    }
  }

  failProgress(text) {
    if (this.spinner) {
      this.spinner.fail(text);
      this.spinner = null;
    }
  }

  showResults(results) {
    console.log(chalk.bold.green('\n📊 Final Results:\n'));
    
    for (const result of results) {
      const s = result.summary;
      const box = boxen(
        `${chalk.bold(result.database)} ${chalk.gray('(' + result.workload + ')')}\n` +
        `${chalk.gray('Concurrency:')} ${result.concurrency}\n\n` +
        `${chalk.cyan('QPS:')} ${s.qps}\n` +
        `${chalk.cyan('Total:')} ${s.total.toLocaleString()}  ` +
        `${chalk.green('Success:')} ${s.successful.toLocaleString()}  ` +
        `${s.failed > 0 ? chalk.red('Failed:') : chalk.gray('Failed:')} ${s.failed.toLocaleString()}\n\n` +
        `${chalk.yellow('Latency:')} ` +
        `avg ${s.avgLatency}ms  ` +
        `p50 ${s.p50}ms  ` +
        `p95 ${s.p95}ms  ` +
        `p99 ${s.p99}ms`,
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: result.database === 'PostgreSQL' ? 'blue' : 'red'
        }
      );
      
      console.log(box);
    }
  }

  showComparison(results) {
    if (results.length < 2) return;

    console.log(chalk.bold.yellow('\n⚡ Head-to-Head Comparison:\n'));
    
    const pg = results.find(r => r.database === 'PostgreSQL');
    const mssql = results.find(r => r.database === 'SQL Server');
    
    if (!pg || !mssql) return;
    
    const table = new Table({
      head: [chalk.cyan('Metric'), chalk.cyan('PostgreSQL 🐘'), chalk.cyan('SQL Server 🎯'), chalk.cyan('Winner')],
      colWidths: [25, 20, 20, 15]
    });

    const qpsWinner = parseFloat(pg.summary.qps) > parseFloat(mssql.summary.qps) ? 'PostgreSQL' : 'SQL Server';
    const latencyWinner = parseFloat(pg.summary.avgLatency) < parseFloat(mssql.summary.avgLatency) ? 'PostgreSQL' : 'SQL Server';
    
    table.push(
      ['QPS', pg.summary.qps, mssql.summary.qps, qpsWinner === 'PostgreSQL' ? chalk.green('🐘') : chalk.green('🎯')],
      ['Avg Latency', pg.summary.avgLatency + 'ms', mssql.summary.avgLatency + 'ms', latencyWinner === 'PostgreSQL' ? chalk.green('🐘') : chalk.green('🎯')],
      ['P95 Latency', pg.summary.p95 + 'ms', mssql.summary.p95 + 'ms', parseFloat(pg.summary.p95) < parseFloat(mssql.summary.p95) ? chalk.green('🐘') : chalk.green('🎯')],
      ['P99 Latency', pg.summary.p99 + 'ms', mssql.summary.p99 + 'ms', parseFloat(pg.summary.p99) < parseFloat(mssql.summary.p99) ? chalk.green('🐘') : chalk.green('🎯')]
    );

    console.log(table.toString());
    console.log();
  }

  showReports(reports) {
    console.log(chalk.bold.cyan('\n📁 Reports Generated:\n'));
    for (const report of reports) {
      console.log(chalk.green(`✅ ${report.format}:`), chalk.gray(report.path));
    }
    console.log();
  }

  showError(message) {
    console.log(chalk.red(`\n❌ Error: ${message}\n`));
  }

  showInfo(message) {
    console.log(chalk.blue(`ℹ️  ${message}`));
  }

  showSuccess(message) {
    console.log(chalk.green(`✅ ${message}`));
  }
}

module.exports = CLIDisplay;
