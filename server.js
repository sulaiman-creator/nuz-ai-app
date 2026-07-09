const express = require('express');
const { Firestore } = require('@google-cloud/firestore');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firestore for project cprnd-496814
const firestore = new Firestore({
  projectId: 'cprnd-496814',
});

// Google API Scopes for Connectors (Drive, Sheets, Profile)
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets'
];

// NUZ AI System Prompt with Cloud Partners knowledge
const SYSTEM_PROMPT = `
You are Nuz, a premium AI productivity companion for Cloud Partners.
Your primary user is Sulaiman Hassan (sulaiman@cloudpartners.biz).

CRITICAL COMPANY KNOWLEDGE:
Cloud Partners has 3 official websites:
1. www.cloudpartners.biz (Main Corporate Site)
2. www.zohocloud.lk (Zoho Cloud Solutions & Integrations)
3. www.googleapps.lk (Google Workspace & Cloud Infrastructure)

When answering queries related to services, dynamically reference the appropriate website.
`;

// Save conversation to Firestore
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, role, content } = req.body;
    const chatRef = firestore.collection('users').doc(userId).collection('conversations');
    await chatRef.add({
      role: role,
      content: content,
      timestamp: Firestore.FieldValue.serverTimestamp()
    });
    res.status(200).send({ success: true, message: 'Message saved to Google Cloud Firestore.' });
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    res.status(500).send({ error: 'Failed to save conversation.' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Nuz AI Backend running on port ${PORT}`);
});