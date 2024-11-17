import { BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';
import { CronJob } from 'cron';
import * as process from 'process';
import { getYearProgress } from './yearProgress';

dotenv.config();

// Create a Bluesky Agent 
const agent = new BskyAgent({
    service: 'https://bsky.social',
  })


async function main() {
    const {year, progress, bar} = getYearProgress();
    const message = `${year} is ${progress}% complete. \n${bar}`;    

    await agent.login({ identifier: process.env.BLUESKY_USERNAME!, password: process.env.BLUESKY_PASSWORD!})
    await agent.post({
        text: message
    });
    
    console.log("Posted message:", message)
}

main();


// Run this on a cron job
const scheduleExpressionMinute = '* * * * *'; // Run once every minute for testing
const scheduleExpression = '0 0 * * *'; // PUblis every day at midnight

const job = new CronJob(scheduleExpression, main); // change to scheduleExpressionMinute for testing

job.start();

console.log("Cron job started. Waiting for the next execution...");