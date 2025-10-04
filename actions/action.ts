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

export async function addOrUpdateResume(formData: FormData) {
    try {
        // --- Authentication ---
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('token');
        const token = tokenCookie?.value;
        if (!token) throw new Error("Unauthorized: No token found");

        const decoded = await adminAuth.verifySessionCookie(token, true);
        if (decoded.email !== "nikhilsaiankilla@gmail.com") {
            throw new Error("Unauthorized: Invalid user");
        }

        // --- Extract file from FormData ---
        const resumeFile = formData.get("resume") as File | null;
        if (!resumeFile) throw new Error("No resume file provided");

        // --- Check if a resume already exists ---
        const resumeCollection = adminDatabase.collection("resume");
        const existingDocs = await resumeCollection.get();
        let oldResumeUrl: string | null = null;
        let docId: string | null = null;

        if (!existingDocs.empty) {
            const doc = existingDocs.docs[0];
            oldResumeUrl = doc.data().url || null;
            docId = doc.id;
        }

        // --- Delete old resume from Cloudinary if exists ---
        if (oldResumeUrl) {
            const match = oldResumeUrl.match(/\/portfolio\/resume\/([^/.]+)/);
            if (match) {
                const publicId = `portfolio/resume/${match[1]}`;
                cloudinary.v2.uploader.destroy(publicId, (err, result) => {
                    if (err) console.error("Failed to delete old resume:", err);
                    else console.log("Old resume deleted:", result);
                });
            }
        }

        // --- Upload new resume ---
        const buffer = Buffer.from(await resumeFile.arrayBuffer());
        const stream = Readable.from(buffer);

        const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
            const uploadStream = cloudinary.v2.uploader.upload_stream(
                {
                    folder: "portfolio/resume",
                    resource_type: "image", // <-- Use 'image'
                    format: "pdf"
                }, (error, result) => {
                    if (error) reject(error);
                    // Cloudinary's result object will now be available here
                    else resolve(result as any);
                }
            );
            stream.pipe(uploadStream);
        });
        // The result.secure_url should now contain the .pdf extension.

        const resumeUrl = result.secure_url;

        // --- Save/update Firestore ---
        if (docId) {
            await resumeCollection.doc(docId).update({
                url: resumeUrl,
                updatedAt: Date.now(),
            });
        } else {
            await resumeCollection.add({
                url: resumeUrl,
                createdAt: Date.now(),
            });
        }

        return { success: true, url: resumeUrl };
    } catch (err: unknown) {
        console.error(err);
        return { success: false, message: (err as Error).message };
    }
}

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
        // --- Authentication ---
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('token');
        const token = tokenCookie?.value;
        if (!token) throw new Error("Unauthorized: No token found");

        const decoded = await adminAuth.verifySessionCookie(token, true);
        if (decoded.email !== "nikhilsaiankilla@gmail.com") {
            throw new Error("Unauthorized: Invalid user");
        }

        // --- Extract fields ---
        const name = formData.get("name")?.toString() || "";
        const category = formData.get("category")?.toString() || "";
        const existingImage = formData.get("existingImage")?.toString() || "";
        const imageFile = formData.get("image") as File | null;

        if (!name || !category) throw new Error("Name and category are required");

        // --- Upload new image if provided ---
        let imageUrl = existingImage;
        let oldImagePublicId: string | null = null;

        if (imageFile) {
            // Extract Cloudinary public_id from existing image URL
            if (existingImage) {
                const match = existingImage.match(/\/portfolio\/skills\/([^/.]+)/);
                if (match) oldImagePublicId = `portfolio/skills/${match[1]}`;
            }

            const buffer = Buffer.from(await imageFile.arrayBuffer());
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

            // Delete old image after successful upload
            if (oldImagePublicId) {
                cloudinary.v2.uploader.destroy(oldImagePublicId, (error, result) => {
                    if (error) console.error("❌ Failed to delete old skill image:", error);
                    else console.log("🧹 Old skill image deleted:", result);
                });
            }
        }

        // --- Build skill data ---
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

        const docSnap = await skillref.get();
        const skillData = docSnap.data();

        // --- Delete old image from Cloudinary if exists ---
        if (skillData?.image) {
            const match = skillData.image.match(/\/portfolio\/skills\/([^/.]+)/);
            if (match) {
                const publicId = `portfolio/skills/${match[1]}`;
                cloudinary.v2.uploader.destroy(publicId, (error, result) => {
                    if (error) console.error("❌ Failed to delete Cloudinary image:", error);
                    else console.log("🧹 Cloudinary image deleted:", result);
                });
            }
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
        let imageUrl = existingImage;
        let oldImagePublicId: string | null = null;

        if (imageFile) {
            // Extract public_id from existing image URL (if any)
            if (existingImage) {
                const match = existingImage.match(/\/portfolio\/projects\/([^/.]+)/);
                if (match) oldImagePublicId = `portfolio/projects/${match[1]}`;
            }

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

            // Delete old image after successful upload
            if (oldImagePublicId) {
                cloudinary.v2.uploader.destroy(oldImagePublicId, (error, result) => {
                    if (error) console.error("❌ Failed to delete old image:", error);
                    else console.log("🧹 Old image deleted:", result);
                });
            }
        }

        // --- Prepare project data ---
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
            docRef = adminDatabase.collection("projects").doc(projectId);
            await docRef.update(projectData);
        } else {
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

        const docSnap = await projectref.get();
        const skillData = docSnap.data();

        // --- Delete old image from Cloudinary if exists ---
        if (skillData?.image) {
            const match = skillData.image.match(/\/portfolio\/skills\/([^/.]+)/);
            if (match) {
                const publicId = `portfolio/projects/${match[1]}`;
                cloudinary.v2.uploader.destroy(publicId, (error, result) => {
                    if (error) console.error("❌ Failed to delete Cloudinary image:", error);
                    else console.log("🧹 Cloudinary image deleted:", result);
                });
            }
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
        const description = formData.get("description")?.toString() || "";

        if (!title) throw new Error("Title is required");

        // --- Upload new image if provided ---
        let imageUrl = existingImage;
        let oldImagePublicId: string | null = null;

        if (imageFile) {
            // Extract public_id from existing image URL
            if (existingImage) {
                const match = existingImage.match(/\/portfolio\/articles\/([^/.]+)/);
                if (match) oldImagePublicId = `portfolio/articles/${match[1]}`;
            }

            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const stream = Readable.from(buffer);

            const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
                const uploadStream = cloudinary.v2.uploader.upload_stream(
                    { folder: "portfolio/articles" },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result as any);
                    }
                );
                stream.pipe(uploadStream);
            });

            imageUrl = result.secure_url;

            // Delete old image after successful upload
            if (oldImagePublicId) {
                cloudinary.v2.uploader.destroy(oldImagePublicId, (error, result) => {
                    if (error) console.error("❌ Failed to delete old image:", error);
                    else console.log("🧹 Old image deleted:", result);
                });
            }
        }

        // --- Build article data ---
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

        const docSnap = await projectref.get();
        const skillData = docSnap.data();

        // --- Delete old image from Cloudinary if exists ---
        if (skillData?.image) {
            const match = skillData.image.match(/\/portfolio\/skills\/([^/.]+)/);
            if (match) {
                const publicId = `portfolio/articles/${match[1]}`;
                cloudinary.v2.uploader.destroy(publicId, (error, result) => {
                    if (error) console.error("❌ Failed to delete Cloudinary image:", error);
                    else console.log("🧹 Cloudinary image deleted:", result);
                });
            }
        }

        await projectref.delete();

        return { success: true, message: 'article Deleted successfully' };
    } catch (err: unknown) {
        console.error(err);
        return { success: false, message: (err as Error).message };
    }
}