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
        const userId = me?.userId;
        let dms;
        if (!userId) {
            console.error('No user ID found');
            dms = await scraper.getDirectMessageConversations(100);
        } else {
            dms = await scraper.getDirectMessageConversations(userId, 100);
        }
        // dms is expected to be an array of DirectMessageConversation objects
        // Each conversation has a messages array, each message has a text property
        // Only include conversations with more than 2 participants
        const groupConversations = (dms.conversations || []).filter(convo => Array.isArray(convo.participants) && convo.participants.length > 2);
        // Flatten all messages from all group conversations, sort by createdAt descending, and return just the text
        const allMessages = groupConversations
            .flatMap(convo => convo.messages)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        // Log the first message object to inspect its properties
        if (allMessages.length > 0) {
            console.log('Sample message object:', allMessages[0]);
        }
        // Filter out messages sent by the authenticated user
        let receivedMessages;
        if (userId) {
            console.log('User ID found!');
            receivedMessages = allMessages.filter(msg => msg.senderId !== userId);
        } else {
            console.log('No user ID found, using all messages');
            receivedMessages = allMessages;
        }
        // Filter out reaction messages (e.g., messages starting with 'Reacted to') and URLs
        const nonReactionMessages = receivedMessages
            .filter(msg => !/^Reacted to /i.test(msg.text))
            .filter(msg => !/^https?:\/\/\S+$/i.test(msg.text));

        // Filter messages to only include those from the last 24 hours
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const recentMessages = nonReactionMessages.filter(msg => {
            const createdAt = new Date(Number(msg.createdAt));
            return createdAt >= oneDayAgo;
        });
        const recentMessageTexts = recentMessages
            .map(msg => msg.text.replace(/\n/g, ' '))
            .filter(msg => !/^https?:\/\/\S+$/i.test(msg));
        if (recentMessageTexts.length === 0) {
            console.log('No messages found from the last 24 hours');
            return [];
        }
        return recentMessageTexts;
    } catch (error) {
        console.error('Error in getDms:', error);
        return [];
    }
}

// Example usage:
getDms().then(console.log);