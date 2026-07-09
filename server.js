require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { VertexAI } = require('@google-cloud/vertexai');
const path = require('path');
const { db, admin } = require('./firebase');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support large image uploads

const fs = require('fs');
// Serve static files from the React frontend build (handles both local development root dist and nested backend/dist folders)
const staticPath = fs.existsSync(path.join(__dirname, 'dist')) 
    ? path.join(__dirname, 'dist') 
    : path.join(__dirname, 'backend', 'dist');
app.use(express.static(staticPath));

// Initialize API Keys
const nvidiaApiKey = process.env.NVIDIA_API_KEY || "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";

if (!nvidiaApiKey) {
    console.warn("WARNING: NVIDIA_API_KEY is not configured in environment variables.");
}

// Initialize Vertex AI Client (Primary Engine utilizing GCP project cprnd-496814)
const vertexProject = process.env.GOOGLE_CLOUD_PROJECT || 'cprnd-496814';
const vertexLocation = process.env.GOOGLE_CLOUD_REGION || 'us-central1';
const vertexAI = new VertexAI({ project: vertexProject, location: vertexLocation });

const getCompanyContext = () => {
    return `
COMPANY CONTEXT:
Company Name: Cloud Partners
Websites: https://cloudpartners.biz, https://zohocloud.lk, https://googleapps.lk
Operational Office Address: 400, Level 2, Sri Sangaraja Mawatha, Colombo 01200, Sri Lanka
Registered Headquarters Address: Level 26, East Tower, World Trade Center, Echelon Square, Colombo 01, Sri Lanka
Official Phone/WhatsApp: +94 78 866 0055
General Email: hello@cloudpartners.biz
Sales Email: sales@cloudpartners.biz
Technical Support Email: support@cloudpartners.biz
Role: Cloud Partners is a leading premier IT solutions company based in Sri Lanka. They are top-tier authorized enterprise solutions providers.
Product/Service: This workspace (NUZ) is an elite productivity companion built by Cloud Partners for global enterprise clients, aiming to automate workflows, outline strategic goals, and dramatically boost operational efficiency.
`;
};

const SYSTEM_INSTRUCTION = `You are NUZ, an advanced AI workspace companion built by Cloud Partners.
You are incredibly smart, professional, helpful, and detail-oriented.
Keep your answers engaging, formatted beautifully with clear headers, bullet points, bold sections, and Markdown.
Do not mention model names or brands like Google, Gemini, Anthropic, or Claude unless asked directly. 
Do not mention "multi-agent", "dual-brain", "synthesis", or similar technical details. You are just NUZ.

INTEGRATION CAPABILITIES:
- You have robust local file context integration capabilities.
- If a document or image attachment is sent, process and analyze it thoroughly to give premium-quality insights.
- Always retain your exclusive NUZ identity.

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
        .replace(/gemini/gi, 'NUZ Standard')
        .replace(/claude/gi, 'NUZ Pro')
        .replace(/anthropic/gi, 'Cloud Developer')
        .replace(/generativelanguage\.googleapis\.com/gi, 'api.nuz.internal')
        .replace(/api\.anthropic\.com/gi, 'api.nuzmind.internal')
        .replace(/\bNuz\b/g, 'NUZ');
};

// ─── Local Knowledge Fallback Core ──────────────────
const runLocalKnowledgeFallback = (queryText) => {
    const q = (queryText || "").toLowerCase();
    
    // Zoho Solutions & Services
    if (q.includes("zoho") || q.includes("crm") || q.includes("creator") || q.includes("books") || q.includes("invoice") || q.includes("one")) {
        return `### 💼 Zoho Enterprise Cloud Solutions — Cloud Partners Sri Lanka

Cloud Partners is a premier **Authorized Zoho Partner** in Sri Lanka. We offer complete consulting, integration, licensing, and customization for Zoho's business applications:

*   **Zoho CRM**: Optimize your lead management, pipeline, and sales cycles.
*   **Zoho Creator**: Build bespoke low-code databases and custom enterprise applications.
*   **Zoho Books & Invoice**: Automated local accounting, tax invoices, and financial ledgers compliant with Sri Lankan corporate guidelines.
*   **Zoho One**: A comprehensive suite of 45+ integrated applications to run your entire business operation.

**Next Steps & Contact:**
Get expert consultation or request a custom demo by contacting our Zoho division at **sales@cloudpartners.biz** or visiting our dedicated portal [zohocloud.lk](https://zohocloud.lk).`;
    }

    // Google Workspace Solutions
    if (q.includes("google workspace") || q.includes("gmail") || q.includes("gsuite") || q.includes("g-suite") || q.includes("drive") || q.includes("meet") || q.includes("docs") || q.includes("sheets")) {
        return `### 🌐 Google Workspace Deployment & Licensing — Cloud Partners Sri Lanka

As a leading **Authorized Google Workspace Reseller**, Cloud Partners Sri Lanka manages seamless cloud email migrations, licensing setups, and security audits:

*   **Corporate Email & Collaboration**: Standard and custom Google Workspace subscriptions featuring professional Gmail, Google Meet, Docs, Sheets, and Slides.
*   **Cloud Storage & Security**: Secure corporate data storage on Google Drive with advanced Admin Controls and Google Vault retention.
*   **Seamless Migration**: Safe, zero-downtime mail server transition from legacy servers (cPanel, Microsoft 365, Exchange) to Google Cloud.
*   **Local Billing Support**: Pay in Sri Lankan Rupees with valid corporate invoices and complete local taxation support.

To procure or renew Google Workspace user licenses, reach out to our team at **sales@googleapps.lk** or visit [googleapps.lk](https://googleapps.lk).`;
    }

    // Pricing / cost / licenses
    if (q.includes("price") || q.includes("pricing") || q.includes("cost") || q.includes("licens") || q.includes("charge")) {
        return `### 🏷️ Licensing, Pricing, & Custom Quotations

Thank you for your pricing inquiry! Since licensing tiers are highly optimized based on team size, duration, and specific company modules, we customize packages for maximum cost-effectiveness:

1.  **Google Workspace pricing**: Standard, Business, and Enterprise plans with flexible localized invoices.
2.  **Zoho Suite licensing**: Complete Zoho One bundles with local consulting support.
3.  **NUZ Premium AI Workspace**: Dedicated enterprise whitelisting for your company.

To request a formal pricing proposal or licensing quote within minutes, drop a line to our sales division at **sales@cloudpartners.biz**.`;
    }

    // Contact details / Support / Address
    if (q.includes("contact") || q.includes("address") || q.includes("phone") || q.includes("location") || q.includes("call") || q.includes("office") || q.includes("email") || q.includes("support") || q.includes("whatsapp") || q.includes("hq") || q.includes("headquarters")) {
        return `### 📞 Contact Cloud Partners Sri Lanka

Our certified engineers and support architects are available to support your Zoho, Google Workspace, and NUZ AI implementations:

*   **Operational Office**: 400, Level 2, Sri Sangaraja Mawatha, Colombo 01200, Sri Lanka
*   **Registered Headquarters**: Level 26, East Tower, World Trade Center, Echelon Square, Colombo 01, Sri Lanka
*   **Official Phone / WhatsApp**: **+94 78 866 0055**
*   **General Inquiry Email**: **hello@cloudpartners.biz**
*   **Sales Division Email**: **sales@cloudpartners.biz**
*   **Technical Support Email**: **support@cloudpartners.biz**
*   **Online Portals**:
    *   Corporate Website: [cloudpartners.biz](https://cloudpartners.biz)
    *   Zoho Cloud: [zohocloud.lk](https://zohocloud.lk)
    *   Google Workspace: [googleapps.lk](https://googleapps.lk)
    
*   **Office Map Locator**:
    <google-map query="400 Sri Sangaraja Mawatha, Colombo, Sri Lanka" />`;
    }

    // Greetings
    if (q.includes("hi") || q.includes("hello") || q.includes("hey") || q.includes("greetings") || q.includes("who are you") || q.includes("name") || q.includes("nuz")) {
        return `### Hello! I am **NUZ**, your intelligent workspace companion. 👋

Our high-performance cognitive cloud APIs are currently undergoing brief optimization maintenance. To ensure zero disruption, I have automatically activated my **Local Resilient Core** utilizing Cloud Partners' whitelisted offline knowledge base!

How can I help you today?
*   **Google Workspace reseller services** 🌐
*   **Zoho Licensing & Customizations** 💼
*   **Cloud Partners corporate consultation** ⚙️`;
    }

    // Default Fallback
    return `### 🛡️ NUZ Resilient Offline Core Activated

Thank you for reaching out to **NUZ**. Our live cognitive cloud services are currently undergoing brief scheduled API optimization.

To ensure 100% platform uptime for Cloud Partners Sri Lanka, I have activated my **Local Resilient Core** utilizing our built-in offline trained data library!

#### I can answer queries regarding:
*   **Zoho Implementations**: Low-code databases, Zoho CRM pipelines, and books setups.
*   **Google Workspace deployments**: Business email setups, migrations, and file storage.
*   **Enterprise IT Consulting**: Tailored workflow automations.

#### Direct Resources:
*   **Operational Office**: 400, Level 2, Sri Sangaraja Mawatha, Colombo 01200, Sri Lanka
*   **Registered Headquarters**: Level 26, East Tower, World Trade Center, Echelon Square, Colombo 01, Sri Lanka
*   **Official Phone / WhatsApp**: **+94 78 866 0055**
*   **General Inquiry Email**: **hello@cloudpartners.biz**
*   **Sales Division Email**: **sales@cloudpartners.biz**
*   **Technical Support Email**: **support@cloudpartners.biz**

#### Direct Portals:
*   **Cloud Partners Portal**: [cloudpartners.biz](https://cloudpartners.biz)
*   **Zoho Cloud Sri Lanka**: [zohocloud.lk](https://zohocloud.lk)
*   **Google Workspace Hub**: [googleapps.lk](https://googleapps.lk)`;
};

// Cache for in-memory docs to achieve sub-millisecond local brain matching
const knowledgeCache = {};

// ─── Local Brain Search Helper ──────────────────
const searchLocalKnowledge = async (email, queryText) => {
    try {
        const emailLower = email.toLowerCase();
        
        let docs = [];
        const cacheEntry = knowledgeCache[emailLower];
        const cacheDuration = 24 * 60 * 60 * 1000; // 24 hours cache
        
        if (cacheEntry && (Date.now() - cacheEntry.timestamp < cacheDuration)) {
            docs = cacheEntry.docs;
        } else {
            console.log(`[Cache-Miss] Loading local knowledge from Firestore for ${emailLower}...`);
            const knowledgeRef = db.collection('users').doc(emailLower).collection('knowledge');
            const snapshot = await knowledgeRef.get();
            if (!snapshot.empty) {
                snapshot.forEach(doc => {
                    docs.push({ id: doc.id, ...doc.data() });
                });
            }
            knowledgeCache[emailLower] = {
                docs: docs,
                timestamp: Date.now()
            };
        }

        if (docs.length === 0) return [];

        const stopwords = new Set([
            'and', 'the', 'for', 'with', 'this', 'that', 'you', 'are', 'have', 'can', 'our', 'your', 
            'what', 'explain', 'about', 'from', 'their', 'there', 'they', 'them', 'not', 'but', 
            'how', 'why', 'where', 'when', 'who', 'which', 'will', 'was', 'were', 'been', 'has', 'had',
            'some', 'any', 'all', 'into', 'onto', 'upon', 'such', 'than', 'then', 'very', 'much', 'more', 'most'
        ]);

        const queryTokens = queryText.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 2 && !stopwords.has(t));

        if (queryTokens.length === 0) return [];

        const scoredDocs = docs.map(doc => {
            let score = 0;
            const docTitle = (doc.title || '').toLowerCase();
            const docContent = (doc.content || '').toLowerCase();

            queryTokens.forEach(token => {
                if (docTitle.includes(token)) score += 15;
                if (docContent.includes(token)) {
                    const regex = new RegExp('\\b' + token.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'g');
                    const count = (docContent.match(regex) || []).length;
                    score += count * 3;
                    
                    if (count === 0) {
                        score += 1; // Substring match fallback
                    }
                }
            });

            return { ...doc, score };
        });

        return scoredDocs
            .filter(d => d.score > 2)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);
    } catch (err) {
        console.error("Error searching local knowledge:", err);
        return [];
    }
};


// ─── Offline Resilient RAG Synthesizer ──────────
const synthesizeOfflineResponse = (matchedDocs, userQuery) => {
    let response = `### 🧠 NUZ Secure Local Brain (Offline Core)

Our cloud cognitive engines are currently offline/undergoing optimization, so I have successfully activated the **NUZ Resilient Offline Solver** to analyze your local trained workspace knowledge!

Here is the relevant information synthesized directly from your trained data matching your query:

`;

    matchedDocs.forEach((doc, idx) => {
        response += `#### 📁 Record #${idx + 1}: ${doc.title} (${doc.type.toUpperCase()})\n`;
        if (doc.timestamp) {
            response += `*Captured on: ${new Date(doc.timestamp).toLocaleString()}*\n`;
        }
        if (doc.url) {
            response += `*Source: [Link](${doc.url})*\n`;
        }
        response += `\n\`\`\`text\n${doc.content.substring(0, 1000)}${doc.content.length > 1000 ? '...' : ''}\n\`\`\`\n\n`;
    });

    response += `> [!NOTE]
    > This response was synthesized by NUZ's offline secure core using your trained local brain knowledge. To refresh this data, go to the **Connectors** tab.`;

    return response;
};

// ─── Local Brain Executor ──────────────────
const runLocalBrain = async (email, userMessageText) => {
    const matchedDocs = await searchLocalKnowledge(email, userMessageText);
    if (matchedDocs.length === 0) {
        return { 
            success: true, 
            text: "🔍 NUZ checked your local workspace brain, but no matching context was found.\n\nTo resolve this query, please train the NUZ Local Brain in the Connectors tab or switch to NUZ Standard/Pro to query cloud models directly." 
        };
    }

    if (!nvidiaApiKey) {
        console.log("No Nvidia API key. Synthesizing offline response from matched documents.");
        return {
            success: true,
            text: synthesizeOfflineResponse(matchedDocs, userMessageText),
            isLocal: true
        };
    }

    const contextStr = matchedDocs.map((doc, idx) => {
        return `[RECORD #${idx + 1} - TYPE: ${doc.type.toUpperCase()} - TITLE: ${doc.title}]\nContent: ${doc.content}\nTimestamp: ${doc.timestamp}\nURL: ${doc.url || 'N/A'}`;
    }).join('\n\n');

    const localSystemPrompt = `${SYSTEM_INSTRUCTION}
You are the NUZ Local Brain, executing in standalone secure mode.
You must answer the user's question STRICTLY based on the local workspace context provided below.
Do not use external knowledge or invent facts.
Provide a clear, detailed, and professional summary using the records.
If the records do not contain the answer, state that you checked the local records but could not find the answer.
Always suffix your answer with a reference list of the record numbers you used.

LOCAL WORKSPACE CONTEXT:
${contextStr}
`;

    try {
        console.log("Attempting local brain with Nvidia DeepSeek model...");
        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${nvidiaApiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-ai/deepseek-v4-flash",
                messages: [
                    { role: "system", content: localSystemPrompt },
                    { role: "user", content: userMessageText }
                ],
                temperature: 0.1,
                top_p: 0.95,
                max_tokens: 4096,
                chat_template_kwargs: {
                    thinking: true,
                    reasoning_effort: "high"
                },
                stream: false
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Nvidia API error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const message = data.choices?.[0]?.message;
        const content = message?.content || '';
        const reasoning = message?.reasoning || message?.reasoning_content || '';
        const responseText = reasoning 
            ? `<details>\n<summary>Thinking Process</summary>\n\n${reasoning}\n</details>\n\n${content}`
            : content;

        return { 
            success: true, 
            text: responseText,
            isLocal: true
        };
    } catch (err) {
        console.warn("Local brain call failed. Falling back to offline synthesis.", err.message);
        return {
            success: true,
            text: synthesizeOfflineResponse(matchedDocs, userMessageText),
            isLocal: true
        };
    }
};

// ─── Image Generation Executor ──────────────────
const runImageGen = async (userMessageText) => {
    try {
        const prompt = userMessageText.replace(/generate image|create image|draw|image of/gi, '').trim() || 'futuristic workspace';
        const seed = Math.floor(Math.random() * 100000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&nologo=true&seed=${seed}`;
        
        return {
            success: true,
            text: `Here is the visual asset I generated for your request: "${prompt}"\n\n<generated-image url="${imageUrl}" prompt="${prompt.replace(/"/g, '&quot;')}" />`
        };
    } catch (err) {
        console.error("Image generation failed:", err);
        return { success: false, text: `Visual asset generation failed: ${err.message}` };
    }
};

// ─── Local Brain Knowledge Training Endpoint ───
app.post('/api/train', async (req, res) => {
    try {
        const { userEmail, items } = req.body;
        if (!userEmail) {
            return res.status(400).json({ error: 'userEmail is required' });
        }
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'items array is required' });
        }

        const emailLower = userEmail.toLowerCase();
        const knowledgeRef = db.collection('users').doc(emailLower).collection('knowledge');

        const snapshot = await knowledgeRef.get();
        const batchSize = 100;
        let batch = db.batch();
        let count = 0;
        let operations = 0;

        for (const doc of snapshot.docs) {
            batch.delete(doc.ref);
            count++;
            operations++;
            if (operations >= batchSize) {
                await batch.commit();
                batch = db.batch();
                operations = 0;
            }
        }
        if (operations > 0) {
            await batch.commit();
        }

        console.log(`Purged ${count} old local brain knowledge entries for ${emailLower}`);

        batch = db.batch();
        operations = 0;
        let insertedCount = 0;

        for (const item of items) {
            const docId = `${item.type}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
            const docRef = knowledgeRef.doc(docId);
            batch.set(docRef, {
                type: item.type,
                title: item.title || '',
                content: item.content || '',
                timestamp: item.timestamp || new Date().toISOString(),
                url: item.url || '',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            insertedCount++;
            operations++;
            if (operations >= batchSize) {
                await batch.commit();
                batch = db.batch();
                operations = 0;
            }
        }
        if (operations > 0) {
            await batch.commit();
        }

        console.log(`Successfully trained NUZ local brain with ${insertedCount} new items for ${emailLower}`);
        // Clear user's in-memory knowledge cache
        delete knowledgeCache[emailLower];
        console.log(`Purged in-memory knowledge cache for ${emailLower}`);
        res.json({ success: true, count: insertedCount });
    } catch (error) {
        console.error('Error training local brain:', error);
        res.status(500).json({ error: error.message || 'Failed to train NUZ local brain' });
    }
});

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
                    error: `License Inactive: Your NUZ AI premium workspace license for account (${emailLower}) is currently inactive or pending authorization. Please reach out to Cloud Partners Administration (sales@cloudpartners.biz) to activate your subscription.`
                });
            }
        }
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const lastMessage = messages[messages.length - 1];
        let userMessageText = lastMessage?.content || '';
        const queryLower = userMessageText.toLowerCase();

        // ─── Image Generation Endpoint Routing ───
        if (requestedModel === 'image-gen') {
            const imgResult = await runImageGen(userMessageText);
            if (imgResult.success) {
                return res.json({ message: imgResult.text });
            } else {
                return res.status(500).json({ error: imgResult.text });
            }
        }

        // ─── Local Brain (RAG) Prioritized Routing & Auto Intercept ───
        const userSearchEmail = userEmail || 'sulaiman@cloudpartners.biz';
        const matchedDocs = await searchLocalKnowledge(userSearchEmail, userMessageText);
        const hasTrainedData = matchedDocs && matchedDocs.length > 0;
        const isWorkspaceQuery = /\b(email|emails|mail|message|messages|meeting|meetings|calendar|schedule|contact|contacts|phone|email address|doc|docs|drive|file|files|sheet|sheets|tasks|to-do|todo|youtube|video|meet)\b/i.test(queryLower);

        // Prioritize local brain if explicit local model was requested, if it's a workspace query, or if we have matching trained local knowledge in Firestore!
        const shouldRunLocal = requestedModel === 'local' || (isWorkspaceQuery && requestedModel !== 'image-gen') || hasTrainedData;

        if (shouldRunLocal && requestedModel !== 'image-gen') {
            console.log(`[Local-Brain-Match] Routing query to NUZ Local Brain (Trained Data Matches: ${hasTrainedData})`);
            const localResult = await runLocalBrain(userSearchEmail, userMessageText);
            if (localResult.success) {
                const finalMessage = `⚡ resolved-from-local-brain ⚡\n\n${localResult.text}`;
                return res.json({ message: sanitizeBrandNames(finalMessage) });
            }
        }

        // ─── Corporate Query Auto-Intercept (Fallback if not in Local Database) ───
        const isCorporateQuery = 
            /\b(zoho|crm|creator|books|invoice|zohocloud|googleapps|workspace|gsuite|g-suite|pricing|price|cost|licens|charge|contact|address|phone|whatsapp|office|headquarters|hq|sri sangaraja|echelon square|world trade center|wtc|cloud partners)\b/i.test(queryLower) ||
            (queryLower.includes("cloud") && queryLower.includes("partner"));

        if (isCorporateQuery) {
            console.log(`[Auto-Intercept] Intercepted corporate query: "${userMessageText}". Routing to NUZ Local Resilient Core.`);
            const fallbackText = runLocalKnowledgeFallback(userMessageText);
            return res.json({ message: sanitizeBrandNames(fallbackText) });
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

            // ── Google Sheets ──────────────────────────────────────────────
            if (connectors.sheets) {
                activeContext += `\n[SERVICE ENABLED: GOOGLE SHEETS]\nStatus: Connected.\n`;
                const isSheetsError = realData && realData.sheets && realData.sheets.error;
                const isSheetsArray = realData && Array.isArray(realData.sheets);
                if (isSheetsError) {
                    activeContext += `Google Sheets error: ${realData.sheets.error}\n`;
                } else if (isSheetsArray && realData.sheets.length > 0) {
                    activeContext += "Recent Google Sheets Spreadsheets:\n" + realData.sheets.map((sheet, i) => {
                        let sheetInfo = `${i + 1}. "${sheet.name}" (modified: ${sheet.modifiedTime})`;
                        if (sheet.values && Array.isArray(sheet.values) && sheet.values.length > 0) {
                            sheetInfo += `\n   Cells Content (Grid format):\n` + sheet.values.map(row => `   ` + row.join(' | ')).join('\n');
                        } else if (sheet.error) {
                            sheetInfo += `\n   [Error reading sheet values]: ${sheet.error}`;
                        } else {
                            sheetInfo += `\n   [Sheet is empty]`;
                        }
                        return sheetInfo;
                    }).join('\n') + "\n";
                } else {
                    activeContext += "No Google Sheets found.\n";
                }
            }
        }

        const fullSystemPrompt = (systemInstruction ? `${SYSTEM_INSTRUCTION}\n\nUSER CUSTOM SYSTEM INSTRUCTIONS:\n${systemInstruction}` : SYSTEM_INSTRUCTION) + activeContext;

        let nvidiaError = "";

        // Execute Nvidia Core (DeepSeek-v4-flash)
        const runNvidia = async () => {
            if (!nvidiaApiKey) {
                nvidiaError = "Nvidia API Key is missing in env.";
                return false;
            }
            try {
                console.log("Attempting Nvidia DeepSeek model: deepseek-ai/deepseek-v4-flash");
                
                const apiMessages = [];
                const rawHistory = messages.slice(0, -1);
                for (const msg of rawHistory) {
                    apiMessages.push({
                        role: msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user',
                        content: msg.content || ''
                    });
                }

                let finalUserContent = userMessageText;
                if (attachment && attachment.type === 'document') {
                    finalUserContent = `[ATTACHED FILE: ${attachment.name}]\n${attachment.content}\n\nUser Question: ${userMessageText}`;
                } else if (attachment && attachment.type === 'image') {
                    finalUserContent = `[ATTACHED IMAGE: ${attachment.name} (Image input not supported by this cognitive core)]\n\nUser Question: ${userMessageText}`;
                }
                apiMessages.push({
                    role: 'user',
                    content: finalUserContent
                });

                const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${nvidiaApiKey}`
                    },
                    body: JSON.stringify({
                        model: "deepseek-ai/deepseek-v4-flash",
                        messages: [
                            { role: "system", content: fullSystemPrompt },
                            ...apiMessages
                        ],
                        temperature: 1,
                        top_p: 0.95,
                        max_tokens: 16384,
                        chat_template_kwargs: {
                            thinking: true,
                            reasoning_effort: "high"
                        },
                        stream: false
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Nvidia API error: ${response.status} - ${errText}`);
                }

                const data = await response.json();
                const message = data.choices?.[0]?.message;
                const content = message?.content || '';
                const reasoning = message?.reasoning || message?.reasoning_content || '';
                responseText = reasoning 
                    ? `<details>\n<summary>Thinking Process</summary>\n\n${reasoning}\n</details>\n\n${content}`
                    : content;

                console.log("🟢 Nvidia model SUCCESS: deepseek-ai/deepseek-v4-flash");
                return true;
            } catch (err) {
                console.warn("Nvidia model failed:", err.message);
                nvidiaError = err.message;
                return false;
            }
        };

        // Priority flow: Vertex AI is the primary cognitive engine.
        // It falls back to Nvidia (DeepSeek) only if Vertex AI execution fails.
        let success = false;
        console.log(`[Cognitive Routing] Prioritizing Vertex AI Primary Engine (gemini-2.5-flash)...`);
        success = await runVertex();
        
        if (!success) {
            console.log("Vertex AI Primary Engine failed. Falling back to Nvidia API...");
            success = await runNvidia();
        }

        if (!success || !responseText) {
            console.warn(`[API RESILIENCE fallback]: All cloud engines failed to respond. Attempting local trained brain matching...`);
            console.warn(`Vertex error: ${vertexError} | Nvidia error: ${nvidiaError}`);
            
            try {
                const matchedDocs = await searchLocalKnowledge(userEmail || 'sulaiman@cloudpartners.biz', userMessageText);
                if (matchedDocs && matchedDocs.length > 0) {
                    responseText = synthesizeOfflineResponse(matchedDocs, userMessageText);
                } else {
                    responseText = runLocalKnowledgeFallback(userMessageText);
                }
            } catch (fallbackErr) {
                console.warn("Fallback to local knowledge search failed. Using static fallback.", fallbackErr.message);
                responseText = runLocalKnowledgeFallback(userMessageText);
            }
        }

        res.json({ message: sanitizeBrandNames(responseText) });

    } catch (error) {
        console.error('Error in chat core:', error);
        res.status(500).json({ error: sanitizeBrandNames(error.message) || 'Failed to generate core response' });
    }
});

// ─── Firestore Conversation Persistence Endpoints ───

// Fetch all conversations for a specific B2B user
app.get('/api/conversations', async (req, res) => {
    try {
        const { userEmail } = req.query;
        if (!userEmail) {
            return res.status(400).json({ error: 'userEmail query parameter is required' });
        }
        const emailLower = userEmail.toLowerCase();
        const conversations = [];
        
        try {
            const conversationsRef = db.collection('users').doc(emailLower).collection('conversations');
            const snapshot = await conversationsRef.orderBy('updatedAt', 'desc').get();
            snapshot.forEach(doc => {
                const data = doc.data();
                conversations.push({
                    id: doc.id,
                    title: data.title || 'Untitled Chat',
                    messages: data.messages || [],
                    updatedAt: data.updatedAt ? data.updatedAt.toDate() : null
                });
            });
        } catch (dbErr) {
            console.warn("Firestore fetch skipped (continuing with empty local memory stream):", dbErr.message);
        }
        
        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Save or update a specific conversation stream
app.post('/api/conversations', async (req, res) => {
    try {
        const { userEmail, conversation } = req.body;
        if (!userEmail || !conversation || !conversation.id) {
            return res.status(400).json({ error: 'userEmail and conversation object are required' });
        }
        const emailLower = userEmail.toLowerCase();
        
        try {
            const convRef = db.collection('users').doc(emailLower).collection('conversations').doc(conversation.id);
            await convRef.set({
                title: conversation.title || 'Untitled Chat',
                messages: conversation.messages || [],
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (dbErr) {
            console.warn("Firestore save skipped (continuing with local sandbox mode):", dbErr.message);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving conversation:', error);
        res.status(500).json({ error: 'Failed to save conversation' });
    }
});

// Delete a conversation (or bulk-purge all threads under canvas purge)
app.delete('/api/conversations', async (req, res) => {
    try {
        const { userEmail, id } = req.query;
        if (!userEmail) {
            return res.status(400).json({ error: 'userEmail query parameter is required' });
        }
        const emailLower = userEmail.toLowerCase();
        
        try {
            if (id) {
                // Delete one specific thread
                const convRef = db.collection('users').doc(emailLower).collection('conversations').doc(id);
                await convRef.delete();
            } else {
                // Bulk purge all threads
                const conversationsRef = db.collection('users').doc(emailLower).collection('conversations');
                const snapshot = await conversationsRef.get();
                
                const batch = db.batch();
                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
            }
        } catch (dbErr) {
            console.warn("Firestore delete skipped (continuing with local sandbox mode):", dbErr.message);
        }
        
        res.json({ success: true, message: id ? 'Conversation deleted' : 'All conversations purged' });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
});

app.get('*', (req, res) => {
    const indexPath = fs.existsSync(path.join(__dirname, 'dist', 'index.html'))
        ? path.join(__dirname, 'dist', 'index.html')
        : path.join(__dirname, 'backend', 'dist', 'index.html');
    res.sendFile(indexPath);
});

// Only start listening when run directly (not on Vercel serverless)
if (process.env.VERCEL !== '1') {
    app.listen(port, () => {
        console.log(`NUZ Workspace Backend running on port ${port}`);
    });
}

// Export for Vercel serverless function handler
module.exports = app;
