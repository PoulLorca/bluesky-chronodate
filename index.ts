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

async function postYearProgress(){
    const {year, progress, bar} = getYearProgress();
    const message = `${year} is ${progress}% complete. \n${bar}`;    

    await agent.login({ identifier: process.env.BLUESKY_USERNAME!, password: process.env.BLUESKY_PASSWORD!})
    await agent.post({
        text: message
    });
    
    console.log("Posted message:", message)
}


async function main() {
    await agent.login({ 
        identifier: process.env.BLUESKY_USERNAME!,
        password: process.env.BLUESKY_PASSWORD!
    });

    console.log("Bot logged in successfully.");
;

    //Activate the cron job to post the year progress
    const scheduleExpression = '0 0 * * *'; // Publish every day at midnight    
    const job = new CronJob(scheduleExpression, postYearProgress); // change to scheduleExpressionMinute for testing    
    job.start();    
    console.log("Cron job started for daily year progress updates.");
}

//Start the bot
main().catch((err)=>{
    console.error("Error in main function:", err);
});