const fs = require('fs');
const path = require('path');

let config = null;

function loadConfig(configPath = './config.json') {
  if (config) return config;
  
  const fullPath = path.resolve(configPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Config file not found: ${fullPath}`);
  }
  
  config = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  return config;
}

function getConfig() {
  if (!config) {
    return loadConfig();
  }
  return config;
}

module.exports = { loadConfig, getConfig };
