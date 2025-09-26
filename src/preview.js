#!/usr/bin/env node

import NetworkingSync from './networking-sync.js';

/**
 * Preview script - shows what the sync would do without making changes
 */

async function main() {
  const sync = new NetworkingSync();
  const result = await sync.preview();
  
  if (result.success) {
    console.log('\n✅ Preview completed successfully!');
    console.log('\n💡 To execute the actual sync, run: npm run sync');
    process.exit(0);
  } else {
    console.log('\n💥 Preview failed:', result.message);
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
