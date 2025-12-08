import { MongoClient } from 'mongodb';
import 'dotenv/config';

async function fixIndexes() {
  const connectionString = process.env.MONGODB_URI;
  
  if (!connectionString) {
    console.error('❌ MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  const client = new MongoClient(connectionString);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('techsortium');
    const registrationsCollection = db.collection('registrations');

    // Drop the problematic index
    console.log('🔄 Dropping problematic membershipNumber index...');
    try {
      await registrationsCollection.dropIndex('membershipNumber_1');
      console.log('✅ Dropped membershipNumber_1 index');
    } catch (err) {
      if (err.message.includes('index not found')) {
        console.log('ℹ️  Index doesn\'t exist yet (this is fine)');
      } else {
        throw err;
      }
    }

    // Create the corrected index
    console.log('🔄 Creating corrected membershipNumber index...');
    await registrationsCollection.createIndex(
      { membershipNumber: 1 },
      { unique: true, partialFilterExpression: { membershipNumber: { $exists: true } } }
    );
    console.log('✅ Created corrected membershipNumber index');

    console.log('\n✅ Index fix completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixIndexes();
