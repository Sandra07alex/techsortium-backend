import { MongoClient } from 'mongodb';
import 'dotenv/config';

async function testConnection() {
  const connectionString = process.env.MONGODB_URI;
  
  if (!connectionString) {
    console.error('❌ MONGODB_URI environment variable is not set');
    console.log('💡 Create a .env file with: MONGODB_URI=your_connection_string');
    process.exit(1);
  }

  console.log('🔌 Testing MongoDB connection...');
  console.log('Connection string:', connectionString.replace(/:[^:@]+@/, ':****@')); // Mask password

  const client = new MongoClient(connectionString, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
  });

  try {
    console.log('\n1. Attempting to connect...');
    await client.connect();
    console.log('   ✅ Connection established');

    console.log('\n2. Testing ping...');
    await client.db('admin').command({ ping: 1 });
    console.log('   ✅ Ping successful');

    console.log('\n3. Listing databases...');
    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();
    console.log('   ✅ Available databases:');
    databases.forEach(db => {
      console.log(`      - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });

    console.log('\n4. Testing techsortium database...');
    const db = client.db('techsortium');
    const collections = await db.listCollections().toArray();
    console.log(`   ✅ Database 'techsortium' exists`);
    console.log(`   ✅ Collections found: ${collections.length}`);
    collections.forEach(col => {
      console.log(`      - ${col.name}`);
    });

    if (collections.length === 0) {
      console.log('\n⚠️  No collections found. Run "npm run seed" to create events.');
    }

    console.log('\n✅ All tests passed! MongoDB connection is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Connection test failed!');
    console.error('\nError:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.error('\n💡 SSL/TLS Error - Try these fixes:');
      console.error('   1. Ensure connection string includes: ?retryWrites=true&w=majority');
      console.error('   2. Update Node.js to version 18+');
      console.error('   3. Test connection string in MongoDB Compass');
      console.error('   4. Check MongoDB Atlas Network Access (IP whitelist)');
    } else if (error.message.includes('authentication')) {
      console.error('\n💡 Authentication Error - Check:');
      console.error('   1. Username and password in connection string');
      console.error('   2. Database user exists in MongoDB Atlas');
      console.error('   3. Password special characters are URL encoded');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 Network Error - Check:');
      console.error('   1. Internet connection');
      console.error('   2. MongoDB Atlas cluster is running (not paused)');
      console.error('   3. Firewall/antivirus settings');
    }
    
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Connection closed.');
  }
}

testConnection();

