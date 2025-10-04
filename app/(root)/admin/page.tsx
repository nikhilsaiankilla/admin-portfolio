// app/admin/page.tsx
export const dynamic = "force-dynamic";

import ArticleBox from "@/components/ArticleBox";
import ArticleForm from "@/components/forms/ArticleForm";
import ProjectForm from "@/components/forms/ProjectForm";
import ResumeUploadForm from "@/components/forms/ResumeUploadForm";
import SkillForm from "@/components/forms/SkillForm";
import ProjectBox from "@/components/ProjectBox";
import SignoutBtn from "@/components/SignoutBtn";
import SkillBox from "@/components/SkillBox";
import { adminDatabase } from "@/lib/firebaseAdmin";
import { Skill, Project, Article, Resume } from "@/types";
import Link from "next/link";

export default async function AdminPage() {
    // Fetch data directly from Firestore
    const skillsSnapshot = await adminDatabase.collection("skills").get();
    const skills: Skill[] = skillsSnapshot.docs.map(doc => {
        const { id, ...data } = doc.data() as Skill & { id?: string };
        return { id: doc.id, ...data };
    });

    const projectsSnapshot = await adminDatabase.collection("projects").get();
    const projects: Project[] = projectsSnapshot.docs.map(doc => {
        const { id, ...data } = doc.data() as Project & { id?: string };
        return { id: doc.id, ...data };
    });

    const articlesSnapshot = await adminDatabase.collection("articles").get();
    const articles: Article[] = articlesSnapshot.docs.map(doc => {
        const { id, ...data } = doc.data() as Article & { id?: string };
        return { id: doc.id, ...data };
    });

    const resumeSnapshot = await adminDatabase.collection("resume").get();
    const resumes: Resume[] = resumeSnapshot.docs.map(doc => {
        const { id, ...data } = doc.data() as Resume & { id?: string };
        return { id: doc.id, ...data };
    });

    // Group skills by category
    const skillsByCategory = skills.reduce((acc, skill) => {
        const category = skill.category || "Other";
        if (!acc[category]) acc[category] = [];
        acc[category].push(skill);
        return acc;
    }, {} as Record<string, Skill[]>);

    return (
        <div className="w-full min-h-screen space-y-8 p-6 bg-white text-black">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h1 className="text-3xl font-bold mb-4">Portfolio Admin Panel</h1>
                <SignoutBtn />
            </div>

            {/* Skills Section */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">Skills</h2>
                {Object.entries(skillsByCategory).length > 0 ? (
                    Object.entries(skillsByCategory).map(([category, skills]) => (
                        <div key={category} className="space-y-2">
                            <h3 className="text-xl font-semibold">{category}</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 border-2 border-black rounded-2xl p-4">
                                {skills.map((skill, index) => (
                                    <SkillBox skill={skill} key={index} />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No Skills Found</p>
                )}
            </section>

            {/* Projects Section */}
            <section className="space-y-2">
                <h2 className="text-2xl font-semibold">Projects</h2>
                {
                    projects.length > 0 ?
                        <div className="space-y-2 grid grid-cols-1 md:grid-cols-4">
                            {projects.map((project, index) => (
                                <ProjectBox key={index} project={project} />
                            ))}
                        </div>
                        :
                        "No Projects Found"
                }
                {/* <ProjectForm /> */}
            </section>

            {/* Articles Section */}
            <section className="space-y-2">
                <h2 className="text-2xl font-semibold">Articles</h2>
                {
                    articles.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {articles.map((article, index) => (
                            <ArticleBox article={article} key={index} />
                        ))}
                    </div> : "No Articles Found"
                }

                {/* <ArticleForm /> */}
            </section>

            {/* Resume Section */}
            <section className="space-y-2">
                <h2 className="text-2xl font-semibold">Resume</h2>
                {
                    resumes?.length > 0 ? <div className="space-y-2">
                        {resumes.map(resume => (
                            <>
                                <div key={resume.id} className="p-4 border border-black rounded-md">
                                    <Link href={resume.url} target="_blank" className="text-blue-600 underline">Latest Resume</Link>
                                </div>
                            </>
                        ))}
                    </div> : "No Resume Found"
                }
                <ResumeUploadForm />
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex items-center flex-col gap-5">
                    <SkillForm />
                    <ArticleForm />
                </div>
                <ProjectForm />
            </section>
        </div>
    );
}
