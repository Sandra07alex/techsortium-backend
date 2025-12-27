import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function dumpEvents() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('techsortium');
    const collection = db.collection('events');
    const docs = await collection.find({}).toArray();

    const dir = path.resolve('./backups');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const ts = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .replace('Z', '');
    const file = path.join(dir, `events-${ts}.json`);
    fs.writeFileSync(file, JSON.stringify(docs, null, 2), 'utf8');

    console.log(`💾 Saved ${docs.length} events to ${file}`);
  } catch (err) {
    console.error('❌ Error dumping events:', err);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Dump complete!');
  }
}

dumpEvents();
