import { mongoDb, db } from './utils/mongo-client'
import { iconikClient } from './utils/iconik-client'

interface TestResult {
  service: string
  status: 'success' | 'failed'
  message: string
  duration?: number
}

async function testMongoDB(): Promise<TestResult> {
  const startTime = Date.now()

  try {
    console.log('🔌 Testing MongoDB connection...')

    // Test basic database operations using the existing client
    await db.admin().ping()

    const duration = Date.now() - startTime
    console.log(`✅ MongoDB connection successful (${duration}ms)`)

    return {
      service: 'MongoDB',
      status: 'success',
      message: 'Connection established and ping successful',
      duration
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ MongoDB connection failed:', error.message)

    return {
      service: 'MongoDB',
      status: 'failed',
      message: error.message,
      duration
    }
  }
}

async function testIconik(): Promise<TestResult> {
  const startTime = Date.now()

  try {
    console.log('🎬 Testing Iconik API connection...')
    // Test with the existing iconik client - validate auth
    const response = await iconikClient.get('users/v1/users/current');

    const duration = Date.now() - startTime
    console.log(`✅ Iconik API connection successful (${duration}ms)`)
    console.log(`📊 API Response: ${response.status} - ${response.statusText}`)
    console.log(`\nThanks ${response.data.first_name} ${response.data.last_name} for making sure that all connections work!`)
    console.log(`Have fun completing the challenge! 🚀`)

    return {
      service: 'Iconik API',
      status: 'success',
      message: `Auth validated successfully (HTTP ${response.status})`,
      duration
    }
  } catch (error) {
    console.log(error.request)
    const duration = Date.now() - startTime

    if (error.response) {
      console.error(`❌ Iconik API failed: ${error.response.status} - ${error.response.statusText}`)
      console.error(`🔍 Response data:`, error.response.data)

      return {
        service: 'Iconik API',
        status: 'failed',
        message: `HTTP ${error.response.status}: ${error.response.statusText}`,
        duration
      }
    } else if (error.request) {
      console.error('❌ Iconik API failed: No response received')
      console.error('🔍 Network error:', error.message)

      return {
        service: 'Iconik API',
        status: 'failed',
        message: `Network error: ${error.message}`,
        duration
      }
    } else {
      console.error('❌ Iconik API failed:', error.message)

      return {
        service: 'Iconik API',
        status: 'failed',
        message: error.message,
        duration
      }
    }
  }
}

async function runConnectionTests(): Promise<void> {
  console.log('🚀 Starting connection tests...\n')

  const results: TestResult[] = []

  // Run tests
  results.push(await testMongoDB())
  results.push(await testIconik())

  // Summary
  console.log('\n📋 Connection Test Summary:')
  console.log('================================')

  let allPassed = true

  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : '❌'
    const duration = result.duration ? ` (${result.duration}ms)` : ''

    console.log(`${icon} ${result.service}: ${result.message}${duration}`)

    if (result.status === 'failed') {
      allPassed = false
    }
  })

  console.log('================================')

  if (allPassed) {
    console.log('🎉 All connections successful!')
    process.exit(0)
  } else {
    console.log('💥 Some connections failed!')
    process.exit(1)
  }
}

// Run the tests
runConnectionTests().catch(error => {
  console.error('💥 Test runner failed:', error)
  process.exit(1)
})
