"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@atproto/api");
const dotenv = __importStar(require("dotenv"));
const process = __importStar(require("process"));
const yearProgress_1 = require("./yearProgress");
const mentionHandler_1 = require("./mentionHandler");
const reminderHandler_1 = require("./reminderHandler");
dotenv.config();
// Create a Bluesky Agent 
const agent = new api_1.BskyAgent({
    service: 'https://bsky.social',
});
async function postYearProgress() {
    const { year, progress, bar } = (0, yearProgress_1.getYearProgress)();
    const message = `${year} is ${progress}% complete. \n${bar}`;
    await agent.login({ identifier: process.env.BLUESKY_USERNAME, password: process.env.BLUESKY_PASSWORD });
    await agent.post({
        text: message
    });
    console.log("Posted message:", message);
}
async function main() {
    await agent.login({
        identifier: process.env.BLUESKY_USERNAME,
        password: process.env.BLUESKY_PASSWORD
    });
    console.log("Bot logged in successfully.");
    //Listening the mentions
    await (0, mentionHandler_1.listenMentions)(agent);
    //Managing reminders
    await (0, reminderHandler_1.handleReminders)(agent);
    //Activate the cron job to post the year progress
    const scheduleExpression = '0 0 * * *'; // Publish every day at midnight    
    //const job = new CronJob(scheduleExpression, postYearProgress); // change to scheduleExpressionMinute for testing    
    //job.start();    
    console.log("Cron job started for daily year progress updates.");
}
//Start the bot
main().catch((err) => {
    console.error("Error in main function:", err);
});
