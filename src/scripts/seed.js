import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Restaurant from '../models/restaurant.js'; // adjust path if your model is elsewhere

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mydb';

const sampleData = [
  {
    name: "Sunrise Diner",
    description: "Cozy all-day diner serving breakfast favorites.",
    imageUrl: "https://example.com/images/sunrise.jpg",
    rating: 4.2,
    menu: [
      { name: "Pancake Stack", description: "Fluffy pancakes with maple syrup", price: 6.5 },
      { name: "Bacon & Eggs", description: "Classic fried eggs and bacon", price: 8.0 }
    ]
  },
  {
    name: "Spice Garden",
    description: "Homestyle Indian dishes with bold flavors.",
    imageUrl: "https://example.com/images/spicegarden.jpg",
    rating: 4.6,
    menu: [
      { name: "Chicken Tikka Masala", description: "Creamy tomato curry", price: 12.5 },
      { name: "Chana Masala", description: "Spicy chickpea curry", price: 10.0 },
      { name: "Naan", description: "Oven-baked flatbread", price: 2.5 }
    ]
  },
  {
    name: "Green Leaf",
    description: "Fresh vegan & healthy bowls and snacks.",
    imageUrl: "https://example.com/images/greenleaf.jpg",
    rating: 4.4,
    menu: [
      { name: "Quinoa Bowl", description: "Quinoa, roasted veg, tahini dressing", price: 11.0 },
      { name: "Avocado Toast", description: "Sourdough, smashed avocado, chili flakes", price: 7.5 }
    ]
  }
];

async function main() {
  console.log('Seeding started...');
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB:', mongoUri);

    let created = 0;
    let updated = 0;

    for (const r of sampleData) {
      // upsert by name so script is idempotent in dev
      const res = await Restaurant.updateOne(
        { name: r.name },
        { $set: r },
        { upsert: true }
      );

      // updateOne upsertedCount isn't directly available on all drivers consistently;
      // we inspect res to infer operations:
      if (res.upsertedCount && res.upsertedCount > 0) created += 1;
      else if (res.matchedCount && res.matchedCount > 0 && res.modifiedCount >= 0) {
        // matchedCount > 0 means it existed; treat as updated
        // modifiedCount may be 0 if content identical
        updated += 1;
      } else {
        // fallback: count as created if ambiguous
        created += 1;
      }
    }

    // print a quick summary by fetching the seeded docs
    const seeded = await Restaurant.find({ name: { $in: sampleData.map(s => s.name) } }).lean();
    console.log(`Seed summary: ${seeded.length} documents present for seeded restaurants.`);
    seeded.forEach(r => {
      console.log(` - ${r.name} (id: ${r._id}) with ${Array.isArray(r.menu) ? r.menu.length : 0} menu items`);
    });

    console.log(`Created: ${created}, Updated: ${updated}`);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected. Seeding finished.');
  }
}

main();
