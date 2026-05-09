#!/usr/bin/env ts-node
/**
 * Beta Agent - Task B3: Synthetic Data Generation
 * Sprint 1.1 | Generates 10k products with 50 categories
 * Uses @faker-js/faker for realistic data
 */

import { faker } from '@faker-js/faker';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Configuration
const CONFIG = {
  categories: {
    count: 50,
    hierarchyDepth: 3, // 0 = root, 1, 2
  },
  products: {
    count: 10000,
    imagesPerProduct: { min: 1, max: 5 },
  },
  priceRange: {
    min: 999,    // $9.99
    max: 99999,  // $999.99
  },
  inventory: {
    min: 0,
    max: 1000,
  },
};

// Category structure templates (electronics hierarchy example)
interface CategoryTemplate {
  name: string;
  children?: CategoryTemplate[];
}

const CATEGORY_TEMPLATES: CategoryTemplate[] = [
  { name: 'Electronics', children: [
    { name: 'Phones', children: [
      { name: 'Smartphones' },
      { name: 'Accessories' },
    ]},
    { name: 'Computers', children: [
      { name: 'Laptops' },
      { name: 'Desktops' },
      { name: 'Accessories' },
    ]},
  ]},
  { name: 'Fashion', children: [
    { name: 'Men', children: [
      { name: 'Clothing' },
      { name: 'Shoes' },
    ]},
    { name: 'Women', children: [
      { name: 'Clothing' },
      { name: 'Shoes' },
    ]},
  ]},
  { name: 'Home', children: [
    { name: 'Furniture' },
    { name: 'Decor' },
    { name: 'Kitchen' },
  ]},
  { name: 'Sports', children: [
    { name: 'Equipment' },
    { name: 'Clothing' },
  ]},
  { name: 'Books', children: [
    { name: 'Fiction' },
    { name: 'Non-fiction' },
    { name: 'Educational' },
  ]},
];

// Generate categories recursively
function generateCategories(
  templates: CategoryTemplate[],
  parentId: string | null = null,
  depth: number = 0,
  result: any[] = []
): any[] {
  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const category = {
      id: faker.string.uuid(),
      slug: faker.helpers.slugify(template.name).toLowerCase() + '-' + faker.string.alphanumeric(4),
      name: template.name,
      description: faker.commerce.productDescription(),
      parent_id: parentId,
      sort_order: i,
      is_active: true,
    };
    
    result.push(category);
    
    // Recursively add children
    if (template.children && depth < CONFIG.categories.hierarchyDepth) {
      generateCategories(template.children, category.id, depth + 1, result);
    }
  }
  
  return result;
}

// Generate product for a category
function generateProduct(categoryId: string, categorySlug: string) {
  const title = faker.commerce.productName();
  const slug = faker.helpers.slugify(title).toLowerCase() + '-' + faker.string.alphanumeric(6);
  
  return {
    id: faker.string.uuid(),
    store_id: null, // Single tenant for now
    slug,
    title,
    description: faker.commerce.productDescription(),
    short_description: faker.lorem.sentence(),
    price_cents: faker.number.int({ min: CONFIG.priceRange.min, max: CONFIG.priceRange.max }),
    compare_at_price_cents: null, // Optional sale price
    inventory_count: faker.number.int({ min: CONFIG.inventory.min, max: CONFIG.inventory.max }),
    inventory_track: true,
    category_id: categoryId,
    status: faker.helpers.arrayElement(['active', 'active', 'active', 'draft']), // 75% active
    seo_title: title,
    seo_description: faker.lorem.sentence(),
    weight_grams: faker.number.int({ min: 100, max: 50000 }),
    is_featured: faker.datatype.boolean(),
  };
}

// Generate images for a product
function generateImages(productId: string, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: faker.string.uuid(),
    product_id: productId,
    url: `https://picsum.photos/400/400?random=${faker.number.int({ min: 1, max: 10000 })}`,
    alt_text: faker.commerce.productAdjective() + ' product image',
    sort_order: i,
    is_primary: i === 0, // First image is primary
  }));
}

// Main seeding function
async function seedDatabase() {
  console.log('🌱 Starting synthetic data generation...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Clear existing data (idempotent - safe to run multiple times)
  console.log('🧹 Clearing existing data...');
  await supabase.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  // Generate categories
  console.log(`📁 Generating ${CONFIG.categories.count} categories...`);
  const categories = generateCategories(CATEGORY_TEMPLATES);
  
  // Ensure we have exactly 50 categories
  while (categories.length < CONFIG.categories.count) {
    const parentCategory = faker.helpers.arrayElement(categories.filter(c => !c.parent_id));
    categories.push({
      id: faker.string.uuid(),
      slug: faker.helpers.slugify(faker.commerce.department()).toLowerCase() + '-' + faker.string.alphanumeric(4),
      name: faker.commerce.department(),
      description: faker.commerce.productDescription(),
      parent_id: parentCategory?.id || null,
      sort_order: categories.length,
      is_active: true,
    });
  }
  
  // Insert categories in batches (respect hierarchy - parents first)
  const rootCategories = categories.filter(c => !c.parent_id);
  const childCategories = categories.filter(c => c.parent_id);
  
  console.log(`  Inserting ${rootCategories.length} root categories...`);
  const { error: catError1 } = await supabase.from('categories').insert(rootCategories);
  if (catError1) throw catError1;
  
  console.log(`  Inserting ${childCategories.length} child categories...`);
  const { error: catError2 } = await supabase.from('categories').insert(childCategories);
  if (catError2) throw catError2;
  
  console.log(`  ✅ Categories inserted: ${categories.length}\n`);
  
  // Generate products
  console.log(`📦 Generating ${CONFIG.products.count} products...`);
  const leafCategories = categories.filter(c => !categories.some(child => child.parent_id === c.id));
  
  const products: any[] = [];
  const images: any[] = [];
  
  for (let i = 0; i < CONFIG.products.count; i++) {
    const category = faker.helpers.arrayElement(leafCategories);
    const product = generateProduct(category.id, category.slug);
    products.push(product);
    
    // Generate images for this product
    const imageCount = faker.number.int({ 
      min: CONFIG.products.imagesPerProduct.min, 
      max: CONFIG.products.imagesPerProduct.max 
    });
    images.push(...generateImages(product.id, imageCount));
    
    // Progress indicator every 1000
    if ((i + 1) % 1000 === 0) {
      console.log(`  Generated ${i + 1}/${CONFIG.products.count} products...`);
    }
  }
  
  // Insert products in batches
  const batchSize = 1000;
  console.log(`\n💾 Inserting products in batches of ${batchSize}...`);
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const { error: prodError } = await supabase.from('products').insert(batch);
    if (prodError) {
      console.error(`Error inserting batch ${i}:`, prodError);
      throw prodError;
    }
    console.log(`  Inserted batch ${i + 1}-${Math.min(i + batchSize, products.length)}`);
  }
  
  // Insert images in batches
  console.log(`\n🖼️  Inserting ${images.length} product images...`);
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    const { error: imgError } = await supabase.from('product_images').insert(batch);
    if (imgError) {
      console.error(`Error inserting image batch ${i}:`, imgError);
      throw imgError;
    }
  }
  
  console.log('\n✅ Seeding complete!\n');
  
  // Summary
  console.log('📊 Summary:');
  console.log(`  Categories: ${categories.length}`);
  console.log(`  Products: ${products.length}`);
  console.log(`  Images: ${images.length}`);
  console.log(`  Avg images/product: ${(images.length / products.length).toFixed(1)}`);
  
  // Sample data preview
  console.log('\n🔍 Sample products:');
  const { data: sample } = await supabase
    .from('products')
    .select('title, price_cents, inventory_count, status')
    .limit(3);
  
  sample?.forEach(p => {
    console.log(`  - ${p.title}: $${(p.price_cents / 100).toFixed(2)} (${p.status})`);
  });
}

// Run if executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('\n🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase, generateCategories, generateProduct, generateImages };
