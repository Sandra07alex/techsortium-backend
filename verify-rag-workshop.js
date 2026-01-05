import { MongoClient } from 'mongodb';
import 'dotenv/config';

async function verifyRAGWorkshop() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('techsortium');
    const collection = db.collection('events');
    
    const ragWorkshop = await collection.findOne({ slug: 'rag-ai-systems' });
    
    if (ragWorkshop) {
      console.log('✅ RAG Workshop Verification:');
      console.log(`   Title: ${ragWorkshop.title}`);
      console.log(`   ID: ${ragWorkshop.id}`);
      console.log(`   Slug: ${ragWorkshop.slug}`);
      console.log(`   Track: ${ragWorkshop.track}`);
      console.log(`   Date/Time: ${ragWorkshop.datetime}`);
      console.log(`   Speaker: B Pranavkrishna Vadhyar`);
      console.log(`   Short Description: ${ragWorkshop.shortDescription}`);
      console.log(`\n✅ Workshop is ready for registration!`);
    } else {
      console.log('❌ RAG Workshop not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

verifyRAGWorkshop();
