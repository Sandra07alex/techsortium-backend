import { MongoClient } from 'mongodb';
import 'dotenv/config';

async function reseedEvents() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('techsortium');
    const collection = db.collection('events');
    
    // Delete all existing events
    const deleteResult = await collection.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing events`);
    
    // Now import and insert new events
    const { default: events } = await import('./seed-events.js');
    
    const result = await collection.insertMany(events);
    console.log(`✅ Inserted ${result.insertedCount} new events`);
    
    // Verify
    const count = await collection.countDocuments();
    console.log(`📊 Total events in database: ${count}`);
    
    // List inserted events
    console.log('\n📋 Seeded Events:');
    const allEvents = await collection.find({}).toArray();
    allEvents.forEach(event => {
      console.log(`   - ${event.title} (${event.slug})`);
    });
    
  } catch (error) {
    console.error('❌ Error reseeding events:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Reseeding complete!');
  }
}

reseedEvents();
