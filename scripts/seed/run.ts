#!/usr/bin/env ts-node
/**
 * Beta Agent - Task B5: Seed Runner
 * Sprint 1.1 | Idempotent seed script for beta-db branch
 * Usage: npx ts-node scripts/seed/run.ts
 */

import { seedDatabase } from './synthetic-data';

console.log('🚀 Beta Agent - Database Seeding\n');

seedDatabase()
  .then(() => {
    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('  1. Verify data in Supabase dashboard');
    console.log('  2. Test API endpoints:');
    console.log('     - GET /api/categories');
    console.log('     - GET /api/products');
    console.log('     - GET /api/products/[slug]');
    console.log('     - GET /api/categories/[slug]/products');
    console.log('  3. Check query performance (< 200ms)');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });
