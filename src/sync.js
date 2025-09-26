#!/usr/bin/env node

import NetworkingSync from './networking-sync.js';

/**
 * Main sync script - executes the full synchronization
 */

async function main() {
  const sync = new NetworkingSync();
  const result = await sync.sync();
  
  if (result.success) {
    console.log('\n🎉 Sync completed successfully!');
    process.exit(0);
  } else {
    console.log('\n💥 Sync failed:', result.message);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main();
