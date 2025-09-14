import { NextRequest, NextResponse } from "next/server";
import formidable from "formidable";
import cloudinary from "cloudinary";

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
    api: { bodyParser: false },
};

import { Readable } from "stream";
import { adminDatabase } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
    const form = new formidable.IncomingForm();

    // Convert NextRequest to a readable stream for formidable
    const reqBody = Buffer.from(await req.arrayBuffer());
    const stream = Readable.from(reqBody);

    // formidable expects a Node.js IncomingMessage, so we need to fake minimal properties
    (stream as any).headers = Object.fromEntries(req.headers.entries());

    const data = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
        form.parse(stream as any, (err, fields, files) => {
            if (err) reject(err);
            else resolve({ fields, files });
        });
    });

    let imageUrl = "";
    if (data.files.image) {
        const filePath = data.files.image.filepath;
        const result = await cloudinary.v2.uploader.upload(filePath);
        imageUrl = result.secure_url;
    }

    const skill = {
        name: data.fields.name,
        category: data.fields.category,
        image: imageUrl,
        createdAt: Date.now(),
    };

    // Save to Firebase
    const docRef = await adminDatabase.collection("skills").add(skill);

    return NextResponse.json({ success: true, id: docRef.id });
}
