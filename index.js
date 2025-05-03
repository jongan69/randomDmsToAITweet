import { getDms } from './getDms.js';
import { aiDmSummary } from './summarizeDms.js';
import { sendTweets } from './tweet.js';

const dms = await getDms();
const summary = await aiDmSummary(dms);
console.log(summary);
await sendTweets(summary.toString());
