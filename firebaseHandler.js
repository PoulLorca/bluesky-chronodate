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
exports.addReminder = addReminder;
exports.reminderExists = reminderExists;
exports.getPendingReminders = getPendingReminders;
exports.markReminderAsSent = markReminderAsSent;
exports.countActiveReminders = countActiveReminders;
const app_1 = require("firebase/app");
const database_1 = require("firebase/database");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const firebaseConfig = {
    apiKey: process.env.FIREBASE_APIKEY,
    authDomain: process.env.FIREBASE_AUTHDOMAIN,
    databaseURL: process.env.FIREBASE_DATABASEURL,
    projectId: process.env.FIREBASE_PROJECTID,
    storageBucket: process.env.FIREBASE_STORAGEBUCKET,
    messagingSenderId: process.env.FIREBASE_MESAGINGSENDERID,
    appId: process.env.FIREBASE_APPID,
    measurementId: process.env.FIREBASE_MEASUREMENTID,
};
const app = (0, app_1.initializeApp)(firebaseConfig);
const database = (0, database_1.getDatabase)(app);
// Función para sanitizar las claves
function sanitizeKey(key) {
    return key.replace(/[.#$[\]/:]/g, '_');
}
// Escribir un nuevo recordatorio para un usuario
async function addReminder(userHandle, requestId, data) {
    const sanitizedUserHandle = sanitizeKey(userHandle);
    const sanitizedRequestId = sanitizeKey(requestId);
    await (0, database_1.set)((0, database_1.ref)(database, `reminders/${sanitizedUserHandle}/${sanitizedRequestId}`), data);
}
// Verificar si el recordatorio existe
async function reminderExists(userHandle, requestId) {
    const sanitizedUserHandle = sanitizeKey(userHandle);
    const sanitizedRequestId = sanitizeKey(requestId);
    const dbRef = (0, database_1.ref)(database);
    const snapshot = await (0, database_1.get)((0, database_1.child)(dbRef, `reminders/${sanitizedUserHandle}/${sanitizedRequestId}`));
    return snapshot.exists();
}
// Obtener los recordatorios pendientes
async function getPendingReminders() {
    const remindersRef = (0, database_1.ref)(database, "reminders");
    const snapshot = await (0, database_1.get)(remindersRef);
    if (!snapshot.exists()) {
        return [];
    }
    const reminders = snapshot.val();
    const pendingReminders = [];
    // Filtrar los recordatorios pendientes
    for (const userHandle in reminders) {
        for (const requestId in reminders[userHandle]) {
            const reminder = reminders[userHandle][requestId];
            if (!reminder.notificationSent && reminder.timestamp <= Date.now()) {
                pendingReminders.push({ userHandle, requestId, ...reminder });
            }
        }
    }
    return pendingReminders;
}
// Marcar un recordatorio como enviado
async function markReminderAsSent(userHandle, requestId) {
    const sanitizedUserHandle = sanitizeKey(userHandle);
    const sanitizedRequestId = sanitizeKey(requestId);
    const reminderRef = (0, database_1.ref)(database, `reminders/${sanitizedUserHandle}/${sanitizedRequestId}`);
    await (0, database_1.update)(reminderRef, { notificationSent: true });
}
// Contar los recordatorios activos
async function countActiveReminders(userHandle) {
    const sanitizedUserHandle = sanitizeKey(userHandle);
    const dbRef = (0, database_1.ref)(database);
    const snapshot = await (0, database_1.get)((0, database_1.child)(dbRef, `reminders/${sanitizedUserHandle}`));
    if (!snapshot.exists()) {
        return 0;
    }
    const reminders = snapshot.val();
    const activeReminders = Object.values(reminders).filter((reminder) => !reminder.notificationSent);
    return activeReminders.length;
}
