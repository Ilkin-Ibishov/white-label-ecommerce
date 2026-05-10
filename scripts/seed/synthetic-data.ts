#!/usr/bin/env ts-node
/**
 * Seed script for white-label e-commerce database.
 * Generates realistic product data matching the LIVE schema.
 * Uses name_en/name_az/name_ru, price (numeric AZN), boolean flags,
 * stock_available/stock_sold — NOT the old title/price_cents/inventory_count columns.
 *
 * Usage: npx ts-node scripts/seed/run.ts
 */

import { faker } from '@faker-js/faker';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
  process.exit(1);
}

const CONFIG = {
  categories: 20,
  products: 2000,
  priceRange: { min: 9.99, max: 2999.99 },
  stockRange: { min: 0, max: 500 },
};

const CATEGORY_NAMES = [
  'Smartphones', 'Laptops', 'Tablets', 'Headphones', 'Cameras',
  'Smart Watches', 'Speakers', 'Monitors', 'Keyboards', 'Mice',
  'Routers', 'Printers', 'Cables', 'Chargers', 'Cases',
  'Memory Cards', 'SSDs', 'Power Banks', 'Drones', 'VR Headsets',
];

const CATEGORY_ICONS = [
  'smartphone', 'laptop', 'tablet', 'headphones', 'camera',
  'watch', 'speaker', 'monitor', 'keyboard', 'mouse',
  'wifi', 'printer', 'cable', 'battery-charging', 'shield',
  'sd', 'hard-drive', 'zap', 'plane', 'glasses',
];

function translateToAz(en: string): string {
  // Simple transliteration marker — real i18n would use proper translations
  return en;
}

function translateToRu(en: string): string {
  return en;
}

function generateCategories() {
  return CATEGORY_NAMES.map((name, i) => ({
    id: faker.string.uuid(),
    name_en: name,
    name_az: translateToAz(name),
    name_ru: translateToRu(name),
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    icon: CATEGORY_ICONS[i],
    parent_id: null,
    sort_order: i,
  }));
}

function generateProduct(categoryId: string) {
  const name = faker.commerce.productName();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + faker.string.alphanumeric(6);
  const price = parseFloat(faker.commerce.price({ min: CONFIG.priceRange.min, max: CONFIG.priceRange.max, dec: 2 }));
  const hasDiscount = faker.datatype.boolean({ probability: 0.3 });
  const originalPrice = hasDiscount ? parseFloat((price * (1 + faker.number.float({ min: 0.1, max: 0.5 }))).toFixed(2)) : null;
  const discountPercent = hasDiscount ? Math.round(((originalPrice! - price) / originalPrice!) * 100) : 0;
  const stockAvailable = faker.number.int({ min: CONFIG.stockRange.min, max: CONFIG.stockRange.max });

  return {
    id: faker.string.uuid(),
    name_en: name,
    name_az: translateToAz(name),
    name_ru: translateToRu(name),
    category_id: categoryId,
    price,
    original_price: originalPrice,
    discount_percent: discountPercent,
    rating: faker.number.float({ min: 0, max: 5, fractionDigits: 1 }),
    review_count: faker.number.int({ min: 0, max: 500 }),
    image_url: `https://images.pexels.com/photos/${faker.number.int({ min: 1000000, max: 9999999 })}/pexels-photo-${faker.number.int({ min: 1000000, max: 9999999 })}.jpeg`,
    image_gallery: [] as string[],
    is_featured: faker.datatype.boolean({ probability: 0.1 }),
    is_top_rated: faker.datatype.boolean({ probability: 0.05 }),
    is_on_sale: hasDiscount,
    is_deal_of_day: faker.datatype.boolean({ probability: 0.02 }),
    stock_available: stockAvailable,
    stock_sold: faker.number.int({ min: 0, max: Math.max(1, stockAvailable) }),
    description_en: faker.commerce.productDescription(),
    description_az: '',
    description_ru: '',
    store_id: null,
    slug,
  };
}

async function seedDatabase() {
  console.log('Seeding database...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Clear existing data (idempotent)
  console.log('Clearing existing data...');
  await supabase.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Insert categories
  console.log(`Generating ${CONFIG.categories} categories...`);
  const categories = generateCategories();
  const { error: catError } = await supabase.from('categories').insert(categories);
  if (catError) throw catError;
  console.log(`  Inserted ${categories.length} categories`);

  // Insert products
  console.log(`Generating ${CONFIG.products} products...`);
  const products: any[] = [];
  for (let i = 0; i < CONFIG.products; i++) {
    const cat = categories[i % categories.length];
    products.push(generateProduct(cat.id));
  }

  const batchSize = 500;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const { error } = await supabase.from('products').insert(batch);
    if (error) throw error;
    console.log(`  Inserted ${Math.min(i + batchSize, products.length)}/${products.length}`);
  }

  console.log(`\nDone. ${categories.length} categories, ${products.length} products.`);
}

if (require.main === module) {
  seedDatabase()
    .then(() => { console.log('\nSeeding completed!'); process.exit(0); })
    .catch((error) => { console.error('\nSeeding failed:', error); process.exit(1); });
}

export { seedDatabase, generateCategories, generateProduct };
