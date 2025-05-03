export async function aiDmSummary(content) {
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
                    content: `You are an AI that summarizes Twitter DMs into tweetable hot takes. 
Be unreasonably confident, slightly unhinged, and dumber than a golden retriever who just saw a squirrel. 
Each point should sound like it was typed at 3am with zero context and maximum conviction.`
                },
                {
                    role: "user",
                    content: stringContent
                }
            ],
            model: "gpt-4o-mini"
        })
    });

    const jsonResponse = await response.json();
    console.log(jsonResponse);
    return jsonResponse.response;
}
