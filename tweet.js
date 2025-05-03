import { Scraper } from 'agent-twitter-client';
import dotenv from 'dotenv';

dotenv.config();

async function sendSingleTweet(text, scraper) {
    try {
        console.log('Attempting to send tweet:', text);
        const result = await scraper.sendTweet(text);
        if (result.status === 200) {
            console.log('Tweet sent successfully');
            return result;

        } else {
            console.error('Error sending tweet:', result.error);
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error sending tweet:', error);
        throw error;
    }
}

async function sendTweets(tweets) {
    console.log('Preparing to send tweets:', tweets);
    const scraper = new Scraper();
    const formattedCookies = [
        `auth_token=${process.env.auth_token}; domain=.twitter.com; path=/`,
        `ct0=${process.env.ct0}; domain=.twitter.com; path=/`,
        `twid=${process.env.twid}; domain=.twitter.com; path=/`
    ];
    console.log('Formatted cookies:', formattedCookies);
    
    try {
        await scraper.setCookies(formattedCookies);
        
        // If a single string is passed, convert it to an array
        let tweetArray;
        if (Array.isArray(tweets)) {
            tweetArray = tweets;
        } else {
            // Split on lines that start with a number and a dot (e.g., "1. ...")
            tweetArray = tweets.split(/(?:^|\n)\d+\.\s*/).filter(Boolean);
        }
        
        // Send tweets in sequence
        for (const tweet of tweetArray) {
            const cleanedTweet = tweet
                .replace(/^(?:[0-9]+\.\s*|-+\s*)/, '') // Remove leading number-dot or dash
                .replace(/[\r\n]/g, '');               // Remove newlines
            console.log('About to send tweet:', cleanedTweet);
            await sendSingleTweet(cleanedTweet, scraper);
            // Add a small delay between tweets to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log(`Successfully sent ${tweetArray.length} tweet(s)`);
        return { success: true, message: `Successfully sent ${tweetArray.length} tweet(s)` };
    } catch (error) {
        console.error('Error in sendTweets:', error);
        return { success: false, error: error.message };
    }
}

export { sendTweets };

// Example usage:
// sendTweets('Hello from a simplified Twitter bot!');
