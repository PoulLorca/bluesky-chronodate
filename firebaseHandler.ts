import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, child, update, remove, query, orderByChild, equalTo } from "firebase/database";
import * as dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.FIREBASE_APIKEY!,
    authDomain: process.env.FIREBASE_AUTHDOMAIN!,
    databaseURL: process.env.FIREBASE_DATABASEURL!,
    projectId: process.env.FIREBASE_PROJECTID!,
    storageBucket: process.env.FIREBASE_STORAGEBUCKET!,
    messagingSenderId: process.env.FIREBASE_MESAGINGSENDERID!,
    appId: process.env.FIREBASE_APPID!,
    measurementId: process.env.FIREBASE_MEASUREMENTID!,
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);


// Write a new record for a user 
export async function addReminder(userDid: string, requestId: string, data: any): Promise<void>{
    await set(ref(database, `reminders/${userDid}/${requestId}`), data);
}


// Verify if the request exists 
export async function reminderExists(userDid: string, requestId: string): Promise<boolean>{
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `reminders/${userDid}/${requestId}`));
    return snapshot.exists();
}

//Get the records to notify
export async function getPendingReminders(): Promise<any[]>{
    const remindersRef = ref(database, "reminders");
    const snapshot = await get(remindersRef);
    
    if(!snapshot.exists()){
        return [];
    }

    const reminders = snapshot.val();
    const pendingReminders: any[] = [];

    //Filter the pending reminders
    for (const userDid in reminders){
        for (const requestId in reminders[userDid]){
            const reminder = reminders[userDid][requestId];
            if(!reminders.notificationSent && reminder.timestamp <= Date.now()){
                pendingReminders.push({ userDid, requestId, ...reminder});
            }
        }
    }
    return pendingReminders;    
}

//Mark a reminder as sent
export async function markReminderAsSent(userDid: string, requestId: string): Promise<void>{
    const reminderRef = ref(database, `reminders/${userDid}/${requestId}`);
    await update(reminderRef, { notificationSent: true });
}

//Count active reminders
export async function countActiveReminders(userDid: string): Promise<number>{
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `reminders/${userDid}`));

    if(!snapshot.exists()){
        return 0;
    }

    const reminders = snapshot.val();
    const activeReminders = Object.values(reminders).filter((reminder: any) => !reminder.notificationSent);
    return activeReminders.length;
}


