import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { alertService } from './src/services/alertService.js';
import { dashboardService } from './src/services/dashboardService.js';
import { aiService } from './src/services/aiService.js';

dotenv.config();

const runDebug = async () => {
    try {
        console.log("1. Connecting to DB...");
        if (!process.env.MONGODB_URI) throw new Error("Missing MONGODB_URI");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("   DB Connected.");

        console.log("\n2. Testing AI Service (Predictions)...");
        const preds = await aiService.generateDetailedPredictions();
        console.log("   Predictions OK:", JSON.stringify(preds).slice(0, 50) + "...");

        console.log("\n3. Testing Alert Service...");
        const alerts = await alertService.getActiveAlerts();
        console.log("   Alerts OK:", alerts.length, "alerts found.");

        console.log("\n4. Testing Dashboard Service (Admin Summary)...");
        const summary = await dashboardService.getAdminSummary();
        console.log("   Summary OK:", Object.keys(summary));

        console.log("\nALL CHECKS PASSED. Backend logic is sound.");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ DEBUG FAILED:", error);
        process.exit(1);
    }
};

runDebug();
