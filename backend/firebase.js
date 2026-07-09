const { initializeApp, getApps, getApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

let app;
if (!getApps() || getApps().length === 0) {
    try {
        app = initializeApp({
            projectId: 'cprnd-496814'
        });
    } catch (e) {
        console.warn("Firebase Admin already initialized or failed to initialize:", e.message);
    }
} else {
    app = getApp();
}

const db = getFirestore(app);

// Keep compatibility with server.js's admin.firestore.FieldValue
const adminCompatibility = {
    firestore: {
        FieldValue: FieldValue
    }
};

module.exports = { db, admin: adminCompatibility };
