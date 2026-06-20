const User = require('../models/user.model');
const Scheme = require('../models/scheme.model');

// A Set of active user IDs (stored as String)
const activeUsers = new Set();

/**
 * Sends an Expo push notification to the user if they have registered a push token.
 * Selecting a random scheme and message context.
 * @param {string} receiverId - The ID of the recipient user
 */
const sendPushNotification = async (receiverId) => {
    try {
        const receiver = await User.findById(receiverId);
        if (!receiver || !receiver.expoPushToken) {
            console.log(`[Notification] No push token registered for user: ${receiverId}`);
            return;
        }

        // Fetch a random scheme from database
        const count = await Scheme.countDocuments();
        let schemeId = null;
        let schemeName = '';
        if (count > 0) {
            const randomIdx = Math.floor(Math.random() * count);
            const randomScheme = await Scheme.findOne().skip(randomIdx);
            if (randomScheme) {
                schemeId = randomScheme._id;
                schemeName = randomScheme.name;
            }
        }

        // Randomly select notification message
        const messages = [
            "You have new schem",
            "Your eligible for this schem"
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const bodyText = schemeName ? `${randomMessage}: ${schemeName}` : randomMessage;

        const payload = {
            to: receiver.expoPushToken,
            sound: 'default',
            title: 'Next Step Alert',
            body: bodyText,
            data: {
                type: 'scheme',
                schemeId: schemeId ? schemeId.toString() : undefined,
            },
        };

        console.log(`[Notification] Sending push notification to ${receiver.email}:`, payload);

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const resData = await response.json();
        console.log('[Notification] Expo response:', JSON.stringify(resData));
    } catch (error) {
        console.error('[Notification] Error sending push notification:', error);
    }
};

module.exports = {
    activeUsers,
    sendPushNotification,
};
