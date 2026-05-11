const API_KEY = "AIzaSyBPc-Ki6YaI442EaSN4EZBVfnAKuZCg0Jo";
const MODEL_NAME = "gemini-1.5-flash";
const URL = `https://generativelanguage.googleapis.com/v1/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

console.log(`Testing ${MODEL_NAME} via fetch...`);

(async () => {
    try {
        const response = await fetch(URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Explain how AI works in one sentence." }]
                }]
            })
        });

        if (!response.ok) {
            console.error(`HTTP Error: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error("Error Body:", errorText);
        } else {
            const data = await response.json();
            console.log("SUCCESS:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Fetch Error:", error);
    }
})();
