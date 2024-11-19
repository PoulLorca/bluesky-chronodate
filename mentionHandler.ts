import { BskyAgent, AppBskyFeedPost } from "@atproto/api";
import { addReminder, reminderExists, countActiveReminders } from "./firebaseHandler";

const docsLink: string = "https://example.com/docs";
const MAX_REMINDERS_PER_USER = 15;

export async function listenMentions(agent: BskyAgent) {
    console.log("Bot listening for mentions...");

    setInterval(async () => {
        const notifications = await agent.listNotifications({ limit: 50 });

        const mentions = notifications.data.notifications.filter(
            (notification) => notification.reason === "mention" && notification.isRead === false
        );

        for (const mention of mentions) {
            const userDid = mention.author.did;

            // Check if the user has reached the reminder limit
            const activeReminders = await countActiveReminders(userDid);
            if (activeReminders >= MAX_REMINDERS_PER_USER) {
                console.warn(`User ${userDid} has reached the limit of ${MAX_REMINDERS_PER_USER} reminders.`);
                await sendReply(agent, mention, `Sorry, you have reached the limit of ${MAX_REMINDERS_PER_USER} reminders.`);
                continue;
            }

            const notificationCid = mention.cid;

            // Check if this reminder already exists
            if (await reminderExists(userDid, notificationCid)) {
                console.log(`Reminder ${notificationCid} already exists for user ${userDid}`);
                continue;
            }

            // Validate the text and calculate the timestamp
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
            };

            await addReminder(userDid, notificationCid, reminderData);
            console.log(`Reminder ${notificationCid} added for user ${userDid}`);

            // Confirmation to user
            await sendReply(agent, mention, `Sure! I will remind you on ${formatDate(timestamp)}`);

            // Mark the notification as read
            await markNotificationAsRead(agent, mention);
            console.log(`Responded and marked as read for user ${userDid}`);
        }
    }, 15000); // Check every 15 seconds
}

function calculateTimestamp(text: string): number | null {
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

function extractTextFromRecord(record: unknown): string | null {
    if (AppBskyFeedPost.isRecord(record)) {
        return record.text;
    }
    console.warn("Record does not match expected structure: ", record);
    return null;
}

async function markNotificationAsRead(agent: BskyAgent, mention: { uri: string; indexedAt: string }) {
    try {
        await agent.api.app.bsky.notification.updateSeen({ seenAt: mention.indexedAt });
        console.log(`Notification ${mention.uri} marked as read`);
    } catch (error) {
        console.error(`Failed to mark notification ${mention.uri} as read`, error);
    }
}

async function sendReply(agent: BskyAgent, mention: any, message: string) {
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
    } catch (error) {
        console.error(`Failed to send reply to ${mention.uri}`, error);
    }
}

//Format the date from a timestamp
function formatDate(timestamp: number): string{
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short"
    });
}