"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listenMentions = listenMentions;
const api_1 = require("@atproto/api");
const firebaseHandler_1 = require("./firebaseHandler");
const docsLink = "https://example.com/docs";
const MAX_REMINDERS_PER_USER = 15;
const processedNotifications = new Set();
async function listenMentions(agent) {
    console.log("Bot listening for mentions...");
    setInterval(async () => {
        const notificationsResponse = await agent.listNotifications({ limit: 50 });
        const notifications = notificationsResponse.data.notifications;
        let lastSeenAt = "";
        const mentions = notifications.filter((notification) => notification.reason === "mention" && notification.isRead === false);
        for (const mention of mentions) {
            const userHandle = mention.author.handle;
            const notificationUri = mention.uri;
            if (processedNotifications.has(notificationUri)) {
                console.log(`Notification ${notificationUri} already processed.`);
                continue;
            }
            processedNotifications.add(notificationUri);
            const activeReminders = await (0, firebaseHandler_1.countActiveReminders)(userHandle);
            if (activeReminders >= MAX_REMINDERS_PER_USER) {
                console.warn(`User ${userHandle} has reached the limit of ${MAX_REMINDERS_PER_USER} reminders.`);
                await sendReply(agent, mention, `Sorry @${userHandle}, you have reached the limit of ${MAX_REMINDERS_PER_USER} reminders.`);
                continue;
            }
            if (await (0, firebaseHandler_1.reminderExists)(userHandle, notificationUri)) {
                console.log(`Reminder ${notificationUri} already exists for user ${userHandle}`);
                continue;
            }
            const text = extractTextFromRecord(mention.record);
            if (!text) {
                console.warn(`No valid text found in record for mention ${mention.uri}`);
                await sendReply(agent, mention, `Invalid format. Please refer to the documentation: ${docsLink}`);
                continue;
            }
            const timestamp = calculateTimestamp(text);
            if (timestamp === null || timestamp <= Date.now()) {
                console.warn(`Invalid timestamp calculated for mention ${mention.uri}`);
                await sendReply(agent, mention, `Invalid or past date. Please check the format: ${docsLink}`);
                continue;
            }
            const reminderData = {
                text,
                timestamp,
                notificationSent: false,
                uri: mention.uri,
                cid: mention.cid,
                userHandle, // Añade el handle al recordatorio
            };
            await (0, firebaseHandler_1.addReminder)(userHandle, notificationUri, reminderData);
            console.log(`Reminder ${notificationUri} added for user ${userHandle}`);
            await sendReply(agent, mention, `Sure @${userHandle}! I will remind you on ${formatDate(timestamp)}`);
            if (!lastSeenAt || mention.indexedAt > lastSeenAt) {
                lastSeenAt = mention.indexedAt;
            }
        }
        if (lastSeenAt) {
            await markNotificationsAsRead(agent, lastSeenAt);
        }
    }, 30000); // Check every 30 seconds
}
function calculateTimestamp(text) {
    const relativeDatePattern = /remember me in (\d+) (minutes|hours|days|weeks|months|years)/;
    const absoluteDatePattern = /remember me on (\d{4}-\d{2}-\d{2})/;
    const relativeMatch = text.match(relativeDatePattern);
    if (relativeMatch) {
        const amount = parseInt(relativeMatch[1], 10);
        const unit = relativeMatch[2];
        const now = Date.now();
        switch (unit) {
            case "minutes":
                return now + amount * 60 * 1000;
            case "hours":
                return now + amount * 60 * 60 * 1000;
            case "days":
                return now + amount * 24 * 60 * 60 * 1000;
            case "weeks":
                return now + amount * 7 * 24 * 60 * 60 * 1000;
            case "months":
                return now + amount * 30 * 24 * 60 * 60 * 1000;
            case "years":
                return now + amount * 365 * 24 * 60 * 60 * 1000;
            default:
                return null;
        }
    }
    const absoluteMatch = text.match(absoluteDatePattern);
    if (absoluteMatch) {
        const dateString = absoluteMatch[1];
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.getTime();
        }
    }
    return null;
}
function extractTextFromRecord(record) {
    if (api_1.AppBskyFeedPost.isRecord(record)) {
        return record.text;
    }
    console.warn("Record does not match expected structure: ", record);
    return null;
}
async function markNotificationsAsRead(agent, seenAt) {
    try {
        // Call the API to mark notifications as read up to `seenAt`
        const response = await agent.api.app.bsky.notification.updateSeen({ seenAt });
        console.log(`All notifications up to ${seenAt} marked as read.`);
    }
    catch (error) {
        console.error(`Failed to mark notifications as read up to ${seenAt}`, error);
    }
}
async function sendReply(agent, mention, message) {
    try {
        await agent.post({
            text: message,
            reply: {
                root: {
                    uri: mention.uri,
                    cid: mention.cid,
                },
                parent: {
                    uri: mention.uri,
                    cid: mention.cid,
                },
            },
        });
    }
    catch (error) {
        console.error(`Failed to send reply to ${mention.uri}`, error);
    }
}
// Format the date from a timestamp
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
    });
}
