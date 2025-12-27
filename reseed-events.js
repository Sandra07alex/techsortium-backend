import { MongoClient } from 'mongodb';
import 'dotenv/config';

async function reseedEvents() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('techsortium');
    const collection = db.collection('events');
    
    // Import events from seed (named export preferred)
    const mod = await import('./seed-events.js');
    const events = mod.events ?? mod.default;

    const args = process.argv.slice(2);
    const forceDelete = args.includes('--force-delete');
    const prune = args.includes('--prune'); // optional: remove docs not in seed when forced

    if (!Array.isArray(events)) {
      throw new Error('Seed file did not export an events array');
    }

    if (forceDelete) {
      console.warn('⚠️  FORCE DELETE enabled: removing all existing events before insert');
      const deleteResult = await collection.deleteMany({});
      console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing events`);
      const insertResult = await collection.insertMany(events);
      console.log(`✅ Inserted ${insertResult.insertedCount} new events`);
    } else {
      console.log('🛡️  Safe mode: upserting seed events without deleting existing documents');
      let upserts = 0;
      for (const ev of events) {
        const res = await collection.updateOne(
          { slug: ev.slug },
          { $set: ev },
          { upsert: true }
        );
        if (res.upsertedCount || res.modifiedCount) {
          upserts += 1;
          console.log(`   ↪ Upserted: ${ev.title} (${ev.slug})`);
        } else {
          console.log(`   ✔ Exists: ${ev.title} (${ev.slug})`);
        }
      }
      console.log(`✅ Safe sync complete. Upserted/updated: ${upserts}`);

      if (prune) {
        const seedSlugs = new Set(events.map(e => e.slug));
        const removeResult = await collection.deleteMany({ slug: { $nin: [...seedSlugs] } });
        console.log(`🧹 Pruned ${removeResult.deletedCount} non-seed events`);
      }
    }
    
    // Verify
    const count = await collection.countDocuments();
    console.log(`📊 Total events in database: ${count}`);
    
    // List events
    console.log('\n📋 Events:');
    const allEvents = await collection.find({}).project({ title: 1, slug: 1 }).toArray();
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
