#!/usr/bin/env ts-node
/**
 * Seed runner for white-label e-commerce database.
 * Usage: npx ts-node scripts/seed/run.ts
 */

import { seedDatabase } from './synthetic-data';

seedDatabase()
  .then(() => {
    console.log('\nNext steps:');
    console.log('  1. Verify data in Supabase dashboard');
    console.log('  2. Test: GET /api/categories, GET /api/products');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nSeeding failed:', error);
    process.exit(1);
  });
