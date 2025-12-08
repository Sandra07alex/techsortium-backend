import { MongoClient } from 'mongodb';
import 'dotenv/config';

async function dropUniqueIndexes() {
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

    // Drop the unique email+eventSlug index
    console.log('🔄 Dropping unique email+eventSlug index...');
    try {
      await registrationsCollection.dropIndex('email_1_eventSlug_1');
      console.log('✅ Dropped email_1_eventSlug_1 index');
    } catch (err) {
      if (err.message.includes('index not found')) {
        console.log('ℹ️  email_1_eventSlug_1 index doesn\'t exist (this is fine)');
      } else {
        console.error('⚠️  Error dropping email_1_eventSlug_1:', err.message);
      }
    }

    // Drop the unique membershipNumber index
    console.log('🔄 Dropping unique membershipNumber index...');
    try {
      await registrationsCollection.dropIndex('membershipNumber_1');
      console.log('✅ Dropped membershipNumber_1 index');
    } catch (err) {
      if (err.message.includes('index not found')) {
        console.log('ℹ️  membershipNumber_1 index doesn\'t exist (this is fine)');
      } else {
        console.error('⚠️  Error dropping membershipNumber_1:', err.message);
      }
    }

    console.log('\n✅ Unique indexes dropped successfully!');
    console.log('ℹ️  Restart your backend server to create the new non-unique indexes.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

dropUniqueIndexes();
