const API_KEY = "AIzaSyBPc-Ki6YaI442EaSN4EZBVfnAKuZCg0Jo";
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

console.log(`Listing models via fetch from ${URL}...`);

(async () => {
    try {
        const response = await fetch(URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`HTTP Error: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error("Error Body:", errorText);
        } else {
            const data = await response.json();
            console.log("SUCCESS. Available Models:");
            if (data.models) {
                data.models.forEach(m => {
                    console.log(`- ${m.name} (${m.displayName}) - Supported methods: ${m.supportedGenerationMethods}`);
                });
            } else {
                console.log("No models returned in list.");
                console.log(JSON.stringify(data, null, 2));
            }
        }
    } catch (error) {
        console.error("Fetch Error:", error);
    }
})();
