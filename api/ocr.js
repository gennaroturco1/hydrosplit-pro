export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { base64Image, promptInstruction } = req.body;
        
        // Qui il server ha accesso REALE e SICURO alla tua chiave su Vercel!
        const apiKey = process.env.GROQ_API_KEY; 

        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: [{
                    role: "user",
                    content: [
                        { type: "text", text: promptInstruction },
                        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                    ]
                }],
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                response_format: { type: "json_object" },
                temperature: 0.0
            })
        });

        const data = await groqResponse.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}