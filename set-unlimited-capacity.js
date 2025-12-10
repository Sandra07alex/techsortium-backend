import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/techsortium';

async function fixCapacities() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('techsortium');
    const eventsCollection = db.collection('events');
    
    console.log('🔧 Setting all event capacities to unlimited (null)...\n');
    
    // Update all events to have null capacity (unlimited)
    const result = await eventsCollection.updateMany(
      {},
      { $set: { capacity: null, registeredCount: 0 } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} events`);
    
    // Verify the changes
    const events = await eventsCollection.find({}).toArray();
    
    console.log('\n📌 All Events Status:\n');
    events.forEach(event => {
      console.log(`📌 ${event.title}`);
      console.log(`   Slug: ${event.slug}`);
      console.log(`   Capacity: ${event.capacity === null ? '∞ (Unlimited)' : event.capacity}`);
      console.log(`   Registered: ${event.registeredCount || 0}`);
      console.log('');
    });
    
  } finally {
    await client.close();
  }
}

fixCapacities().catch(console.error);
