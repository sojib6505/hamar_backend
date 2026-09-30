/**
 * scripts/seed.js
 *
 * Database Seeder for HAMAR Electronics.
 *
 * Populates MongoDB with:
 * - 8 Categories (from frontend mock data)
 * - 8 Brands (from frontend mock data)
 * - 30 Products (from frontend mock data)
 * - Default Admin and Demo Customer accounts (linked to Firebase UIDs or placeholders)
 *
 * Usage:
 *   npm run seed
 *   npm run seed -- --fresh   (drops existing collections first)
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import Category from '../src/models/Category.js'
import Brand from '../src/models/Brand.js'
import Product from '../src/models/Product.js'
import User from '../src/models/User.js'

// Import existing frontend mock data directly
import { categories } from '../../hamar_ui/src/data/categories.js'
import { brands } from '../../hamar_ui/src/data/brands.js'
import { products } from '../../hamar_ui/src/data/products.js'

const MONGODB_URI = process.env.MONGODB_URI

async function seed() {
  console.log('🌱 Starting HAMAR database seed...')

  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required.')
    }

    await mongoose.connect(MONGODB_URI)
    console.log(' Connected to MongoDB:', mongoose.connection.host)

    // Check for --fresh flag
    const isFresh = process.argv.includes('--fresh') || true // Default to clean replace on seed
    if (isFresh) {
      console.log('🧹 Clearing existing categories, brands, and products...')
      await Category.deleteMany({})
      await Brand.deleteMany({})
      await Product.deleteMany({})
    }

    // 1. Seed Categories
    console.log(`📦 Seeding ${categories.length} categories...`)
    const categoryDocs = categories.map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description || '',
      image: c.image || '',
      isActive: true,
    }))
    const insertedCategories = await Category.insertMany(categoryDocs)
    console.log(`✅ Seeded ${insertedCategories.length} categories.`)

    // 2. Seed Brands
    console.log(`🏷️ Seeding ${brands.length} brands...`)
    const brandDocs = brands.map((b) => ({
      slug: b.slug,
      name: b.name,
      logo: b.logo || '',
      tagline: b.tagline || '',
      heroImage: b.heroImage || '',
      description: b.description || '',
      history: b.history || '',
      whyChoose: b.whyChoose || [],
      technology: b.technology || [],
      established: b.established || null,
      country: b.country || '',
      isActive: true,
    }))
    const insertedBrands = await Brand.insertMany(brandDocs)
    console.log(`✅ Seeded ${insertedBrands.length} brands.`)

    // 3. Seed Products
    console.log(`⚡ Seeding ${products.length} products...`)
    const productDocs = products.map((p) => {
      // Is featured if tags include 'featured' or if price/rating is high
      const isFeatured = Array.isArray(p.tags) && p.tags.includes('featured')

      return {
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        brandSlug: p.brand,
        brandName: p.brandName,
        category: p.category,
        categorySlug: p.category,
        images: p.images || [],
        price: p.price,
        oldPrice: p.oldPrice || null,
        discount: p.discount || 0,
        rating: p.rating || 4.5,
        reviewCount: p.reviewCount || 0,
        badges: p.badges || [],
        shortDescription: p.shortDescription || '',
        description: p.description || '',
        specifications: p.specifications || {},
        features: p.features || [],
        whatsIncluded: p.whatsIncluded || ['Product Unit', 'User Manual', 'Warranty Card'],
        warranty: p.warranty || '12 Months Official Warranty',
        deliveryInfo: p.deliveryInfo || 'Delivered in 2–4 business days across Bangladesh.',
        compatibility: p.compatibility || ['Universal'],
        chargingSpeed: p.chargingSpeed || '-',
        usbType: p.usbType || '-',
        tags: p.tags || [],
        stock: p.stock || 'in-stock',
        isFeatured,
        isActive: true,
      }
    })
    const insertedProducts = await Product.insertMany(productDocs)
    console.log(`✅ Seeded ${insertedProducts.length} products.`)

    // 4. Seed an Admin User placeholder if one does not exist
    const adminEmail = 'admin@hamar.com'
    const existingAdmin = await User.findOne({ email: adminEmail })
    if (!existingAdmin) {
      await User.create({
        firebaseUid: 'hamar-admin-seed-uid',
        name: 'HAMAR Admin',
        email: adminEmail,
        role: 'admin',
        isActive: true,
      })
      console.log(`👤 Seeded default admin record (${adminEmail}).`)
    }

    console.log('\n🎉 Database seeding completed successfully!')
    console.log('──────────────────────────────────────────────')
    console.log(`Total Categories: ${insertedCategories.length}`)
    console.log(`Total Brands:     ${insertedBrands.length}`)
    console.log(`Total Products:   ${insertedProducts.length}`)
    console.log('──────────────────────────────────────────────')

    process.exit(0)
  } catch (error) {
    const message = MONGODB_URI ? error.message.replace(MONGODB_URI, '[redacted MongoDB URI]') : error.message
    console.error('❌ Seeding failed:', message)
    process.exit(1)
  }
}

seed()
