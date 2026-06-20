const mongoose = require('mongoose');
// Load environment variables first
const dotenv = require('dotenv');
dotenv.config();

const { encrypt } = require('./utils/encryption');

// Minimal Chat Model
const chatSchema = new mongoose.Schema({
    message: { type: String, required: true },
}, { strict: false });

const Chat = mongoose.model('Chat', chatSchema);

async function migrateMessages() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const chats = await Chat.find({});
        console.log(`Found ${chats.length} messages. Checking for unencrypted messages...`);

        let updatedCount = 0;

        for (const chat of chats) {
            if (!chat.message) continue;
            
            // Check if it's already encrypted (has the format hex_iv:hex_encrypted)
            const parts = chat.message.split(':');
            const isEncryptedFormat = parts.length === 2 && parts[0].length === 32; // IV in hex is 32 chars

            if (!isEncryptedFormat) {
                chat.message = encrypt(chat.message);
                await chat.save();
                updatedCount++;
            }
        }

        console.log(`Migration complete! Encrypted ${updatedCount} plain text messages.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateMessages();
