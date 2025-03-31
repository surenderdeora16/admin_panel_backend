// seed.js
require('dotenv').config();
require('./src/database/connect');
const { seedDatabase } = require('./src/database/seed');

async function runSeed() {
  try {
    console.log("Loading...")
    await seedDatabase();
    console.log('Database seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

runSeed();