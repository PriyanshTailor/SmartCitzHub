import fs from 'fs';

const API_KEY = "AIzaSyBPc-Ki6YaI442EaSN4EZBVfnAKuZCg0Jo";
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

(async () => {
    try {
        const response = await fetch(URL);
        const data = await response.json();
        fs.writeFileSync('scripts/models.json', JSON.stringify(data, null, 2));
        console.log("Models saved to scripts/models.json");
    } catch (error) {
        console.error("Error:", error);
    }
})();
