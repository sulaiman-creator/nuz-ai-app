const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Anthropic } = require('@anthropic-ai/sdk');

const geminiApiKey = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
const claudeApiKey = process.env.ANTHROPIC_API_KEY || 'YOUR_ANTHROPIC_API_KEY';

async function testGemini() {
    console.log("Testing Gemini models...");
    const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-flash-latest",
        "gemini-1.5-pro",
        "gemini-pro"
    ];

    const ai = new GoogleGenerativeAI(geminiApiKey);

    for (const modelName of modelsToTry) {
        try {
            console.log(`Trying Gemini model: ${modelName}`);
            const model = ai.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Explain how AI works in a few words");
            const response = await result.response;
            console.log(`🟢 Gemini SUCCESS with ${modelName}:`, response.text().substring(0, 100));
            return modelName;
        } catch (err) {
            console.error(`🔴 Gemini FAILED with ${modelName}:`, err.message);
        }
    }
    return null;
}

async function testClaude() {
    console.log("\nTesting Claude models...");
    const modelsToTry = [
        "claude-3-5-sonnet-20241022",
        "claude-3-5-sonnet-20240620",
        "claude-3-5-sonnet-latest",
        "claude-3-opus-20240229",
        "claude-3-haiku-20240307"
    ];

    const sdk = new Anthropic({ apiKey: claudeApiKey });

    for (const modelName of modelsToTry) {
        try {
            console.log(`Trying Claude model: ${modelName}`);
            const msg = await sdk.messages.create({
                model: modelName,
                max_tokens: 100,
                messages: [{ role: "user", content: "Hello, world" }]
            });
            console.log(`🟢 Claude SUCCESS with ${modelName}:`, msg.content[0].text);
            return modelName;
        } catch (err) {
            console.error(`🔴 Claude FAILED with ${modelName}:`, err.message);
        }
    }
    return null;
}

async function run() {
    await testGemini();
    await testClaude();
}

run();
