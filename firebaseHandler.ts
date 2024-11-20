import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, child, update } from "firebase/database";
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

// Función para sanitizar las claves
function sanitizeKey(key: string): string {
    return key.replace(/[.#$[\]/:]/g, '_');
}

// Escribir un nuevo recordatorio para un usuario
export async function addReminder(userHandle: string, requestId: string, data: any): Promise<void>{
    const sanitizedUserHandle = sanitizeKey(userHandle);
    const sanitizedRequestId = sanitizeKey(requestId);
    await set(ref(database, `reminders/${sanitizedUserHandle}/${sanitizedRequestId}`), data);
}

// Verificar si el recordatorio existe
export async function reminderExists(userHandle: string, requestId: string): Promise<boolean>{
    const sanitizedUserHandle = sanitizeKey(userHandle);
    const sanitizedRequestId = sanitizeKey(requestId);
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `reminders/${sanitizedUserHandle}/${sanitizedRequestId}`));
    return snapshot.exists();
}

// Obtener los recordatorios pendientes
export async function getPendingReminders(): Promise<any[]>{
    const remindersRef = ref(database, "reminders");
    const snapshot = await get(remindersRef);
    
    if(!snapshot.exists()){
        return [];
    }

    const reminders = snapshot.val();
    const pendingReminders: any[] = [];

    // Filtrar los recordatorios pendientes
    for (const userHandle in reminders){
        for (const requestId in reminders[userHandle]){
            const reminder = reminders[userHandle][requestId];
            if(!reminder.notificationSent && reminder.timestamp <= Date.now()){
                pendingReminders.push({ userHandle, requestId, ...reminder});
            }
        }
    }
    return pendingReminders;    
}

// Marcar un recordatorio como enviado
export async function markReminderAsSent(userHandle: string, requestId: string): Promise<void>{
    const sanitizedUserHandle = sanitizeKey(userHandle);
    const sanitizedRequestId = sanitizeKey(requestId);
    const reminderRef = ref(database, `reminders/${sanitizedUserHandle}/${sanitizedRequestId}`);
    await update(reminderRef, { notificationSent: true });
}

// Contar los recordatorios activos
export async function countActiveReminders(userHandle: string): Promise<number>{
    const sanitizedUserHandle = sanitizeKey(userHandle);
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `reminders/${sanitizedUserHandle}`));

    if(!snapshot.exists()){
        return 0;
    }

    const reminders = snapshot.val();
    const activeReminders = Object.values(reminders).filter((reminder: any) => !reminder.notificationSent);
    return activeReminders.length;
}
