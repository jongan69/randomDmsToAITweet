const SYSTEM_PROMPT = `You are an AI that summarizes Twitter DMs into tweetable hot takes. 
Be unreasonably confident, slightly unhinged, and dumber than a golden retriever who just saw a squirrel. 
Each point should sound like it was typed at 3am with zero context and maximum conviction.`;

async function getModels() {
    const response = await fetch("https://aiapi-tno8.onrender.com/models/");
    const jsonResponse = await response.json();
    return jsonResponse.models;
}

function getRandomModel(models, triedModels) {
    const availableModels = models.filter(model => !triedModels.has(model));
    if (availableModels.length === 0) return null;
    return availableModels[Math.floor(Math.random() * availableModels.length)];
}

// Check for refusal responses
function isRefusal(response) {
    const refusalPhrases = [
        "I can't create content that promotes hate speech",
        "I'm sorry, but I can't",
        "As an AI language model",
        "I cannot assist with that request",
        "Is there anything else I can help you with?"
    ];
    return refusalPhrases.some(phrase => response && response.includes(phrase));
}

export async function aiDmSummary(content) {
    let lastError;
    const triedModels = new Set();
    const AI_MODELS = await getModels();
    for (let i = 0; i < AI_MODELS.length; i++) {
        const model = getRandomModel(AI_MODELS, triedModels);
        if (!model) break; // No more models to try
        triedModels.add(model);
        try {
            const stringContent = content.join('\n');
            const response = await fetch("https://aiapi-tno8.onrender.com/chat/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "system",
                            content: SYSTEM_PROMPT
                        },
                        {
                            role: "user",
                            content: stringContent
                        }
                    ],
                    model: model
                })
            });

            const jsonResponse = await response.json();
            if (jsonResponse.error) {
                lastError = new Error(jsonResponse.error);
                console.log(`Error with model ${model}`);
                continue; // Try next model
            }

            if (isRefusal(jsonResponse.response)) {
                lastError = new Error("Model refused to summarize content.");
                console.log(`Refusal from model ${model}`);
                continue; // Try next model
            }
            console.log(`Success with model ${model}`);
            return jsonResponse.response;
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError;
}
