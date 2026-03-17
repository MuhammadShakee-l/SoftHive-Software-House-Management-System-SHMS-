/**
 * Database Seeder — creates demo admin, manager, developer, client accounts
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Client = require('./models/Client');
const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();
  console.log('Seeding database...');

  // Clear existing
  await User.deleteMany({});
  await Employee.deleteMany({});
  await Client.deleteMany({});

  const users = [
    { name: 'Super Admin',    email: 'admin@shms.com',   password: 'admin123', role: 'admin' },
    { name: 'Alice Manager',  email: 'manager@shms.com', password: 'admin123', role: 'manager' },
    { name: 'Bob Developer',  email: 'dev@shms.com',     password: 'admin123', role: 'developer' },
    { name: 'Carol Client',   email: 'client@shms.com',  password: 'admin123', role: 'client' },
  ];

  for (const u of users) {
    const created = await User.create(u);
    if (u.role === 'manager' || u.role === 'developer') {
      await Employee.create({
        user: created._id,
        department: u.role === 'manager' ? 'Management' : 'Engineering',
        designation: u.role === 'manager' ? 'Senior Project Manager' : 'Full Stack Developer',
        salary: u.role === 'manager' ? 8000 : 5000,
        skills: u.role === 'developer' ? ['React', 'Node.js', 'MongoDB'] : ['Agile', 'Scrum'],
      });
    } else if (u.role === 'client') {
      await Client.create({
        user: created._id,
        companyName: 'Carol Tech Solutions',
        industry: 'Technology',
        website: 'https://caroltech.com',
      });
    }
    console.log(`Created: ${u.email} (${u.role})`);
  }

  console.log('\nSeeding complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin    → admin@shms.com    / admin123');
  console.log('Manager  → manager@shms.com  / admin123');
  console.log('Dev      → dev@shms.com      / admin123');
  console.log('Client   → client@shms.com   / admin123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });