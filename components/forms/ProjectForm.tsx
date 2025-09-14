"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { fetchSkills, addOrUpdateProject } from "@/actions/action";
import { Skill } from "@/types";
import MDEditor from "@uiw/react-md-editor";
import { Label } from "../ui/label";
import Image from "next/image";

const projectSchema = z.object({
    title: z.string().min(1, "Title is required"),
    problem: z.string().min(1, "Problem is required"),
    description: z.string().min(1, "Description is required"),
    skills: z.array(z.string()).optional(),
    imageFile: z.any().optional(),
    githubUrl: z.string().url().optional(),
    demoUrl: z.string().url().optional(),
    tagline: z.string().optional(),
});

type ProjectFormProps = {
    projectData?: any;
    projectId?: string;
};

export default function ProjectForm({ projectData, projectId }: ProjectFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [preview, setPreview] = useState(projectData?.image || "");
    const [allSkills, setAllSkills] = useState<Skill[]>([]);
    const [description, setDescription] = useState<string>(projectData?.description || "");

    const form = useForm({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            title: projectData?.title || "",
            problem: projectData?.problem || "",
            description: projectData?.description || "",
            skills: projectData?.skills || [],
            imageFile: undefined,
            githubUrl: projectData?.githubUrl || "",
            demoUrl: projectData?.demoUrl || "",
            tagline: projectData?.tagline || "",
        },
    });

    useEffect(() => {
        const fetchData = async () => {
            const skillsRes = await fetchSkills();
            if (skillsRes.success && skillsRes.data) setAllSkills(skillsRes.data);
        };
        fetchData();
    }, []);

    // Keep preview updated when projectData changes
    useEffect(() => {
        if (projectData?.image) setPreview(projectData.image);
    }, [projectData]);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            setPreview(URL.createObjectURL(e.target.files[0]));
        }
    }

    async function handleSubmit(values: z.infer<typeof projectSchema>) {
        setLoading(true);
        setMessage("");
        try {
            const formData = new FormData();
            formData.append("title", values.title);
            formData.append("problem", values.problem);
            formData.append("description", description);
            formData.append("skills", JSON.stringify(values.skills || []));
            formData.append("githubUrl", values.githubUrl || "");
            formData.append("demoUrl", values.demoUrl || "");
            formData.append("tagline", values.tagline || "");

            // Image handling
            if (values.imageFile && values.imageFile[0]) {
                formData.append("image", values.imageFile[0]);
            } else if (preview) {
                formData.append("existingImage", preview);
            }

            const result = await addOrUpdateProject(formData, projectId);

            if (result.success) {
                setMessage(projectId ? "Project updated!" : "Project added!");
                setDescription("")
                setPreview("")
                form.reset();
                router.refresh();
            } else {
                setMessage(result.message || "Failed to save project");
            }
        } catch (err: unknown) {
            console.error(err);
            setMessage((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="w-full max-w-5xl rounded-xl border border-black shadow-lg mx-auto">

            <CardHeader className="py-3">
                <CardTitle className="text-center text-2xl font-bold text-black">
                    {projectId ? "Edit Project" : "Add New Project"}
                </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-3 space-y-4">
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <Input
                        placeholder="Project Title"
                        {...form.register("title")}
                        className="border-black text-black placeholder-black focus:ring-black focus:border-black"
                    />
                    <Textarea
                        placeholder="Problem Statement"
                        {...form.register("problem")}
                        className="border-black text-black placeholder-black focus:ring-black focus:border-black"
                    />
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description (Markdown)</Label>
                        <div data-color-mode="light" className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                            <MDEditor
                                value={description}
                                onChange={(val) => setDescription(val || "")}
                                preview="live" // 👈 Show rendered markdown live
                                height={300}
                                className="!bg-transparent"
                                style={{
                                    border: "none",
                                    borderRadius: "0.5rem",
                                    fontSize: "0.9rem",
                                }}
                                textareaProps={{
                                    placeholder: "Write a detailed project description in markdown...",
                                    className: "p-3 text-sm",
                                }}
                                previewOptions={{
                                    disallowedElements: ["style"],
                                }}
                            />
                        </div>
                    </div>


                    {/* Skills */}
                    <div>
                        <label className="block mb-1 font-semibold">Skills</label>
                        <div className="flex flex-wrap gap-2">
                            {allSkills.map(skill => (
                                <label
                                    key={skill.id}
                                    className="flex items-center gap-1 border px-2 py-1 rounded cursor-pointer select-none"
                                >
                                    <input
                                        type="checkbox"
                                        value={skill.id}
                                        {...form.register("skills")}
                                        defaultChecked={form.getValues("skills")?.includes(skill.id)}
                                    />
                                    {skill.name}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Image */}
                    <input
                        type="file"
                        accept="image/*"
                        {...form.register("imageFile")}
                        onChange={handleFileChange}
                        className="border border-black p-2 rounded-md w-full"
                    />
                    {preview && (
                        <Image
                            width={100}
                            unoptimized
                            height={100}
                            src={preview}
                            alt="Preview"
                            className="mt-2 w-full aspect-square object-cover rounded-md border border-black"
                        />
                    )}

                    <Input
                        placeholder="GitHub URL"
                        {...form.register("githubUrl")}
                        className="border-black text-black placeholder-black focus:ring-black focus:border-black"
                    />
                    <Input
                        placeholder="Demo URL"
                        {...form.register("demoUrl")}
                        className="border-black text-black placeholder-black focus:ring-black focus:border-black"
                    />
                    <Input
                        placeholder="Tagline"
                        {...form.register("tagline")}
                        className="border-black text-black placeholder-black focus:ring-black focus:border-black"
                    />

                    <Button
                        type="submit"
                        className="w-full border border-black bg-white text-black font-semibold py-3 rounded-md hover:bg-black hover:text-white transition flex justify-center items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader className="animate-spin" /> Saving...
                            </>
                        ) : projectId ? (
                            "Update Project"
                        ) : (
                            "Add Project"
                        )}
                    </Button>
                </form>
                {message && (
                    <p className="text-center text-green-700 font-semibold mt-2">{message}</p>
                )}
            </CardContent>
        </Card>
    );
}
