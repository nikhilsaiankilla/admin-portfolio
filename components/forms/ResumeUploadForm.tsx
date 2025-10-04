"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loader } from "lucide-react";
import { addOrUpdateResume } from "@/actions/action";

type ResumeFormValues = {
    resume: FileList;
};

export default function ResumeUploadForm() {
    const { register, handleSubmit, reset } = useForm<ResumeFormValues>();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const onSubmit = async (values: ResumeFormValues) => {
        if (!values.resume || values.resume.length === 0) {
            setMessage("Please select a file to upload");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const formData = new FormData();
            formData.append("resume", values.resume[0]);

            const res = await addOrUpdateResume(formData)

            if (res.success && res.url) {
                setMessage("Resume uploaded successfully!");
                setPreviewUrl(res?.url);
                reset();
            } else if (res.message) {
                setMessage(res.message || "Failed to upload resume");
            } else {
                setMessage("Failed to upload resume");
            }
        } catch (err: unknown) {
            console.error(err);
            setMessage((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPreviewUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 border rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Upload Resume</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    {...register("resume")}
                    onChange={handleFileChange}
                />

                {previewUrl && (
                    <p className="text-sm text-gray-600">Selected file: {previewUrl}</p>
                )}

                <Button
                    type="submit"
                    className="w-full flex justify-center items-center gap-2"
                    disabled={loading}
                >
                    {loading ? <Loader className="animate-spin" /> : "Upload Resume"}
                </Button>

                {message && <p className="text-center text-green-700 mt-2">{message}</p>}
            </form>
        </div>
    );
}
