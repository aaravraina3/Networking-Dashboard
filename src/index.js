#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import NetworkingSync from './networking-sync.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('generate-networking-sync')
  .description('Generate Club Networking Dashboard Synchronization Tool')
  .version('1.0.0');

/**
 * Interactive sync command
 */
program
  .command('sync')
  .description('Synchronize onboarding form data with networking dashboard')
  .option('-f, --force', 'Skip confirmation prompt')
  .action(async (options) => {
    try {
      console.log(chalk.cyan.bold('🚀 Generate Networking Dashboard Sync\n'));
      
      if (!options.force) {
        const answers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'This will update your networking dashboard. Continue?',
            default: false,
          },
        ]);
        
        if (!answers.confirm) {
          console.log(chalk.yellow('❌ Sync cancelled by user'));
          return;
        }
      }
      
      const sync = new NetworkingSync();
      const result = await sync.sync();
      
      if (result.success) {
        console.log(chalk.green('\n🎉 Sync completed successfully!'));
      } else {
        console.log(chalk.red('\n💥 Sync failed:'), result.message);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('💥 Error:'), error.message);
      process.exit(1);
    }
  });

/**
 * Preview command
 */
program
  .command('preview')
  .description('Preview what the sync would do without making changes')
  .action(async () => {
    try {
      const sync = new NetworkingSync();
      const result = await sync.preview();
      
      if (result.success) {
        console.log(chalk.green('\n✅ Preview completed successfully!'));
        console.log(chalk.cyan('\n💡 To execute the actual sync, run: npm run sync'));
      } else {
        console.log(chalk.red('\n💥 Preview failed:'), result.message);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('💥 Error:'), error.message);
      process.exit(1);
    }
  });

/**
 * Setup command - help with configuration
 */
program
  .command('setup')
  .description('Help with initial setup and configuration')
  .action(async () => {
    console.log(chalk.cyan.bold('\n🔧 Generate Networking Dashboard Sync Setup\n'));
    
    console.log(chalk.yellow('📋 Setup Steps:'));
    console.log(chalk.white('1. Copy env.example to .env'));
    console.log(chalk.white('2. Fill in your Google Sheets API credentials'));
    console.log(chalk.white('3. Add your Google Sheets file IDs'));
    console.log(chalk.white('4. Run npm install to install dependencies'));
    console.log(chalk.white('5. Test with npm run preview'));
    console.log(chalk.white('6. Run npm run sync when ready\n'));
    
    console.log(chalk.cyan('📝 Required Environment Variables:'));
    console.log(chalk.white('   • GOOGLE_PROJECT_ID'));
    console.log(chalk.white('   • GOOGLE_CLIENT_EMAIL'));
    console.log(chalk.white('   • GOOGLE_CLIENT_ID'));
    console.log(chalk.white('   • GOOGLE_PRIVATE_KEY'));
    console.log(chalk.white('   • ONBOARDING_FORM_FILE_ID'));
    console.log(chalk.white('   • NETWORKING_DASHBOARD_FILE_ID\n'));
    
    console.log(chalk.green('🎯 Google Sheets Setup:'));
    console.log(chalk.white('1. Create a service account in Google Cloud Console'));
    console.log(chalk.white('2. Download the JSON key file'));
    console.log(chalk.white('3. Share your Google Sheets with the service account email'));
    console.log(chalk.white('4. Copy the file IDs from your Google Sheets URLs\n'));
  });

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('💥 Uncaught Exception:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('💥 Unhandled Rejection at:'), promise, 'reason:', reason);
  process.exit(1);
});

// Parse command line arguments
program.parse();
