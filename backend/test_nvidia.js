require('dotenv').config();

const nvidiaApiKey = process.env.NVIDIA_API_KEY || "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";

async function test() {
    try {
        console.log("Testing Nvidia DeepSeek API integration...");
        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${nvidiaApiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-ai/deepseek-v4-flash",
                messages: [{"role": "user", "content": "Hello, how are you?"}],
                temperature: 1,
                top_p: 0.95,
                max_tokens: 1000,
                chat_template_kwargs: {
                    thinking: true,
                    reasoning_effort: "high"
                },
                stream: false
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        console.log("Nvidia API response structure is OK.");
        
        const message = data.choices?.[0]?.message;
        const reasoning = message?.reasoning || message?.reasoning_content;
        if (reasoning) {
            console.log("\n--- Reasoning ---\n", reasoning);
        } else {
            console.log("\n(No separate reasoning content returned in choice message. Note that some API revisions merge thinking/reasoning into the content directly or under a special field)");
        }
        console.log("\n--- Content ---\n", message?.content);
    } catch (e) {
        console.error("🔴 Nvidia API call failed:", e.message);
    }
}

test();
