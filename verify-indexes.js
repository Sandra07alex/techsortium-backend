import { MongoClient } from 'mongodb';
import 'dotenv/config';

async function verifyIndexes() {
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

    // List all existing indexes
    console.log('\n📋 Current indexes on registrations collection:');
    const indexes = await registrationsCollection.listIndexes().toArray();
    indexes.forEach((idx, i) => {
      console.log(`${i}. ${idx.name}`);
      console.log(`   Key: ${JSON.stringify(idx.key)}`);
      if (idx.unique) console.log(`   Unique: true`);
      if (idx.sparse) console.log(`   Sparse: true`);
      if (idx.partialFilterExpression) {
        console.log(`   Partial: ${JSON.stringify(idx.partialFilterExpression)}`);
      }
    });

    // Find any problematic indexes
    const emailEventIndex = indexes.find(idx => 
      idx.key.email === 1 && idx.key.eventSlug === 1
    );

    if (emailEventIndex && emailEventIndex.unique) {
      console.log('\n✅ Compound unique index on (email, eventSlug) exists and is correct');
    } else {
      console.log('\n⚠️  Compound unique index on (email, eventSlug) is missing or not unique');
      console.log('🔧 Recreating proper indexes...');
      
      // Drop old problematic indexes if any
      try {
        await registrationsCollection.dropIndex('email_1_eventSlug_1');
        console.log('Dropped old email_1_eventSlug_1 index');
      } catch (e) {
        // Index might not exist
      }

      try {
        await registrationsCollection.dropIndex('email_1');
        console.log('Dropped old email_1 index');
      } catch (e) {
        // Index might not exist
      }

      // Create correct indexes
      await registrationsCollection.createIndex({ email: 1, eventSlug: 1 }, { unique: true });
      console.log('✅ Created correct compound unique index on (email, eventSlug)');

      await registrationsCollection.createIndex({ email: 1 });
      console.log('✅ Created regular index on email (for queries)');

      await registrationsCollection.createIndex({ eventSlug: 1 });
      console.log('✅ Created index on eventSlug');

      await registrationsCollection.createIndex({ registrationId: 1 }, { unique: true });
      console.log('✅ Created unique index on registrationId');
    }

    console.log('\n✅ Index verification completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

verifyIndexes();
