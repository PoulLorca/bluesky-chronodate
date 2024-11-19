"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleReminders = handleReminders;
const firebaseHandler_1 = require("./firebaseHandler");
async function handleReminders(agent) {
    console.log("Starting reminder handler...");
    setInterval(async () => {
        try {
            //Get the pending reminders
            const pendingReminders = await (0, firebaseHandler_1.getPendingReminders)();
            if (pendingReminders.length === 0) {
                console.log("No pending reminders at this time");
                return;
            }
            for (const reminder of pendingReminders) {
                const { userDid, requestId, text, uri, cid } = reminder;
                //Sent notification to the user
                await sendReminderNotification(agent, userDid, text, uri, cid);
                //Mark the reminder as sent
                await (0, firebaseHandler_1.markReminderAsSent)(userDid, requestId);
                console.log(`Reminder ${requestId} marked as sent for user ${userDid}`);
            }
        }
        catch (error) {
            console.error("Error in reminder handler:", error);
        }
    }, 60000); //Check every 60 seconds
}
async function sendReminderNotification(agent, userDid, text, uri, cid) {
    try {
        const message = `Hey, ChronoDate here! Do you remember this post? ${uri}\n"${text}"`;
        //Publish notification in Bluesky
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
        console.log(`Reminder sent to user ${userDid}`);
    }
    catch (error) {
        console.error(`Error sending reminder to user ${userDid}`, error);
    }
}
