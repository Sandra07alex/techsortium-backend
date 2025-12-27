import { MongoClient } from 'mongodb';
import 'dotenv/config';

async function restoreMissing() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('techsortium');
    const collection = db.collection('events');

    const { events } = await import('./seed-events.js');

    let inserted = 0;
    for (const ev of events) {
      const existing = await collection.findOne({ slug: ev.slug });
      if (!existing) {
        await collection.insertOne(ev);
        inserted += 1;
        console.log(`➕ Inserted: ${ev.title} (${ev.slug})`);
      } else {
        console.log(`✔️  Exists: ${ev.title} (${ev.slug})`);
      }
    }

    const count = await collection.countDocuments();
    console.log(`\n📊 Total events in database: ${count} (added ${inserted})`);
  } catch (err) {
    console.error('❌ Error restoring events:', err);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Restore missing events complete!');
  }
}

restoreMissing();
