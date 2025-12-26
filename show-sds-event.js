import 'dotenv/config';
import { MongoClient } from 'mongodb';

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('techsortium');
    const events = db.collection('events');

    const doc = await events.findOne({ slug: 'skill-development-session' });
    if (!doc) {
      console.log('No SDS event found with slug "skill-development-session"');
      return;
    }

    // Print full raw MongoDB document
    console.log('\n=== SDS Event (raw MongoDB document) ===');
    console.log(JSON.stringify(doc, null, 2));

    // Print a concise summary
    const {
      _id, id, title, slug, track, shortDescription, longDescription, posterUrl,
      datetime, capacity, fee, feeDescription, domains, qrPaymentRequired, requirements,
      registeredCount
    } = doc;
    console.log('\n=== Summary ===');
    console.log({ id, title, slug, track, datetime, capacity, registeredCount, fee, feeDescription, domainCount: Array.isArray(domains) ? domains.length : 0, qrPaymentRequired, requirements });
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
