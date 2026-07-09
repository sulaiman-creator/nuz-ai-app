require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Anthropic } = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const { db, admin } = require('./firebase');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support large image uploads

// Serve static files from the React frontend build
app.use(express.static(path.join(__dirname, 'dist')));

// Initialize API Keys
const claudeApiKey = process.env.CLAUDE_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!claudeApiKey && !geminiApiKey) {
    console.warn("WARNING: Neither CLAUDE_API_KEY nor GEMINI_API_KEY is configured in environment variables.");
}

const getCompanyContext = () => {
    return `
COMPANY CONTEXT:
Company Name: Cloud Partners
Websites: www.cloudpartners.biz, googleapps.lk
Role: Cloud Partners is a leading premier IT solutions company based in Sri Lanka. They are top-tier authorized enterprise solutions providers.
Product/Service: This workspace (Nuz) is an elite productivity companion built by Cloud Partners for global enterprise clients, aiming to automate workflows, outline strategic goals, and dramatically boost operational efficiency.
`;
};

const SYSTEM_INSTRUCTION = `You are Nuz, an advanced AI workspace companion built by Cloud Partners.
You are incredibly smart, professional, helpful, and detail-oriented.
Keep your answers engaging, formatted beautifully with clear headers, bullet points, bold sections, and Markdown.
Do not mention model names or brands like Google, Gemini, Anthropic, or Claude unless asked directly. 
Do not mention "multi-agent", "dual-brain", "synthesis", or similar technical details. You are just Nuz.

INTEGRATION CAPABILITIES:
- You have robust local file context integration capabilities.
- If a document or image attachment is sent, process and analyze it thoroughly to give premium-quality insights.
- Always retain your exclusive Nuz identity.

GOOGLE WORKSPACE INTEGRATIONS (use live data provided in context):
- Gmail: Read, search, and summarize emails; draft professional replies.
- Google Drive: Search, list, and analyze files across the user's Drive.
- Google Docs: Read and summarize full document content.
- Google Slides: Summarize presentations and extract speaker notes.
- Google Sheets: Read spreadsheet data and perform analysis.
- Google Calendar: Show upcoming events and schedule details.
- Google Meet: Show upcoming Meet sessions with join links and attendees.
- Google Tasks: List task lists, pending tasks, due dates, and notes.
- Google Contacts: Look up contacts by name, email, phone, or organization.
- Google Forms: List recent forms, question counts, and form descriptions.
- YouTube: Search videos, provide titles, channel names, and links.

When a relevant integration is enabled and real data is provided in the context below, USE THAT REAL DATA to answer the user's question directly and specifically. Do not say you cannot access data if it has been provided.

MAPS & WEATHER INTEGRATIONS:
- You are natively integrated with Google Maps Platform and Live Weather Satellite Stream APIs.
- When the user asks for a location, map, directions, navigation, coordinates, or to see a place, you MUST provide your written description/answer AND inject an interactive map widget by outputting:
  <google-map query="Location Name, State, Country" />
  Example: <google-map query="Colombo, Sri Lanka" /> or <google-map query="Times Square, New York, NY" />.
- When the user asks about the current weather, temperature, atmosphere, or forecast of a city/location, you MUST look up/estimate the approximate latitude and longitude, provide your written commentary AND inject a live meteorological weather widget by outputting:
  <weather-widget city="City Name" lat="XX.XXXX" lon="YY.YYYY" />
  Example: <weather-widget city="London" lat="51.5074" lon="-0.1278" />.

${getCompanyContext()}
`;

const sanitizeBrandNames = (text) => {
    if (typeof text !== 'string') return text;
    return text
        .replace(/gemini/gi, 'NUZ Core')
        .replace(/claude/gi, 'NUZ Mind')
        .replace(/anthropic/gi, 'Cloud Developer')
        .replace(/generativelanguage\.googleapis\.com/gi, 'api.nuz.internal')
        .replace(/api\.anthropic\.com/gi, 'api.nuzmind.internal');
};

app.post('/api/chat', async (req, res) => {
    try {
        const { messages, attachment, systemInstruction, connectors, realData, userEmail, model: requestedModel } = req.body;
        let responseText = '';

        // B2B Firebase Firestore user session and registration tracking
        let userLicense = 'free_gemini_base';
        let isLicensed = true;
        if (userEmail) {
            const emailLower = userEmail.toLowerCase();
            const emailDomain = emailLower.split('@')[1];
            const isInternalCloudPartners = emailDomain === 'cloudpartners.biz' || emailDomain === 'googleapps.lk';

            try {
                const userRef = db.collection('users').doc(emailLower);
                const userDoc = await userRef.get();
                
                if (!userDoc.exists) {
                    const initialStatus = isInternalCloudPartners ? 'active' : 'pending';
                    const initialLicense = isInternalCloudPartners ? 'corporate_unlimited' : 'free_gemini_base';
                    
                    await userRef.set({
                        email: emailLower,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        lastActive: admin.firestore.FieldValue.serverTimestamp(),
                        chatCount: 1,
                        licenseType: initialLicense,
                        licenseStatus: initialStatus
                    });
                    
                    userLicense = initialLicense;
                    isLicensed = isInternalCloudPartners;
                    console.log(`Registered new user in Firestore: ${userEmail} (Status: ${initialStatus})`);
                } else {
                    const userData = userDoc.data();
                    userLicense = userData.licenseType || 'free_gemini_base';
                    isLicensed = isInternalCloudPartners || (userData.licenseStatus === 'active');
                    
                    await userRef.update({
                        lastActive: admin.firestore.FieldValue.serverTimestamp(),
                        chatCount: admin.firestore.FieldValue.increment(1)
                    });
                    console.log(`Updated user session for: ${userEmail} (License: ${userLicense}, Active: ${isLicensed})`);
                }
            } catch (dbErr) {
                console.warn("Firestore licensing check skipped (continuing with local sandbox mode):", dbErr.message);
                isLicensed = true; // Fallback to true in offline/local testing
            }

            // Block access for pending/inactive non-whitelisted users
            if (!isLicensed) {
                return res.status(403).json({
                    error: `License Inactive: Your Nuz AI premium workspace license for account (${emailLower}) is currently inactive or pending authorization. Please reach out to Cloud Partners Administration (sales@cloudpartners.biz) to activate your subscription.`
                });
            }
        }
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const lastMessage = messages[messages.length - 1];
        let userMessageText = lastMessage?.content || '';

        // Handle offline mockup if no API keys are supplied
        if (!claudeApiKey && !geminiApiKey) {
            return res.json({
                message: "Hello! I am Nuz. I see that your API credentials are not configured in Cloud Run. Please set CLAUDE_API_KEY or GEMINI_API_KEY in the environment variables to activate my live cognitive core!"
            });
        }

        // Build dynamic Google Workspace connector context
        let activeContext = "";
        const isDemoMode = userEmail && (userEmail.toLowerCase().includes('demo') || userEmail.toLowerCase() === 'sulaiman@cloudpartners.biz');

        if (connectors) {
            activeContext += "\n\nACTIVE GOOGLE WORKSPACE CONNECTIONS CONTEXT:\n";
            
            // ── Gmail ──────────────────────────────────────────────────────
            if (connectors.gmail) {
                activeContext += `\n[SERVICE ENABLED: GMAIL]\nAccount: ${userEmail || 'sulaiman@cloudpartners.biz'}\nStatus: Live connected and synchronized.\n`;
                const isGmailError = realData && realData.gmail && realData.gmail.error;
                const isGmailArray = realData && Array.isArray(realData.gmail);
                if (isGmailError) {
                    activeContext += `Latest Unread Mailbox Data error: ${realData.gmail.error}\n`;
                } else if (isGmailArray) {
                    activeContext += realData.gmail.length === 0 ? "No unread emails.\n" : "Latest Unread Mailbox Data:\n" + realData.gmail.map((m, i) => `${i + 1}. ${m.sender}: ${m.subject} (${m.time}) - ${m.summary}`).join('\n') + "\n";
                }
            }

            // ── Google Drive ───────────────────────────────────────────────
            if (connectors.drive) {
                activeContext += `\n[SERVICE ENABLED: GOOGLE DRIVE]\nStatus: Connected.\n`;
                const isDriveArray = realData && Array.isArray(realData.drive);
                if (isDriveArray) {
                    activeContext += "Files Found:\n" + realData.drive.map(f => {
                        let fileInfo = `- ${f.name} (${f.mimeType})`;
                        if (f.sheetsData) {
                            if (Array.isArray(f.sheetsData) && f.sheetsData.length > 0) {
                                fileInfo += `\n   [SPREADSHEET DATA]:\n${f.sheetsData.map(row => row.join(' | ')).join('\n')}`;
                            } else if (f.sheetsData.error) {
                                fileInfo += `\n   [SPREADSHEET ERROR]: ${f.sheetsData.error}`;
                            }
                        }
                        return fileInfo;
                    }).join('\n') + "\n";
                }
            }

            // ── Google Calendar ────────────────────────────────────────────
            if (connectors.calendar) {
                activeContext += `\n[SERVICE ENABLED: GOOGLE CALENDAR]\nStatus: Connected.\n`;
                const isCalendarArray = realData && Array.isArray(realData.calendar);
                if (isCalendarArray) {
                    activeContext += "Upcoming Events:\n" + realData.calendar.map(c => `- ${c.event} at ${c.time}`).join('\n') + "\n";
                }
            }

            // ── Google Docs ────────────────────────────────────────────────
            if (connectors.docs) {
                activeContext += `\n[SERVICE ENABLED: GOOGLE DOCS]\nStatus: Connected.\n`;
                const isDocsError = realData && realData.docs && realData.docs.error;
                const isDocsArray = realData && Array.isArray(realData.docs);
                if (isDocsError) {
                    activeContext += `Google Docs error: ${realData.docs.error}\n`;
                } else if (isDocsArray && realData.docs.length > 0) {
                    activeContext += "Recent Google Docs:\n" + realData.docs.map((d, i) =>
                        `${i + 1}. "${d.name}" (modified: ${d.modifiedTime})\n   Content preview: ${(d.content || '').substring(0, 500)}`
                    ).join('\n') + "\n";
                } else {
                    activeContext += "No recent Google Docs found.\n";
                }
            }

            // ── Google Slides ──────────────────────────────────────────────
            if (connectors.slides) {
                activeContext += `\n[SERVICE ENABLED: GOOGLE SLIDES]\nStatus: Connected.\n`;
                const isSlidesError = realData && realData.slides && realData.slides.error;
                const isSlidesArray = realData && Array.isArray(realData.slides);
                if (isSlidesError) {
                    activeContext += `Google Slides error: ${realData.slides.error}\n`;
                } else if (isSlidesArray && realData.slides.length > 0) {
                    activeContext += "Recent Presentations:\n" + realData.slides.map((s, i) =>
                        `${i + 1}. "${s.name}" (modified: ${s.modifiedTime})\n   Content preview: ${(s.content || '').substring(0, 400)}`
                    ).join('\n') + "\n";
                } else {
                    activeContext += "No recent presentations found.\n";
                }
            }

            // ── Google Tasks ───────────────────────────────────────────────
            if (connectors.tasks) {
                activeContext += `\n[SERVICE ENABLED: GOOGLE TASKS]\nStatus: Connected.\n`;
                const isTasksError = realData && realData.tasks && realData.tasks.error;
                const isTasksArray = realData && Array.isArray(realData.tasks);
                if (isTasksError) {
                    activeContext += `Google Tasks error: ${realData.tasks.error}\n`;
                } else if (isTasksArray && realData.tasks.length > 0) {
                    activeContext += "Task Lists:\n" + realData.tasks.map(list => {
                        const taskLines = (list.tasks || []).map(t =>
                            `  - ${t.title}${t.due ? ` (due: ${t.due})` : ''}${t.notes ? ` — ${t.notes}` : ''}`
                        ).join('\n');
                        return `📋 ${list.listName}:\n${taskLines || '  (no tasks)'}`;
                    }).join('\n') + "\n";
                } else {
                    activeContext += "No tasks found.\n";
                }
            }

            // ── Google Meet ────────────────────────────────────────────────
            if (connectors.meet) {
                activeContext += `\n[SERVICE ENABLED: GOOGLE MEET]\nStatus: Connected.\n`;
                const isMeetError = realData && realData.meet && realData.meet.error;
                const isMeetArray = realData && Array.isArray(realData.meet);
                if (isMeetError) {
                    activeContext += `Google Meet error: ${realData.meet.error}\n`;
                } else if (isMeetArray && realData.meet.length > 0) {
                    activeContext += "Upcoming Meet Sessions:\n" + realData.meet.map((m, i) =>
                        `${i + 1}. "${m.event}" at ${m.time}${m.meetLink ? ` — Join: ${m.meetLink}` : ''}${m.attendees ? ` — Attendees: ${m.attendees}` : ''}`
                    ).join('\n') + "\n";
                } else {
                    activeContext += "No upcoming Google Meet sessions found.\n";
                }
            }

            // ── Google Contacts ────────────────────────────────────────────
            if (connectors.contacts) {
                activeContext += `\n[SERVICE ENABLED: GOOGLE CONTACTS]\nStatus: Connected.\n`;
                const isContactsError = realData && realData.contacts && realData.contacts.error;
                const isContactsArray = realData && Array.isArray(realData.contacts);
                if (isContactsError) {
                    activeContext += `Google Contacts error: ${realData.contacts.error}\n`;
                } else if (isContactsArray && realData.contacts.length > 0) {
                    activeContext += `Contacts (${realData.contacts.length} loaded):\n` +
                        realData.contacts.slice(0, 30).map(c =>
                            `- ${c.name}${c.email ? ` <${c.email}>` : ''}${c.phone ? ` | ${c.phone}` : ''}${c.org ? ` | ${c.org}` : ''}`
                        ).join('\n') + "\n";
                } else {
                    activeContext += "No contacts found.\n";
                }
            }

            // ── YouTube ────────────────────────────────────────────────────
            if (connectors.youtube) {
                activeContext += `\n[SERVICE ENABLED: YOUTUBE]\nStatus: Connected.\n`;
                const isYoutubeError = realData && realData.youtube && realData.youtube.error;
                const isYoutubeArray = realData && Array.isArray(realData.youtube);
                if (isYoutubeError) {
                    activeContext += `YouTube error: ${realData.youtube.error}\n`;
                } else if (isYoutubeArray && realData.youtube.length > 0) {
                    activeContext += "YouTube Search Results:\n" + realData.youtube.map((v, i) =>
                        `${i + 1}. "${v.title}" by ${v.channel}${v.url ? ` — ${v.url}` : ''}`
                    ).join('\n') + "\n";
                } else {
                    activeContext += "No YouTube results found.\n";
                }
            }

            // ── Google Forms ───────────────────────────────────────────────
            if (connectors.forms) {
                activeContext += `\n[SERVICE ENABLED: GOOGLE FORMS]\nStatus: Connected.\n`;
                const isFormsError = realData && realData.forms && realData.forms.error;
                const isFormsArray = realData && Array.isArray(realData.forms);
                if (isFormsError) {
                    activeContext += `Google Forms error: ${realData.forms.error}\n`;
                } else if (isFormsArray && realData.forms.length > 0) {
                    activeContext += "Recent Google Forms:\n" + realData.forms.map((f, i) =>
                        `${i + 1}. "${f.title || f.name}" (${f.questionCount || 0} questions, modified: ${f.modifiedTime})${f.description ? ` — ${f.description}` : ''}`
                    ).join('\n') + "\n";
                } else {
                    activeContext += "No Google Forms found.\n";
                }
            }
        }

        const fullSystemPrompt = (systemInstruction ? `${SYSTEM_INSTRUCTION}\n\nUSER CUSTOM SYSTEM INSTRUCTIONS:\n${systemInstruction}` : SYSTEM_INSTRUCTION) + activeContext;

        let claudeError = "";
        let geminiError = "";

        // Execute Claude Core (NUZ Mind)
        const runClaude = async () => {
            if (!claudeApiKey) {
                claudeError = "Claude API Key is missing in env.";
                return false;
            }
            const sdk = new Anthropic({ apiKey: claudeApiKey });
            const claudeModels = ["claude-sonnet-4-6", "claude-3-5-sonnet-20241022", "claude-3-5-sonnet-latest"];
            
            for (const modelName of claudeModels) {
                try {
                    console.log(`Attempting Claude model: ${modelName}`);
                    let contentBlocks = [];
                    let claudeUserMessage = userMessageText;

                    if (attachment && attachment.type === 'document') {
                        claudeUserMessage = `[ATTACHED FILE: ${attachment.name}]\n${attachment.content}\n\nUser Question: ${userMessageText}`;
                    }
                    contentBlocks.push({ type: "text", text: claudeUserMessage });

                    if (attachment && attachment.type === 'image' && attachment.base64) {
                        const matches = attachment.base64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
                        if (matches && matches.length === 3) {
                            contentBlocks.push({
                                type: "image",
                                source: { type: "base64", media_type: matches[1], data: matches[2] }
                            });
                        }
                    }

                    // Robust history sanitization for Claude: ensure strictly alternating user/assistant roles,
                    // starting with user, ending with assistant, and merging consecutive identical roles.
                    const rawClaudeHistory = messages.slice(0, -1);
                    const mappedClaude = rawClaudeHistory.map(msg => ({
                        role: msg.role === 'model' ? 'assistant' : 'user',
                        content: msg.content || ''
                    })).filter(msg => msg.content.trim() !== '');

                    const sanitizedClaudeHistory = [];
                    for (const msg of mappedClaude) {
                        if (sanitizedClaudeHistory.length > 0 && sanitizedClaudeHistory[sanitizedClaudeHistory.length - 1].role === msg.role) {
                            sanitizedClaudeHistory[sanitizedClaudeHistory.length - 1].content += "\n\n" + msg.content;
                        } else {
                            sanitizedClaudeHistory.push(msg);
                        }
                    }
                    while (sanitizedClaudeHistory.length > 0 && sanitizedClaudeHistory[0].role !== 'user') {
                        sanitizedClaudeHistory.shift();
                    }
                    while (sanitizedClaudeHistory.length > 0 && sanitizedClaudeHistory[sanitizedClaudeHistory.length - 1].role !== 'assistant') {
                        sanitizedClaudeHistory.pop();
                    }
                    
                    sanitizedClaudeHistory.push({ role: "user", content: contentBlocks });

                    const responseMessage = await sdk.messages.create({
                        model: modelName,
                        max_tokens: 1500,
                        system: fullSystemPrompt,
                        messages: sanitizedClaudeHistory
                    });
                    responseText = responseMessage.content[0].text;
                    console.log(`🟢 Claude model SUCCESS: ${modelName}`);
                    return true;
                } catch (err) {
                    console.warn(`Claude model ${modelName} failed:`, err.message);
                    claudeError = err.message;
                    // Fast-fail if credentials/billing/quota issues arise
                    const errMsg = (err.message || "").toLowerCase();
                    const isBillingOrQuota = 
                        errMsg.includes('depleted') || 
                        errMsg.includes('billing') || 
                        errMsg.includes('429') || 
                        errMsg.includes('quota') || 
                        errMsg.includes('exhausted') || 
                        errMsg.includes('api key') || 
                        errMsg.includes('not valid') ||
                        errMsg.includes('invalid') ||
                        errMsg.includes('credit') ||
                        err.status === 429 ||
                        err.statusCode === 429 ||
                        err.status === 403 ||
                        err.statusCode === 403 ||
                        err.status === 401 ||
                        err.statusCode === 401;

                    if (isBillingOrQuota) {
                        console.warn("Claude API key, billing, or quota issue. Skipping other Claude models instantly.");
                        break;
                    }
                }
            }
            return false;
        };

        // Execute Gemini Core (NUZ Core)
        const runGemini = async () => {
            if (!geminiApiKey) {
                geminiError = "Gemini API Key is missing in env.";
                return false;
            }
            const genAI = new GoogleGenerativeAI(geminiApiKey);
            const geminiModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-flash-latest"];
            
            for (const modelName of geminiModels) {
                try {
                    console.log(`Attempting Gemini model: ${modelName}`);
                    const model = genAI.getGenerativeModel({
                        model: modelName,
                        systemInstruction: fullSystemPrompt
                    });

                    // Robust history sanitization for Gemini: ensure strictly alternating user/model roles,
                    // starting with user, ending with model, and merging consecutive identical roles.
                    const rawGeminiHistory = messages.slice(0, -1);
                    const mappedGemini = rawGeminiHistory.map(msg => ({
                        role: msg.role === 'model' ? 'model' : 'user',
                        parts: [{ text: msg.content || '' }]
                    })).filter(msg => msg.parts[0].text.trim() !== '');

                    const sanitizedHistory = [];
                    for (const msg of mappedGemini) {
                        if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === msg.role) {
                            sanitizedHistory[sanitizedHistory.length - 1].parts[0].text += "\n\n" + msg.parts[0].text;
                        } else {
                            sanitizedHistory.push(msg);
                        }
                    }
                    while (sanitizedHistory.length > 0 && sanitizedHistory[0].role !== 'user') {
                        sanitizedHistory.shift();
                    }
                    while (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role !== 'model') {
                        sanitizedHistory.pop();
                    }

                    const chat = model.startChat({ history: sanitizedHistory });

                    let promptParts = [userMessageText];
                    if (attachment && attachment.type === 'document') {
                        promptParts[0] = `[ATTACHED FILE: ${attachment.name}]\n${attachment.content}\n\nUser Question: ${userMessageText}`;
                    }

                    if (attachment && attachment.type === 'image' && attachment.base64) {
                        const matches = attachment.base64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
                        if (matches && matches.length === 3) {
                            promptParts.push({
                                inlineData: { data: matches[2], mimeType: matches[1] }
                            });
                        }
                    }

                    const result = await chat.sendMessage(promptParts);
                    const response = await result.response;
                    responseText = response.text();
                    console.log(`🟢 Gemini model SUCCESS: ${modelName}`);
                    return true;
                } catch (err) {
                    console.warn(`Gemini model ${modelName} failed:`, err.message);
                    geminiError = err.message;
                    // Fast-fail if credentials/billing/quota issues arise
                    const errMsg = (err.message || "").toLowerCase();
                    const isBillingOrQuota = 
                        errMsg.includes('depleted') || 
                        errMsg.includes('billing') || 
                        errMsg.includes('429') || 
                        errMsg.includes('quota') || 
                        errMsg.includes('exhausted') || 
                        errMsg.includes('api key') || 
                        errMsg.includes('not valid') ||
                        errMsg.includes('invalid') ||
                        errMsg.includes('credit') ||
                        err.status === 429 ||
                        err.statusCode === 429 ||
                        err.status === 403 ||
                        err.statusCode === 403 ||
                        err.status === 401 ||
                        err.statusCode === 401;

                    if (isBillingOrQuota) {
                        console.warn("Gemini API key, billing, or quota issue. Skipping other Gemini models instantly.");
                        break;
                    }
                }
            }
            return false;
        };

        // Dual-Engine priority flow based on user's preference
        let success = false;
        if (requestedModel === 'claude') {
            success = await runClaude();
            if (!success) {
                console.log("Claude prioritized model failed or unavailable. Falling back to Gemini...");
                success = await runGemini();
            }
        } else {
            success = await runGemini();
            if (!success) {
                console.log("Gemini prioritized model failed or unavailable. Falling back to Claude...");
                success = await runClaude();
            }
        }

        if (!success || !responseText) {
            return res.status(500).json({ 
                error: `Cognitive cores failed to respond. Claude: ${claudeError || 'Not tried'} | Gemini: ${geminiError || 'Not tried'}` 
            });
        }

        res.json({ message: sanitizeBrandNames(responseText) });

    } catch (error) {
        console.error('Error in chat core:', error);
        res.status(500).json({ error: sanitizeBrandNames(error.message) || 'Failed to generate core response' });
    }
});

// Get all conversations for a user
app.get('/api/conversations', async (req, res) => {
    try {
        const { userEmail } = req.query;
        if (!userEmail) {
            return res.status(400).json({ error: 'userEmail query parameter is required' });
        }
        const emailLower = userEmail.toLowerCase();
        const conversationsRef = db.collection('users').doc(emailLower).collection('conversations');
        const snapshot = await conversationsRef.orderBy('updatedAt', 'desc').get();
        
        const conversations = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            conversations.push({
                id: doc.id,
                title: data.title || 'Untitled Chat',
                messages: data.messages || [],
                updatedAt: data.updatedAt ? data.updatedAt.toDate() : null
            });
        });
        
        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Save or update a single conversation
app.post('/api/conversations', async (req, res) => {
    try {
        const { userEmail, conversation } = req.body;
        if (!userEmail || !conversation || !conversation.id) {
            return res.status(400).json({ error: 'userEmail and conversation object are required' });
        }
        const emailLower = userEmail.toLowerCase();
        const convRef = db.collection('users').doc(emailLower).collection('conversations').doc(conversation.id);
        
        await convRef.set({
            title: conversation.title || 'Untitled Chat',
            messages: conversation.messages || [],
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving conversation:', error);
        res.status(500).json({ error: 'Failed to save conversation' });
    }
});

// Delete a conversation (or all conversations)
app.delete('/api/conversations', async (req, res) => {
    try {
        const { userEmail, id } = req.query;
        if (!userEmail) {
            return res.status(400).json({ error: 'userEmail query parameter is required' });
        }
        const emailLower = userEmail.toLowerCase();
        
        if (id) {
            // Delete specific conversation
            const convRef = db.collection('users').doc(emailLower).collection('conversations').doc(id);
            await convRef.delete();
            res.json({ success: true });
        } else {
            // Bulk delete all conversations for this user (Purge Canvas)
            const conversationsRef = db.collection('users').doc(emailLower).collection('conversations');
            const snapshot = await conversationsRef.get();
            
            const batch = db.batch();
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            res.json({ success: true, message: 'All conversations purged' });
        }
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Nuz Workspace Backend running on port ${port}`);
});
