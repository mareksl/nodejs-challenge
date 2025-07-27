import { Db, MongoClient } from 'mongodb'
import { MONGO_URI } from '../config/env-vars'
import { UploadEntry } from '../schema/upload'
import { IconikCollection } from '../schema/iconik-collection'

console.log('🔌 Attempting to connect to MongoDB...')
console.log(`📍 MongoDB URI: ${MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`) // Hide credentials in logs

let mongoDb: MongoClient, db: Db

try {
  console.log('⏳ Connecting to MongoDB...')
  mongoDb = await MongoClient.connect(MONGO_URI)
  console.log('✅ Successfully connected to MongoDB')

  db = mongoDb.db('base-nodejs-test')
  console.log('📂 Connected to database: base-nodejs-test')
} catch (error) {
  console.error('❌ Failed to connect to MongoDB:', error.message)
  console.error('🔍 Full error details:', error)
  process.exit(1) // Exit the process if we can't connect to the database
}

// Add connection event listeners for ongoing monitoring
mongoDb.on('close', () => {
  console.log('⚠️  MongoDB connection closed')
})

mongoDb.on('error', (error) => {
  console.error('💥 MongoDB connection error:', error)
})

export { mongoDb, db }

export const iconikCollections = db.collection<IconikCollection>('iconik_collections')
export const uploads = db.collection<UploadEntry>('uploads')

console.log('🗄️  Collections initialized: iconik_collections, uploads')
