import { BskyAgent } from "@atproto/api";
import { getPendingReminders, markReminderAsSent } from "./firebaseHandler";

export async function handleReminders(agent: BskyAgent){
    console.log("Starting reminder handler...");

    setInterval(async () => {
        try{
            const pendingReminders = await getPendingReminders();

            if(pendingReminders.length === 0){
                console.log("No pending reminders at this time");
                return;
            }
            
            for (const reminder of pendingReminders){
                const { userHandle, requestId, text, uri, cid } = reminder;

                await sendReminderNotification(agent, userHandle, text, uri, cid);

                await markReminderAsSent(userHandle, requestId);
                console.log(`Reminder ${requestId} marked as sent for user ${userHandle}`);
            }
        }catch(error){
            console.error("Error in reminder handler:", error);
        }
            
    }, 60000); // Check every 60 seconds
}

async function sendReminderNotification(agent: BskyAgent, userHandle: string, text: string, uri: string, cid: string){
    try{
        const postId = extractPostIdFromUri(uri);
        const profileUrl = `https://bsky.app/profile/${userHandle}`;
        const postUrl = `${profileUrl}/post/${postId}`;

        const message =  `@${userHandle} Hey, ChronoDate here! Do you remember this post? ${postUrl}\n"${text}"`;

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
    }catch(error){
        console.error(`Error sending reminder to user ${userHandle}`, error);
    }
}

function extractPostIdFromUri(uri: string): string | null {
    const parts = uri.split('/');
    return parts[parts.length - 1] || null;
}
