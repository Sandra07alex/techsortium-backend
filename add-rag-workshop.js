import { MongoClient } from 'mongodb';
import 'dotenv/config';

const ragWorkshop = {
  id: "w4",
  title: "RAG in AI Systems — Retrieval Augmented Generation",
  slug: "rag-ai-systems",
  track: "workshops",
  shortDescription: "Master Retrieval Augmented Generation (RAG) - how modern AI systems become smarter and more accurate.",
  longDescription: "Explore how modern AI systems become smarter, more accurate, and context-aware through Retrieval Augmented Generation (RAG) in this end-to-end technical workshop.\n\nIEEE Techsortium'25, powered by IEEE LINK, presents a deep dive into how AI models retrieve real-world knowledge, enhance large language models, and deliver intelligent, reliable responses.\n\nThe session will be led by B Pranavkrishna Vadhyar, AI Consultant at Hashroot and Founder of Core.ai Technical Community, who will walk participants through practical concepts, architectures, and real-world use cases of RAG-based systems.\n\n🗓 Date: 20 December 2025\n⏰ Time: 8:00 PM\n📍 Venue: Google Meet\n\nThis workshop is ideal for students and developers curious about building intelligent AI systems that combine data retrieval with generative models.",
  posterUrl: "https://images.unsplash.com/photo-1677442d019e157c3c2e8520444b68603b786bbe?w=800&auto=format&fit=crop",
  datetime: "2025-12-20T20:00:00",
  capacity: null,
  fee: null,
  qrPaymentRequired: false,
  requirements: ["Laptop recommended", "Basic understanding of AI/ML concepts"]
};

async function addRAGWorkshop() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('techsortium');
    const collection = db.collection('events');
    
    // Check if RAG workshop already exists
    const existing = await collection.findOne({ slug: ragWorkshop.slug });
    if (existing) {
      console.log('⚠️  RAG workshop already exists in database');
      console.log(`   Title: ${existing.title}`);
      console.log(`   ID: ${existing.id}`);
      return;
    }
    
    // Insert the RAG workshop
    const result = await collection.insertOne(ragWorkshop);
    console.log(`✅ Successfully added RAG workshop!`);
    console.log(`   ID: ${ragWorkshop.id}`);
    console.log(`   Title: ${ragWorkshop.title}`);
    console.log(`   Slug: ${ragWorkshop.slug}`);
    console.log(`   Date: ${ragWorkshop.datetime}`);
    console.log(`   Speaker: B Pranavkrishna Vadhyar`);
    
    // List all workshop events
    const workshops = await collection.find({ track: 'workshops' }).toArray();
    console.log('\n📋 Current Workshop Events:');
    workshops.forEach((w, idx) => {
      console.log(`   ${idx + 1}. ${w.title} (${w.slug})`);
      console.log(`      Date: ${w.datetime}`);
    });
    
    console.log(`\n✅ Total workshops: ${workshops.length}`);
    
  } catch (error) {
    console.error('❌ Error adding RAG workshop:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Operation complete!');
  }
}

addRAGWorkshop();
