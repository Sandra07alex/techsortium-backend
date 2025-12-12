import { MongoClient } from 'mongodb';
import 'dotenv/config';

const events = [
  {
    id: "w1",
    title: "ThinkUX — UX & Cognitive Science",
    slug: "thinkux",
    track: "workshops",
    shortDescription: "UX & Cognitive Science Workshop",
    longDescription: "Explore how cognitive science informs user experience design. Speaker: Brian Roy Mathew — UX strategist @ Cenit Labs & Research Activities Coordinator, IEEE EdSoc Kerala Chapter SLT. Event Date: 2025-12-15T20:00:00.",
    posterUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop",
    datetime: "2025-12-15T20:00:00",
    capacity: null,
    fee: null,
    qrPaymentRequired: false,
    requirements: ["Laptop recommended"]
  },
  {
    id: "w2",
    title: "TejasGuard — Cyber Security Workshop",
    slug: "tejasguard",
    track: "workshops",
    shortDescription: "Session in Cyber Threats and Defence",
    longDescription: "Understand contemporary cyber threats and defence strategies. Speaker: Sukesh S — Founder, ASTROLABZ & Project Coordinator, IEEE LINK. Event Date: 2025-12-16T20:00:00.",
    posterUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop",
    datetime: "2025-12-16T20:00:00",
    capacity: null,
    fee: null,
    qrPaymentRequired: false,
    requirements: ["Laptop recommended"]
  },
  {
    id: "c1",
    title: "Web Development Competition",
    slug: "web-development-competition",
    track: "competitions",
    shortDescription: "Design and develop a complete web application.",
    longDescription: "Compete in this web development competition. Build a fully functional web application based on given requirements. Judged on creativity, functionality, code quality, and user experience.",
    posterUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop",
    datetime: "2024-03-18T10:00:00",
    capacity: 100,
    fee: 50,
    qrPaymentRequired: true,
    prizes: ["1st: ₹25,000", "2nd: ₹15,000", "3rd: ₹10,000"]
  },
  {
    id: "c2",
    title: "UI/UX Competition",
    slug: "uiux-competition",
    track: "competitions",
    shortDescription: "Create stunning user interfaces and user experiences.",
    longDescription: "Showcase your design skills in this UI/UX competition. Design a complete user interface for a given problem statement, focusing on aesthetics, usability, and user experience. Tools of your choice allowed.",
    posterUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop",
    datetime: "2024-03-19T10:00:00",
    capacity: 80,
    fee: 50,
    qrPaymentRequired: true,
    prizes: ["1st: ₹18,000", "2nd: ₹10,000", "3rd: ₹6,000"]
  },
  {
    id: "c3",
    title: "Script Writing Competition",
    slug: "script-writing-competition",
    track: "competitions",
    shortDescription: "Write compelling scripts and storytelling.",
    longDescription: "Put your creative writing skills to the test. Write original scripts for short films, plays, or other media based on given themes. Judged on originality, narrative structure, and dialogue quality.",
    posterUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop",
    datetime: "2024-03-20T10:00:00",
    capacity: 70,
    fee: 50,
    qrPaymentRequired: true,
    prizes: ["1st: ₹15,000", "2nd: ₹9,000", "3rd: ₹5,000"]
  },
  {
    id: "c4",
    title: "Poster Designing Competition",
    slug: "poster-designing-competition",
    track: "competitions",
    shortDescription: "Design eye-catching and impactful posters.",
    longDescription: "Showcase your graphic design skills by creating visually appealing posters. Design posters for given themes or messages. Judged on visual impact, creativity, typography, and message clarity.",
    posterUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop",
    datetime: "2024-03-21T10:00:00",
    capacity: 75,
    fee: 50,
    qrPaymentRequired: true,
    prizes: ["1st: ₹14,000", "2nd: ₹8,500", "3rd: ₹5,000"]
  },
  {
    id: "c5",
    title: "Airplane Designing Competition",
    slug: "airplane-designing-competition",
    track: "competitions",
    shortDescription: "Design innovative aircraft concepts.",
    longDescription: "Challenge your engineering and design skills by conceptualizing and designing innovative airplane models. Consider aerodynamics, efficiency, and innovation. Judged on technical merit, creativity, and feasibility.",
    posterUrl: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&auto=format&fit=crop",
    datetime: "2024-03-22T10:00:00",
    capacity: 60,
    fee: 50,
    qrPaymentRequired: true,
    prizes: ["1st: ₹20,000", "2nd: ₹12,000", "3rd: ₹7,000"]
  },
  {
    id: "c6",
    title: "Video Editing Competition",
    slug: "video-editing-competition",
    track: "competitions",
    shortDescription: "Create compelling video content through editing.",
    longDescription: "Demonstrate your video editing expertise by creating professional videos from given raw footage or creating original content. Judged on editing quality, pacing, effects, and storytelling.",
    posterUrl: "https://images.unsplash.com/photo-1551512519-2ca7cc56f2bb?w=800&auto=format&fit=crop",
    datetime: "2024-03-23T10:00:00",
    capacity: 65,
    fee: 50,
    qrPaymentRequired: true,
    prizes: ["1st: ₹17,000", "2nd: ₹10,000", "3rd: ₹6,000"]
  },
  {
    id: "c7",
    title: "Social Experiments Competition",
    slug: "social-experiments-competition",
    track: "competitions",
    shortDescription: "Conduct creative social experiments and analysis.",
    longDescription: "Design and execute innovative social experiments. Analyze human behavior, social trends, or societal issues through creative experimentation. Judged on methodology, insights, and presentation.",
    posterUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop",
    datetime: "2024-03-24T10:00:00",
    capacity: 55,
    fee: 50,
    qrPaymentRequired: true,
    prizes: ["1st: ₹16,000", "2nd: ₹9,500", "3rd: ₹5,500"]
  },
  {
    id: "c8",
    title: "Event Drafting Competition",
    slug: "event-drafting-competition",
    track: "competitions",
    shortDescription: "Plan and draft innovative event concepts.",
    longDescription: "Show your event management and planning skills by drafting detailed event proposals. Create comprehensive event plans including logistics, budget, marketing, and execution strategies.",
    posterUrl: "https://images.unsplash.com/photo-1540575467063-178f50902f87?w=800&auto=format&fit=crop",
    datetime: "2024-03-25T10:00:00",
    capacity: 70,
    fee: 50,
    qrPaymentRequired: true,
    prizes: ["1st: ₹15,000", "2nd: ₹9,000", "3rd: ₹5,000"]
  },
  {
    id: "c9",
    title: "Presentation Making Competition",
    slug: "presentation-making-competition",
    track: "competitions",
    shortDescription: "Create and deliver compelling presentations.",
    longDescription: "Design and deliver impactful presentations on given or self-chosen topics. Judged on slide design, content quality, delivery, and audience engagement.",
    posterUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop",
    datetime: "2024-03-26T10:00:00",
    capacity: 80,
    fee: 50,
    qrPaymentRequired: true,
    prizes: ["1st: ₹14,000", "2nd: ₹8,500", "3rd: ₹5,000"]
  },
  {
    id: "c10",
    title: "Debate Competition",
    slug: "debate-competition",
    track: "competitions",
    shortDescription: "Showcase your argumentation and public speaking skills.",
    longDescription: "Participate in structured debate competitions on various topics. Demonstrate critical thinking, argumentation skills, and public speaking abilities. Judged on argument quality, delivery, and rebuttals.",
    posterUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop",
    datetime: "2024-03-27T10:00:00",
    capacity: 85,
    fee: 50,
    qrPaymentRequired: true,
    prizes: ["1st: ₹16,000", "2nd: ₹9,500", "3rd: ₹5,500"]
  },
  {
    id: "s1",
    title: "Git & GitHub Masterclass",
    slug: "git-masterclass",
    track: "sds",
    shortDescription: "Master version control and collaborative development workflows.",
    longDescription: "Learn professional Git workflows used in the industry. Understand branching strategies, pull requests, code reviews, and CI/CD integration. Perfect for beginners and those looking to improve their Git skills.",
    posterUrl: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop",
    datetime: "2024-03-24T10:00:00",
    capacity: 80,
    fee: null,
    qrPaymentRequired: false
  },
  {
    id: "s2",
    title: "Resume Building & Interview Prep",
    slug: "resume-interview",
    track: "sds",
    shortDescription: "Craft the perfect tech resume and ace your interviews.",
    longDescription: "Get personalized guidance on building an impressive tech resume. Learn interview strategies, common coding interview patterns, and behavioral interview techniques from industry professionals.",
    posterUrl: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop",
    datetime: "2024-03-25T14:00:00",
    capacity: 100,
    fee: null,
    qrPaymentRequired: false
  },
  {
    id: "s3",
    title: "Open Source Contribution Guide",
    slug: "opensource-guide",
    track: "sds",
    shortDescription: "Start your journey in open source development.",
    longDescription: "Discover how to find, evaluate, and contribute to open source projects. Understand open source licenses, community guidelines, and best practices for making meaningful contributions.",
    posterUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop",
    datetime: "2024-03-26T11:00:00",
    capacity: 70,
    fee: null,
    qrPaymentRequired: false
  }
  // TechHack 2024 (hackathon track) has been cancelled
];

async function seedEvents() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('techsortium');
    const collection = db.collection('events');
    
    // Check if events already exist
    const existingCount = await collection.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing events. Skipping seed.`);
      console.log('   To re-seed, delete existing events first.');
      return;
    }
    
    // Insert events
    const result = await collection.insertMany(events);
    console.log(`✅ Inserted ${result.insertedCount} events`);
    
    // Verify
    const count = await collection.countDocuments();
    console.log(`📊 Total events in database: ${count}`);
    
    // List inserted events
    console.log('\n📋 Inserted Events:');
    events.forEach(event => {
      console.log(`   - ${event.title} (${event.slug})`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding events:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Seeding complete!');
  }
}

seedEvents();

