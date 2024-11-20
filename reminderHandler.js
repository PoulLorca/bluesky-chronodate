"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleReminders = handleReminders;
const firebaseHandler_1 = require("./firebaseHandler");
async function handleReminders(agent) {
    console.log("Starting reminder handler...");
    setInterval(async () => {
        try {
            const pendingReminders = await (0, firebaseHandler_1.getPendingReminders)();
            if (pendingReminders.length === 0) {
                console.log("No pending reminders at this time");
                return;
            }
            for (const reminder of pendingReminders) {
                const { userHandle, requestId, text, uri, cid } = reminder;
                await sendReminderNotification(agent, userHandle, text, uri, cid);
                await (0, firebaseHandler_1.markReminderAsSent)(userHandle, requestId);
                console.log(`Reminder ${requestId} marked as sent for user ${userHandle}`);
            }
        }
        catch (error) {
            console.error("Error in reminder handler:", error);
        }
    }, 60000); // Check every 60 seconds
}
async function sendReminderNotification(agent, userHandle, text, uri, cid) {
    try {
        const postId = extractPostIdFromUri(uri);
        const profileUrl = `https://bsky.app/profile/${userHandle}`;
        const postUrl = `${profileUrl}/post/${postId}`;
        const message = `@${userHandle} Hey, ChronoDate here! Do you remember this post? ${postUrl}\n"${text}"`;
        await agent.post({
            text: message,
            reply: {
                root: {
                    uri,
                    cid
                },
                parent: {
                    uri,
                    cid
                }
            }
        });
        console.log(`Reminder sent to user ${userHandle}`);
    }
    catch (error) {
        console.error(`Error sending reminder to user ${userHandle}`, error);
    }
}
function extractPostIdFromUri(uri) {
    const parts = uri.split('/');
    return parts[parts.length - 1] || null;
}
