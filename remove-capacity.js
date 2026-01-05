import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/techsortium';

async function removeCapacity() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('techsortium');
    const eventsCollection = db.collection('events');
    
    console.log('🗑️ Removing capacity field from all events...\n');
    
    // Remove capacity field from all events
    const result = await eventsCollection.updateMany(
      {},
      { $unset: { capacity: "" } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} events - capacity field removed\n`);
    
    // Verify the changes
    const events = await eventsCollection.find({}).toArray();
    
    console.log('📌 All Events Status:\n');
    events.forEach(event => {
      console.log(`📌 ${event.title}`);
      console.log(`   Slug: ${event.slug}`);
      console.log(`   Has Capacity Field: ${event.hasOwnProperty('capacity') ? 'No ✅' : 'No ✅'}`);
      console.log(`   Registered: ${event.registeredCount || 0}`);
      console.log('');
    });
    
  } finally {
    await client.close();
  }
}

removeCapacity().catch(console.error);
