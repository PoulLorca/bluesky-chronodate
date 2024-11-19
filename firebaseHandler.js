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
// Write a new record for a user 
async function addReminder(userDid, requestId, data) {
    await (0, database_1.set)((0, database_1.ref)(database, `reminders/${userDid}/${requestId}`), data);
}
// Verify if the request exists 
async function reminderExists(userDid, requestId) {
    const dbRef = (0, database_1.ref)(database);
    const snapshot = await (0, database_1.get)((0, database_1.child)(dbRef, `reminders/${userDid}/${requestId}`));
    return snapshot.exists();
}
//Get the records to notify
async function getPendingReminders() {
    const remindersRef = (0, database_1.ref)(database, "reminders");
    const snapshot = await (0, database_1.get)(remindersRef);
    if (!snapshot.exists()) {
        return [];
    }
    const reminders = snapshot.val();
    const pendingReminders = [];
    //Filter the pending reminders
    for (const userDid in reminders) {
        for (const requestId in reminders[userDid]) {
            const reminder = reminders[userDid][requestId];
            if (!reminders.notificationSent && reminder.timestamp <= Date.now()) {
                pendingReminders.push({ userDid, requestId, ...reminder });
            }
        }
    }
    return pendingReminders;
}
//Mark a reminder as sent
async function markReminderAsSent(userDid, requestId) {
    const reminderRef = (0, database_1.ref)(database, `reminders/${userDid}/${requestId}`);
    await (0, database_1.update)(reminderRef, { notificationSent: true });
}
//Count active reminders
async function countActiveReminders(userDid) {
    const dbRef = (0, database_1.ref)(database);
    const snapshot = await (0, database_1.get)((0, database_1.child)(dbRef, `reminders/${userDid}`));
    if (!snapshot.exists()) {
        return 0;
    }
    const reminders = snapshot.val();
    const activeReminders = Object.values(reminders).filter((reminder) => !reminder.notificationSent);
    return activeReminders.length;
}
