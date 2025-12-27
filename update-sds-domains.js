import { MongoClient } from 'mongodb';
import 'dotenv/config';

const newDomains = [
  'Cyber Security',
  'Full Stack Web Development',
  'Cloud (AWS)',
  'Data Science and Analytics',
  'Artificial Intelligence and Machine Learning',
  'Generative AI',
];

const newDomainCounts = {
  'cyber-security': 0,
  'full-stack-web': 0,
  'cloud-aws': 0,
  'data-science': 0,
  'ai-ml': 0,
  'generative-ai': 0,
};

async function updateSDSDomains() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('techsortium');
    const eventsCollection = db.collection('events');

    // Update SDS event with new domains
    const result = await eventsCollection.updateOne(
      { slug: 'skill-development-session' },
      {
        $set: {
          domains: newDomains,
          domainCounts: newDomainCounts,
        },
      }
    );

    if (result.matchedCount === 0) {
      console.log('⚠️  SDS event not found in database');
      return;
    }

    console.log('✅ Successfully updated SDS domains in database');
    console.log(`   Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
    console.log('\n📋 New Domains:');
    newDomains.forEach((domain, i) => {
      console.log(`   ${i + 1}. ${domain}`);
    });

    // Verify the update
    const updated = await eventsCollection.findOne({ slug: 'skill-development-session' });
    if (updated) {
      console.log('\n✅ Verification - Updated event:');
      console.log(`   Title: ${updated.title}`);
      console.log(`   Domains: ${updated.domains?.length || 0}`);
      console.log(`   Domain Counts Keys: ${Object.keys(updated.domainCounts || {}).join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Error updating SDS domains:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

updateSDSDomains();
