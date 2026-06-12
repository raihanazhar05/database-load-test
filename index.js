const { loadConfig } = require('./src/config');
const PostgreSqlTarget = require('./src/databases/postgresql');
const SqlServerTarget = require('./src/databases/sqlserver');
const WorkloadEngine = require('./src/engine');
const ReportGenerator = require('./src/reports');
const CLIDisplay = require('./src/cli');
const SelectHeavyWorkload = require('./src/workloads/selectHeavy');
const InsertHeavyWorkload = require('./src/workloads/insertHeavy');
const UpdateHeavyWorkload = require('./src/workloads/updateHeavy');
const MixedWorkload = require('./src/workloads/mixed');
const CustomSqlWorkload = require('./src/workloads/customSql');
const chalk = require('chalk');
const path = require('path');

const WORKLOADS = {
  SelectHeavy: SelectHeavyWorkload,
  InsertHeavy: InsertHeavyWorkload,
  UpdateHeavy: UpdateHeavyWorkload,
  Mixed: MixedWorkload,
  CustomSql: CustomSqlWorkload
};

async function runLoadTest(configPath = './config.json', selectedDb = null) {
  const cli = new CLIDisplay();
  cli.showBanner();

  try {
    const config = loadConfig(configPath);
    cli.showConfig(config);

    const results = [];
    const { testSettings } = config;
    const workloadName = testSettings.workload || 'SelectHeavy';
    const WorkloadClass = WORKLOADS[workloadName];

    if (!WorkloadClass) {
      throw new Error(`Unknown workload: ${workloadName}. Available: ${Object.keys(WORKLOADS).join(', ')}`);
    }

    // Filter databases if --db flag is provided
    const databasesToTest = selectedDb
      ? Object.entries(config.databases).filter(([dbName]) => dbName === selectedDb)
      : Object.entries(config.databases);

    if (databasesToTest.length === 0) {
      cli.showError(`No database configuration found for: ${selectedDb}. Available: ${Object.keys(config.databases).join(', ')}`);
      process.exit(1);
    }

    // Test each database
    for (const [dbName, dbConfig] of databasesToTest) {
      const displayName = dbName === 'postgresql' ? 'PostgreSQL' : 'SQL Server';
      
      cli.startProgress(`Connecting to ${displayName}...`);
      
      let dbTarget;
      try {
        if (dbName === 'postgresql') {
          dbTarget = new PostgreSqlTarget(dbConfig);
        } else if (dbName === 'sqlserver') {
          dbTarget = new SqlServerTarget(dbConfig);
        } else {
          continue;
        }
        
        await dbTarget.connect();
        cli.stopProgress(`Connected to ${displayName}`);
      } catch (error) {
        cli.failProgress(`Failed to connect to ${displayName}: ${error.message}`);
        continue;
      }

      // Run test for each concurrency level
      for (const concurrency of testSettings.concurrencyLevels) {
        let workload;
        if (workloadName === 'CustomSql') {
          const sqlFile = process.argv[3] || './custom-queries.sql';
          workload = new CustomSqlWorkload(dbTarget, sqlFile);
        } else {
          workload = new WorkloadClass(dbTarget);
        }

        const engine = new WorkloadEngine(dbTarget, workload, {
          durationSeconds: testSettings.durationSeconds,
          warmupSeconds: testSettings.warmupSeconds,
          concurrency: concurrency
        });

        try {
          const summary = await engine.run();
          
          results.push({
            database: displayName,
            workload: workloadName,
            description: workload.getDescription(),
            concurrency: concurrency,
            summary: summary,
            timeSeries: engine.getMetrics().getTimeSeries()
          });
        } catch (error) {
          cli.showError(`Test failed for ${displayName} at concurrency ${concurrency}: ${error.message}`);
        }
      }

      try {
        await dbTarget.disconnect();
      } catch (error) {
        cli.showError(`Error disconnecting from ${displayName}: ${error.message}`);
      }
    }

    // Display results
    if (results.length > 0) {
      cli.showResults(results);
      cli.showComparison(results);

      // Generate reports
      cli.startProgress('Generating reports...');
      const reportGen = new ReportGenerator(testSettings.outputDirectory);
      const reports = reportGen.generateAll(results, {
        formats: testSettings.reportFormats || ['html', 'json', 'csv']
      });
      cli.stopProgress('Reports generated');
      cli.showReports(reports);

      console.log(chalk.green.bold('\n🎉 Load test completed successfully!\n'));
    } else {
      cli.showError('No results generated. Please check your database connections and configuration.');
    }

  } catch (error) {
    cli.showError(error.message);
    console.error(error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const configPath = (args[0] && !args[0].startsWith('--')) ? args[0] : './config.json';

// Parse --db flag
let selectedDb = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--db' && args[i + 1]) {
    selectedDb = args[i + 1].toLowerCase();
    break;
  }
}

runLoadTest(configPath, selectedDb);
