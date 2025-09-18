"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import { addOrUpdateSkill } from "@/actions/action";
import Image from "next/image";

const skillSchema = z.object({
    name: z.string().min(1, "Skill name is required"),
    category: z.string().min(1, "Select a category"),
    imageFile: z.any().optional(), // optional for editing
});

const categories = ["Frontend", "Backend", "Programming Languages", "Databases", "Tools", "Cloud & DevOps", "Frameworks"];

type SkillFormProps = {
    skillData?: { name: string; category: string; image: string };
    skillId?: string;
};

export default function SkillForm({ skillData, skillId }: SkillFormProps) {
    const form = useForm({
        resolver: zodResolver(skillSchema),
        defaultValues: { name: skillData?.name || "", category: skillData?.category || "", imageFile: undefined },
    });

    const [preview, setPreview] = useState(skillData?.image || "");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (skillData) {
            form.reset(skillData);
            setPreview(skillData.image);
        }
    }, [skillData]);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            setPreview(URL.createObjectURL(e.target.files[0]));
        }
    }

    async function handleSkillSubmit(values: z.infer<typeof skillSchema>) {
        setLoading(true);
        setMessage("");

        try {
            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("category", values.category);
            if (values.imageFile && values.imageFile[0]) {
                formData.append("image", values.imageFile[0]);
            }

            // Call the server action directly
            const result = await addOrUpdateSkill(formData, skillId);

            if (result.success) {
                setMessage(skillId ? "Skill updated successfully!" : "Skill added successfully!");
                form.reset();
                setPreview("");
                router.refresh();
            } else {
                setMessage(result.message || "Failed to save skill");
            }
        } catch (err: unknown) {
            console.error(err);
            setMessage((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="w-full rounded-xl border border-black shadow-lg mx-auto">
            <CardHeader className="py-6">
                <CardTitle className="text-center text-2xl font-bold text-black">
                    {skillId ? "Edit Skill" : "Add New Skill"}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <form onSubmit={form.handleSubmit(handleSkillSubmit)} className="space-y-4">
                    <Input
                        type="text"
                        placeholder="Skill Name"
                        {...form.register("name")}
                        className="border-black text-black placeholder-black focus:ring-black focus:border-black"
                    />
                    <select {...form.register("category")} className="w-full border border-black text-black p-2 rounded-md focus:ring-black focus:border-black">
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
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
                            height={100}
                            unoptimized
                            src={preview}
                            alt="Preview"
                            className="mt-2 h-24 w-24 object-cover rounded-md border border-black"
                        />
                    )}
                    <Button
                        type="submit"
                        className="w-full border border-black bg-white text-black font-semibold py-3 rounded-md hover:bg-black hover:text-white transition flex justify-center items-center gap-2"
                    >
                        {loading ? <><Loader className="animate-spin" /> Saving...</> : skillId ? "Update Skill" : "Add Skill"}
                    </Button>
                </form>
                {message && <p className="text-center text-green-700 font-semibold mt-2">{message}</p>}
            </CardContent>
        </Card>
    );
}
