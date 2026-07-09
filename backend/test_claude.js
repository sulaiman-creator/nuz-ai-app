const { Anthropic } = require('@anthropic-ai/sdk');
const claudeApiKey = process.env.ANTHROPIC_API_KEY || 'YOUR_ANTHROPIC_API_KEY';

async function test() {
    const sdk = new Anthropic({ apiKey: claudeApiKey });
    const models = [
        "claude-sonnet-4-6",
        "claude-sonnet-4-5",
        "claude-3-5-sonnet-latest",
        "claude-3-5-sonnet-20241022"
    ];

    for (const m of models) {
        try {
            console.log(`Testing model: ${m}`);
            const msg = await sdk.messages.create({
                model: m,
                max_tokens: 10,
                messages: [{ role: "user", content: "Hello" }]
            });
            console.log(`🟢 SUCCESS with ${m}:`, msg.content[0].text);
            return;
        } catch (e) {
            console.log(`🔴 FAILED with ${m}:`, e.status, e.message);
        }
    }
}

test();
