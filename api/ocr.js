export default async function handler(req, res) {
    // 1. Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { base64Image } = req.body;
        
        if (!base64Image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        // 2. Grab your Google API Key from Vercel Environment Variables
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Google API key is missing on Vercel' });
        }

        // 3. The exact Google Cloud Vision URL
        const googleVisionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

        // 4. Prepare the package for Google (DOCUMENT_TEXT_DETECTION is best for bills)
        const payload = {
            requests: [
                {
                    image: {
                        content: base64Image
                    },
                    features: [
                        {
                            type: "DOCUMENT_TEXT_DETECTION" 
                        }
                    ]
                }
            ]
        };

        // 5. Send it to Google
        const response = await fetch(googleVisionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // 6. If Google gets mad (e.g., wrong API key), tell our app gracefully
        if (data.error) {
            return res.status(400).json({ 
                error: data.error.message || 'Google Vision API Error', 
                details: data.error 
            });
        }

        // 7. Extract the raw text from Google's response
        const text = data.responses[0]?.fullTextAnnotation?.text || '';

        // 8. Send it back to app.js!
        return res.status(200).json({ text: text });

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}