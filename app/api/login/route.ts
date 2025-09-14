// app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    const { idToken } = await req.json();

    try {
        const decoded = await adminAuth.verifyIdToken(idToken);

        // Only allow your email
        if (decoded.email !== "nikhilsaiankilla@gmail.com") {
            return NextResponse.json({ success: false, message: "Unauthorized" });
        }

        const cookieStore = await cookies();
        const expiresIn = 24 * 60 * 60 * 1000;

        // Create a session cookie from the ID token
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        // Set cookie options
        cookieStore.set({
            name: "token",
            value: sessionCookie,
            httpOnly: true,      // not accessible from JS
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24, // 1 day in seconds
        });

        return NextResponse.json({ success: true, token: sessionCookie });
    } catch (err) {
        return NextResponse.json({ success: false, message: "Invalid token" });
    }
}
