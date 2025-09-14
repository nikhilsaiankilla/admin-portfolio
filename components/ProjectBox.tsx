"use client"

import { Project, Skill } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import ProjectForm from './forms/ProjectForm';
import { Button } from './ui/button';
import { Loader, Pencil, Trash } from 'lucide-react';
import { deleteProject, fetchSkills } from '@/actions/action';

type ProjectBoxProps = {
    project: Project;
    onDeleted?: (id: string) => void;
};

const ProjectBox = ({ project, onDeleted }: ProjectBoxProps) => {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [allSkills, setAllSkills] = useState<Skill[]>([]);

    useEffect(() => {
        const getSkills = async () => {
            const res = await fetchSkills();
            if (res.success && res.data) setAllSkills(res.data);
        };
        getSkills();
    }, []);

    async function handleDelete() {
        if (!confirm(`Are you sure you want to delete "${project.title}"?`)) return;

        setLoading(true);
        try {
            const data = await deleteProject(project.id);
            if (data.success) {
                onDeleted?.(project.id);
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

    // Filter skill names based on project.skills (IDs)
    const projectSkillNames = allSkills.filter(skill =>
        project.skills?.includes(skill.id)
    );

    return (
        <>
            <div className='w-full aspect-square rounded-2xl space-y-3 shadow-2xl p-4'>
                <div className='w-full aspect-square rounded-2xl overflow-hidden'>
                    <Image
                        src={project.image}
                        alt={project.title}
                        loading='lazy'
                        unoptimized
                        width={100}
                        height={100}
                        className='w-full aspect-square'
                    />
                </div>

                <div className='w-full space-y-2.5 pb-2'>
                    <h1>{project.title}</h1>
                    <h1>{project.tagline}</h1>
                    <h1 className='line-clamp-5'>{project.description}</h1>
                </div>

                {/* Skills grid */}
                {projectSkillNames.length > 0 && (
                    <div className='grid grid-cols-4 gap-3'>
                        {projectSkillNames.map(skill => (
                            <span
                                key={skill.id}
                                className='text-xs px-2 py-1 border rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            >
                                {skill.name}
                            </span>
                        ))}
                    </div>
                )}

                <div className='flex items-center gap-5 pb-2'>
                    {project?.githubUrl && <Link href={project.githubUrl}>code</Link>}
                    {project?.demoUrl && <Link href={project.demoUrl}>demo</Link>}
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
                        <DialogTitle>Edit project</DialogTitle>
                    </DialogHeader>

                    {/* Scrollable content area */}
                    <div className="overflow-y-auto pr-2">
                        <ProjectForm
                            projectData={{
                                title: project.title,
                                problem: project.problem,
                                description: project.description,
                                skills: project.skills,
                                image: project.image,
                                githubUrl: project.githubUrl,
                                demoUrl: project.demoUrl,
                                tagline: project.tagline,
                            }}
                            projectId={project.id}
                        />
                    </div>
                </DialogContent>
            </Dialog>

        </>
    );
}

export default ProjectBox;
