"use client";

import { Skill } from "@/types";
import React, { useState } from "react";
import { Loader, Pencil, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import SkillForm from "./forms/SkillForm";
import { deleteSkill } from "@/actions/action";
import Image from "next/image";


type SkillBoxProps = {
    skill: Skill;
    onDeleted?: (id: string) => void;
};

export default function SkillBox({ skill, onDeleted }: SkillBoxProps) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false); // Dialog open state

    async function handleDelete() {
        if (!confirm(`Are you sure you want to delete "${skill.name}"?`)) return;

        setLoading(true);
        try {
            const data = await deleteSkill(skill.id);
            if (data.success) {
                onDeleted?.(skill.id);
            } else {
                alert(data.message || "Failed to delete skill");
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
            <div className="w-fit rounded-2xl flex gap-5 items-center justify-center p-3 border-2 border-black">
                <Image width={100} height={100} unoptimized src={skill?.image || ""} alt={skill.name} className="h-20 w-20 object-cover rounded-md mb-2" />
                <div>
                    <p className="font-semibold">{skill.name}</p>
                    <p className="text-sm text-gray-600">{skill.category}</p>

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
            </div>

            {/* Dialog for editing */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Skill</DialogTitle>
                    </DialogHeader>
                    <SkillForm skillData={{ name: skill.name, category: skill.category, image: skill.image ?? "" }} skillId={skill.id} />
                </DialogContent>
            </Dialog>
        </>
    );
}
