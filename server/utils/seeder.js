import User, { UserRole } from '../models/User.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export const seedUsers = async () => {
  try {
    // Force clear users to ensure correct hashing
    console.log('Clearing existing users for re-seed...');
    await User.deleteMany({});

    console.log('Seeding default users with manual hashing...');

    const salt = await bcrypt.genSalt(10);

    const users = [
    {
      _id: new mongoose.Types.ObjectId('000000000000000000000001'),
      name: 'System Admin',
      email: 'admin@company.com',
      password: await bcrypt.hash('admin123', salt),
      role: UserRole.ADMIN
    },
    {
      _id: new mongoose.Types.ObjectId('000000000000000000000002'),
      name: 'Procurement Manager',
      email: 'manager@company.com',
      password: await bcrypt.hash('manager123', salt),
      role: UserRole.MANAGER
    },
    {
      _id: new mongoose.Types.ObjectId('000000000000000000000003'),
      name: 'Standard User',
      email: 'user@company.com',
      password: await bcrypt.hash('user123', salt),
      role: UserRole.USER
    }];


    for (const userData of users) {
      // We use create() but with already hashed passwords
      // We need to make sure the middleware doesn't hash it AGAIN
      await User.collection.insertOne(userData);
      console.log(`Created user: ${userData.email}`);
    }

    console.log('Default users created successfully.');
  } catch (error) {
    console.error('Error seeding users:', error);
  }
};