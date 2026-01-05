import 'dotenv/config';
import { MongoClient } from 'mongodb';

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('techsortium');
    const regs = db.collection('registrations');

    const slug = 'skill-development-session';

    const pipeline = [
      { $match: { eventSlug: slug } },
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ];

    const results = await regs.aggregate(pipeline).toArray();

    console.log('\n=== SDS Registrations by Domain ===');
    if (results.length === 0) {
      console.log('No registrations found yet for SDS.');
    } else {
      results.forEach(r => {
        const name = r._id || '[no domain set]';
        console.log(`- ${name}: ${r.count}`);
      });
    }

    // Optional: total registrations for SDS
    const total = await regs.countDocuments({ eventSlug: slug });
    console.log(`\nTotal SDS registrations: ${total}`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
