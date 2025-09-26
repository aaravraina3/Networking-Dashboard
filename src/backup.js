#!/usr/bin/env node

import NetworkingSync from './networking-sync.js';
import fs from 'fs';
import chalk from 'chalk';

/**
 * Backup script - saves current networking dashboard data to a CSV file
 */

async function backup() {
  try {
    console.log(chalk.cyan.bold('💾 Creating backup of networking dashboard...\n'));
    
    const sync = new NetworkingSync();
    
    // Initialize authentication
    if (!(await sync.initializeAuth())) {
      throw new Error('Authentication failed');
    }
    
    // Get current data
    const currentData = await sync.getCurrentNetworkingData();
    
    if (currentData.length === 0) {
      console.log(chalk.yellow('⚠️  No data found to backup'));
      return;
    }
    
    // Create CSV content
    const headers = Object.keys(currentData[0]).join(',');
    const rows = currentData.map(person => 
      Object.values(person).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    
    // Save to file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `networking-dashboard-backup-${timestamp}.csv`;
    
    fs.writeFileSync(filename, csvContent);
    
    console.log(chalk.green(`✅ Backup created: ${filename}`));
    console.log(chalk.green(`📊 Backed up ${currentData.length} entries`));
    console.log(chalk.cyan('\n💡 To restore from this backup, you can:'));
    console.log(chalk.white('   1. Import this CSV back into Google Sheets'));
    console.log(chalk.white('   2. Or use Google Sheets version history'));
    
  } catch (error) {
    console.error(chalk.red('❌ Backup failed:'), error.message);
    process.exit(1);
  }
}

backup();
