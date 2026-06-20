const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/user.model');

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@nextstep.com';
        const adminPassword = 'adminpassword123'; // Change this!

        const adminExists = await User.findOne({ email: adminEmail });

        if (adminExists) {
            console.log('Admin already exists');
            process.exit();
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        const admin = await User.create({
            name: 'System Admin',
            email: adminEmail,
            mobile: 9988776655,
            password: hashedPassword,
            role: 'admin'
        });

        if (admin) {
            console.log('Admin user created successfully');
            console.log('Email:', adminEmail);
            console.log('Password:', adminPassword);
        }

        process.exit();
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
