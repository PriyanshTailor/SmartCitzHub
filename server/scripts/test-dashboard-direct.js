import dotenv from 'dotenv';
import { connectDB } from '../src/db.js';
import mongoose from 'mongoose';
import { dashboardService } from '../src/services/dashboardService.js';
import { alertService } from '../src/services/alertService.js';

dotenv.config();

const USER_ID = "6983088b23af251b700446f2"; // Vidz

console.log("=== TESTING DASHBOARD SERVICE ===");

(async () => {
    try {
        await connectDB();
        console.log("✅ DB Connected.");

        console.log("\n--- Testing getCitizenSummary ---");
        const summary = await dashboardService.getCitizenSummary(USER_ID);
        console.log("Summary Keys:", Object.keys(summary));

        console.log("\n--- Testing getPredictions ---");
        const predictions = await dashboardService.getPredictions();
        console.log("Predictions Result:", JSON.stringify(predictions, null, 2));

        console.log("\n--- Testing getActiveAlerts ---");
        const alerts = await alertService.getActiveAlerts(); // No location passed
        console.log("Alerts:", JSON.stringify(alerts, null, 2));

        console.log("\n✅ Dashboard Service Tests Passed!");

    } catch (error) {
        console.error("❌ Test Failed:", error);
    } finally {
        await mongoose.disconnect();
    }
})();
