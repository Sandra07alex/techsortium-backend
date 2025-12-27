import 'dotenv/config';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

async function check() {
  try {
    await client.connect();
    const db = client.db('techsortium');
    
    // Get all unique event slugs
    const regs = await db.collection('registrations').find({}).toArray();
    const slugs = new Set(regs.map(r => r.eventSlug));
    
    console.log('=== All event slugs in registrations ===');
    slugs.forEach(slug => {
      const count = regs.filter(r => r.eventSlug === slug).length;
      console.log(`${slug}: ${count} registrations`);
    });
    
    console.log('\n=== SDS registrations sample ===');
    const sdsRegs = regs.filter(r => r.eventSlug && r.eventSlug.includes('sds'));
    console.log(`Found ${sdsRegs.length} SDS registrations`);
    if (sdsRegs.length > 0) {
      console.log('Sample:', JSON.stringify(sdsRegs[0], null, 2));
    }
  } finally {
    await client.close();
  }
}

check();
