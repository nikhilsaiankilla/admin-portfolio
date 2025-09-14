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
import { Label } from "../ui/label";
import { addOrUpdateArticle } from "@/actions/action";
import { Article } from "@/types";
import MDEditor from "@uiw/react-md-editor";
import Image from "next/image";

const articleSchema = z.object({
    title: z.string().min(1, "Title is required"),
    tagline: z.string().optional(),
    imageFile: z.any().optional(),
    description: z.string().optional(),
});

type ArticleFormProps = {
    articleData?: Article;
    articleId?: string;
};

export default function ArticleForm({ articleData, articleId }: ArticleFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [preview, setPreview] = useState(articleData?.image || "");
    const [description, setDescription] = useState<string>(articleData?.description || "");

    const form = useForm({
        resolver: zodResolver(articleSchema),
        defaultValues: {
            title: articleData?.title || "",
            tagline: articleData?.tagline || "",
            imageFile: undefined,
            description: articleData?.description || "",
        },
    });

    useEffect(() => {
        if (articleData?.image) setPreview(articleData.image);
    }, [articleData]);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            setPreview(URL.createObjectURL(e.target.files[0]));
        }
    }

    async function handleSubmit(values: z.infer<typeof articleSchema>) {
        setLoading(true);
        setMessage("");
        try {
            const formData = new FormData();
            formData.append("title", values.title);
            formData.append("tagline", values.tagline || "");
            formData.append('description', description)

            // Image handling
            if (values.imageFile && values.imageFile[0]) {
                formData.append("image", values.imageFile[0]);
            } else if (preview) {
                formData.append("existingImage", preview);
            }

            const result = await addOrUpdateArticle(formData, articleId);

            if (result.success) {
                setMessage(articleId ? "Article updated!" : "Article added!");
                form.reset();
                setDescription("")
                setPreview("")
                router.refresh();
            } else {
                setMessage(result.message || "Failed to save article");
            }
        } catch (err: unknown) {
            console.error(err);
            setMessage((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="w-full max-w-3xl rounded-xl border border-black shadow-lg mx-auto">
            <CardHeader className="py-6">
                <CardTitle className="text-center text-2xl font-bold text-black">
                    {articleId ? "Edit Article" : "Add New Article"}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <Input
                        placeholder="Article Title"
                        {...form.register("title")}
                        className="border-black text-black placeholder-black focus:ring-black focus:border-black"
                    />

                    <Input
                        placeholder="Tagline"
                        {...form.register("tagline")}
                        className="border-black text-black placeholder-black focus:ring-black focus:border-black"
                    />

                    {/* Image Upload */}
                    <div className="grid gap-2">
                        <Label>Article Image</Label>
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
                                src={preview}
                                unoptimized
                                alt="Preview"
                                className="mt-2 w-full aspect-video object-cover rounded-md border border-black"
                            />
                        )}
                    </div>

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

                    <Button
                        type="submit"
                        className="w-full border border-black bg-white text-black font-semibold py-3 rounded-md hover:bg-black hover:text-white transition flex justify-center items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader className="animate-spin" /> Saving...
                            </>
                        ) : articleId ? (
                            "Update Article"
                        ) : (
                            "Add Article"
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
