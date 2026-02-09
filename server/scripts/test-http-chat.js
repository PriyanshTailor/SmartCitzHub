import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const PORT = 4000; // Assuming 4000 based on vite.config.js proxy
const BASE_URL = `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Generate a valid mock token
const token = jwt.sign(
    {
        sub: "6983088b23af251b700446f2", // Vidz ID
        email: "dhiiv311004@gmail.com",
        user_type: "citizen",
        full_name: "Vidz"
    },
    JWT_SECRET,
    { expiresIn: '1h' }
);

console.log(`Testing Chat API at ${BASE_URL}/api/chat...`);

(async () => {
    try {
        const response = await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message: "hello" })
        });

        console.log(`Status Code: ${response.status}`);

        const text = await response.text();
        console.log("Response Body:", text);

        if (!response.ok) {
            console.error("❌ HTTP Request Failed");
        } else {
            console.log("✅ HTTP Request Success! Backend is reachable via network.");
        }

    } catch (error) {
        console.error("❌ Network Error:", error.message);
        if (error.cause) console.error("Cause:", error.cause);
    }
})();
