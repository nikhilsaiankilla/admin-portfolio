"use server";

import cloudinary from "cloudinary";
import { Readable } from "stream";
import { adminAuth, adminDatabase } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { Skill } from "@/types";

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function userSignOut() {
    try {
        // Access the cookie store
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("token")?.value;

        if (sessionCookie) {
            // Optionally verify and revoke the session cookie using Firebase Admin SDK
            await adminAuth.verifySessionCookie(sessionCookie, true);
            cookieStore.delete("token");
            cookieStore.delete("userId");
        }

        // Return success response
        return { success: true, status: 200, message: 'Signed out successfully' };
    } catch (error: unknown) {
        // Handle any errors that occur during sign-out
        return {
            success: false,
            status: 500,
            message: 'Something went wrong'
        };
    }
}

export async function addOrUpdateSkill(formData: FormData, skillId?: string) {
    try {
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('token');
        const token = tokenCookie?.value;
        if (!token) {
            throw new Error("Unauthorized: No token found");
        }

        const decoded = await adminAuth.verifySessionCookie(token, true);
        if (decoded.email !== "nikhilsaiankilla@gmail.com") {
            throw new Error("Unauthorized: Invalid user");
        }

        // Extract fields and file from FormData
        const name = formData.get("name")?.toString() || "";
        const category = formData.get("category")?.toString() || "";
        const imageFile = formData.get("image") as File | null;

        if (!name || !category) {
            throw new Error("Name and category are required");
        }

        let imageUrl = "";

        if (imageFile) {
            // Convert File to Buffer to upload to Cloudinary
            const arrayBuffer = await imageFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Use a readable stream for Cloudinary
            const stream = Readable.from(buffer);
            const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
                const uploadStream = cloudinary.v2.uploader.upload_stream(
                    { folder: "portfolio/skills" },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result as any);
                    }
                );
                stream.pipe(uploadStream);
            });

            imageUrl = result.secure_url;
        }

        const skillData = {
            name,
            category,
            ...(imageUrl && { image: imageUrl }),
            updatedAt: Date.now(),
        };

        let docRef;
        if (skillId) {
            // Update existing skill
            docRef = adminDatabase.collection("skills").doc(skillId);
            await docRef.update(skillData);
        } else {
            // Add new skill
            docRef = await adminDatabase.collection("skills").add({
                ...skillData,
                createdAt: Date.now(),
            });
        }

        return { success: true, id: skillId || docRef.id };
    } catch (err: unknown) {
        console.error(err);
        return { success: false, message: (err as Error).message };
    }
}

export async function deleteSkill(id: string) {
    try {
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('token');
        const token = tokenCookie?.value;
        if (!token) {
            throw new Error("Unauthorized: No token found");
        }

        const decoded = await adminAuth.verifySessionCookie(token, true);
        if (decoded.email !== "nikhilsaiankilla@gmail.com") {
            throw new Error("Unauthorized: Invalid user");
        }

        if (!id) {
            return { success: false, message: "Skill id is missing brooo" };
        }

        const skillref = adminDatabase.collection('skills').doc(id)

        if (!skillref) {
            return { success: false, message: 'Skill not found' };
        }

        await skillref.delete();

        return { success: true, message: 'Skills Deleted successfully' };
    } catch (err: unknown) {
        console.error(err);
        return { success: false, message: (err as Error).message };
    }
}

export async function fetchSkills() {
    try {
        const skillsSnapshot = await adminDatabase.collection("skills").get();
        const skills: Skill[] = skillsSnapshot.docs.map(doc => {
            const { id, ...data } = doc.data() as Skill & { id?: string };
            return { id: doc.id, ...data };
        });

        return { success: true, message: 'Fetched Skills successfully', data: skills };
    } catch (err: unknown) {
        console.error(err);
        return { success: false, message: (err as Error).message };
    }
}

export async function addOrUpdateProject(formData: FormData, projectId?: string) {
    try {
        // --- Authentication ---
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get("token");
        const token = tokenCookie?.value;
        if (!token) throw new Error("Unauthorized: No token found");

        const decoded = await adminAuth.verifySessionCookie(token, true);
        if (decoded.email !== "nikhilsaiankilla@gmail.com") {
            throw new Error("Unauthorized: Invalid user");
        }

        // --- Extract fields ---
        const title = formData.get("title")?.toString() || "";
        const problem = formData.get("problem")?.toString() || "";
        const description = formData.get("description")?.toString() || "";
        const skills = JSON.parse(formData.get("skills")?.toString() || "[]");
        const githubUrl = formData.get("githubUrl")?.toString() || "";
        const demoUrl = formData.get("demoUrl")?.toString() || "";
        const tagline = formData.get("tagline")?.toString() || "";
        const existingImage = formData.get("existingImage")?.toString() || "";
        const imageFile = formData.get("image") as File | null;

        if (!title || !problem || !description) {
            throw new Error("Title, Problem, and Description are required");
        }

        // --- Upload new image if provided ---
        let imageUrl = existingImage; // keep existing image if no new file
        if (imageFile) {
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const stream = Readable.from(buffer);
            const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
                const uploadStream = cloudinary.v2.uploader.upload_stream(
                    { folder: "portfolio/projects" },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result as any);
                    }
                );
                stream.pipe(uploadStream);
            });
            imageUrl = result.secure_url;
        }

        const projectData = {
            title,
            problem,
            description,
            skills,
            githubUrl,
            demoUrl,
            tagline,
            ...(imageUrl && { image: imageUrl }),
            updatedAt: Date.now(),
        };

        let docRef;
        if (projectId) {
            // Update existing project
            docRef = adminDatabase.collection("projects").doc(projectId);
            await docRef.update(projectData);
        } else {
            // Add new project
            docRef = await adminDatabase.collection("projects").add({
                ...projectData,
                createdAt: Date.now(),
            });
        }

        return { success: true, id: projectId || docRef.id };
    } catch (err: unknown) {
        console.error(err);
        return { success: false, message: (err as Error).message };
    }
}

export async function deleteProject(id: string) {
    try {
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('token');
        const token = tokenCookie?.value;
        if (!token) {
            throw new Error("Unauthorized: No token found");
        }

        const decoded = await adminAuth.verifySessionCookie(token, true);
        if (decoded.email !== "nikhilsaiankilla@gmail.com") {
            throw new Error("Unauthorized: Invalid user");
        }

        if (!id) {
            return { success: false, message: "Project id is missing brooo" };
        }

        const projectref = adminDatabase.collection('projects').doc(id)

        if (!projectref) {
            return { success: false, message: 'Project not found' };
        }

        await projectref.delete();

        return { success: true, message: 'Project Deleted successfully' };
    } catch (err: unknown) {
        console.error(err);
        return { success: false, message: (err as Error).message };
    }
}

export async function addOrUpdateArticle(formData: FormData, articleId?: string) {
    try {
        // --- Authentication ---
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get("token");
        const token = tokenCookie?.value;
        if (!token) throw new Error("Unauthorized: No token found");

        const decoded = await adminAuth.verifySessionCookie(token, true);
        if (decoded.email !== "nikhilsaiankilla@gmail.com") {
            throw new Error("Unauthorized: Invalid user");
        }

        // --- Extract fields ---
        const title = formData.get("title")?.toString() || "";
        const tagline = formData.get("tagline")?.toString() || "";
        const existingImage = formData.get("existingImage")?.toString() || "";
        const imageFile = formData.get("image") as File | null;
        const description = formData.get('description')?.toString() || "";

        if (!title) throw new Error("Title is required");

        // --- Upload new image if provided ---
        let imageUrl = existingImage;
        if (imageFile) {
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const stream = Readable.from(buffer);
            const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
                const uploadStream = cloudinary.v2.uploader.upload_stream(
                    { folder: "portfolio/articles" }, // 👈 different folder for articles
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result as any);
                    }
                );
                stream.pipe(uploadStream);
            });
            imageUrl = result.secure_url;
        }

        const articleData = {
            title,
            tagline,
            description,
            ...(imageUrl && { image: imageUrl }),
            updatedAt: Date.now(),
        };

        let docRef;
        if (articleId) {
            // Update existing article
            docRef = adminDatabase.collection("articles").doc(articleId);
            await docRef.update(articleData);
        } else {
            // Add new article
            docRef = await adminDatabase.collection("articles").add({
                ...articleData,
                createdAt: Date.now(),
            });
        }

        return { success: true, id: articleId || docRef.id };
    } catch (err: unknown) {
        console.error(err);
        return { success: false, message: (err as Error).message };
    }
}

export async function deleteArticle(id: string) {
    try {
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('token');
        const token = tokenCookie?.value;
        if (!token) {
            throw new Error("Unauthorized: No token found");
        }

        const decoded = await adminAuth.verifySessionCookie(token, true);
        if (decoded.email !== "nikhilsaiankilla@gmail.com") {
            throw new Error("Unauthorized: Invalid user");
        }

        if (!id) {
            return { success: false, message: "article id is missing brooo" };
        }

        const projectref = adminDatabase.collection('articles').doc(id)

        if (!projectref) {
            return { success: false, message: 'article not found' };
        }

        await projectref.delete();

        return { success: true, message: 'article Deleted successfully' };
    } catch (err: unknown) {
        console.error(err);
        return { success: false, message: (err as Error).message };
    }
}