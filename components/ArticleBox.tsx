"use client"

import { Article } from '@/types';
import Image from 'next/image';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Loader, Pencil, Trash } from 'lucide-react';
import { deleteArticle } from '@/actions/action';
import ArticleForm from './forms/ArticleForm';

type ArticleBoxProps = {
    article: Article;
    onDeleted?: (id: string) => void;
};

const ArticleBox = ({ article, onDeleted }: ArticleBoxProps) => {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    async function handleDelete() {
        if (!confirm(`Are you sure you want to delete "${article.title}"?`)) return;

        setLoading(true);
        try {
            const data = await deleteArticle(article.id);
            if (data.success) {
                onDeleted?.(article.id);
            } else {
                alert(data.message || "Failed to delete project");
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className='w-full aspect-square rounded-2xl space-y-3 shadow-2xl p-4'>
                <div className='w-full aspect-square rounded-2xl overflow-hidden'>
                    <Image
                        src={article.image || ""}
                        alt={article.title}
                        loading='lazy'
                        unoptimized
                        width={100}
                        height={100}
                        className='w-full aspect-square'
                    />
                </div>

                <div className='w-full space-y-2.5 pb-2'>
                    <h1>{article.title}</h1>
                    <h1>{article.tagline}</h1>
                    <h1 className='line-clamp-5'>{article.description}</h1>
                    <h4>{article.createdAt ? new Date(article.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    }) : ""}</h4>
                </div>

                <div className="flex gap-2 mt-2">
                    <Button onClick={() => setOpen(true)} className="border border-black hover:bg-black hover:text-white transition">
                        <Pencil size={8} />
                    </Button>
                    <Button
                        onClick={handleDelete}
                        className="border border-black hover:bg-red-600 hover:text-white transition flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading && <Loader className="animate-spin h-2 w-2" />}
                        <Trash size={8} className="h-2 w-2" />
                    </Button>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="w-full max-w-5xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Edit Article</DialogTitle>
                    </DialogHeader>

                    {/* Scrollable content area */}
                    <div className="overflow-y-auto pr-2">
                        <ArticleForm
                            articleData={{
                                id: article.id,
                                title: article.title,
                                description: article.description,
                                image: article.image,
                                tagline: article.tagline,
                            }}
                            articleId={article.id}
                        />
                    </div>
                </DialogContent>
            </Dialog>

        </>
    );
}

export default ArticleBox;
