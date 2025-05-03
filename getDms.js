import { Scraper } from 'agent-twitter-client';
import dotenv from 'dotenv';

dotenv.config();

export async function getDms() {
    console.log('Preparing to get dms');
    const scraper = new Scraper();
    const formattedCookies = [
        `auth_token=${process.env.auth_token}; domain=.twitter.com; path=/`,
        `ct0=${process.env.ct0}; domain=.twitter.com; path=/`,
        `twid=${process.env.twid}; domain=.twitter.com; path=/`
    ];

    try {
        await scraper.setCookies(formattedCookies);
        const me = await scraper.me();
        const userId = me.userId;
        let dms;
        if (!userId) {
            console.error('No user ID found');
            dms = await scraper.getDirectMessageConversations(50);
        } else {
            dms = await scraper.getDirectMessageConversations(userId, 50);
        }
        // dms is expected to be an array of DirectMessageConversation objects
        // Each conversation has a messages array, each message has a text property
        // Flatten all messages from all conversations, sort by createdAt descending, and return just the text
        const allMessages = (dms.conversations || [])
            .flatMap(convo => convo.messages)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        // Log the first message object to inspect its properties
        if (allMessages.length > 0) {
            console.log('Sample message object:', allMessages[0]);
        }
        // Filter out messages sent by the authenticated user
        let receivedMessages;
        if (userId) {
            console.log('User ID found!',);
            receivedMessages = allMessages.filter(msg => msg.senderId !== userId);
        } else {
            console.log('No user ID found, using all messages');
            receivedMessages = allMessages;
        }
        // Filter out reaction messages (e.g., messages starting with 'Reacted to')
        const nonReactionMessages = receivedMessages.filter(msg => !/^Reacted to /i.test(msg.text));
        const messageTexts = nonReactionMessages.map(msg => msg.text);
        // Filter out messages that are only URLs
        const filteredMessages = messageTexts.filter(msg => !/^https?:\/\/\S+$/i.test(msg));
        return filteredMessages;
    } catch (error) {
        console.error('Error in getDms:', error);
        return [];
    }
}

// Example usage:
// getDms().then(console.log);