import 'dotenv/config';
import { MongoClient } from 'mongodb';

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('techsortium');
  const events = db.collection('events');

  const slug = 'skill-development-session';
  const before = await events.findOne({ slug });
  console.log('Before:', { capacity: before?.capacity, registeredCount: before?.registeredCount });

  const reservation = await events.findOneAndUpdate(
    {
      slug,
      $expr: { $gt: ['$capacity', { $ifNull: ['$registeredCount', 0] }] }
    },
    [
      { $set: { registeredCount: { $add: [{ $ifNull: ['$registeredCount', 0] }, 1] } } }
    ],
    { returnDocument: 'after' }
  );

  console.log('MatchedCount:', reservation.lastErrorObject?.n ?? 'N/A');
  console.log('Updated doc:', reservation.value);

  const after = await events.findOne({ slug });
  console.log('After:', { capacity: after?.capacity, registeredCount: after?.registeredCount });
  await client.close();
}

run().catch(err => { console.error(err); process.exit(1); });
