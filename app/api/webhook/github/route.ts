import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";

export async function POST(req: NextRequest) {
    try {
        if (req.method !== "POST") {
            return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
        }

        let body;
        const contentType = req.headers.get("content-type");

        // ✅ Handle both JSON and URL-encoded form data
        if (contentType?.includes("application/json")) {
            body = await req.json();
        } else if (contentType?.includes("application/x-www-form-urlencoded")) {
            const rawText = await req.text();
            body = Object.fromEntries(new URLSearchParams(rawText));
            body = JSON.parse(body.payload);
        } else {
            return NextResponse.json({ message: "Unsupported Content Type" }, { status: 415 });
        }

        console.log("GitHub Webhook Payload:", body);

        // ✅ Ensure it's a push event to the `dev` branch
        if (body.ref === "refs/heads/dev") {
            const scriptPath = "/home/hubspot/deploy.sh";

            // ✅ Check if deploy.sh exists
            if (!fs.existsSync(scriptPath)) {
                return NextResponse.json({ message: "Deployment script not found" }, { status: 404 });
            }

            // ✅ Run deploy script in background
            exec(`bash ${scriptPath} &`, (error, stdout, stderr) => {
                if (error) {
                    console.error("Deployment Script Failed:", error);
                }
                console.log(`Deployment Output: ${stdout}`);
                if (stderr) console.error(`Deployment Error: ${stderr}`);
            });

            return NextResponse.json({ message: "Deployment Triggered" }, { status: 200 });
        } else {
            return NextResponse.json({ message: "Not the dev branch, ignoring" }, { status: 200 });
        }

    } catch (error) {
        console.error("❌ Error processing webhook:", error);
        return NextResponse.json({ message: "Server error", error: (error as any).message }, { status: 500 });
    }
}