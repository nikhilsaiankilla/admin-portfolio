"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginForm() {
    const form = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const [warning, setWarning] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleLogin(values: z.infer<typeof loginSchema>) {
        setLoading(true);
        setWarning("");

        try {
            if (values.email !== "nikhilsaiankilla@gmail.com") {
                setWarning("Nice Try, Only the admin can log in here 😎");
                setLoading(false); // reset loading
                return;
            }

            const userCredential = await signInWithEmailAndPassword(
                auth,
                values.email,
                values.password
            );

            const idToken = await userCredential.user.getIdToken();

            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });


            if (res.ok) {
                // Optional: store in localStorage if needed
                // localStorage.setItem("firebaseToken", data.token);

                console.log('above router');
                router.push("/admin"); // redirect to admin
                console.log('below router');
            }
        } catch (err: unknown) {
            console.error(err);
            setWarning((err as Error).message);
        } finally {
            setLoading(false); // always reset loading
        }
    }

    return (
        <Card className="w-full max-w-md rounded-xl border border-black shadow-lg">
            <CardHeader className="py-6">
                <CardTitle className="text-center text-2xl font-bold text-black">
                    Admin Login
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
                    <div>
                        <Input
                            type="email"
                            placeholder="Email"
                            {...form.register("email")}
                            className="border-black text-black placeholder-black focus:ring-black focus:border-black"
                        />
                        {form.formState.errors.email && (
                            <p className="text-sm text-red-700 mt-1">
                                {form.formState.errors.email.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <Input
                            type="password"
                            placeholder="Password"
                            {...form.register("password")}
                            className="border-black text-black placeholder-black focus:ring-black focus:border-black"
                        />
                        {form.formState.errors.password && (
                            <p className="text-sm text-red-700 mt-1">
                                {form.formState.errors.password.message}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full border border-black bg-white text-black font-semibold py-3 rounded-md hover:bg-black hover:text-white transition"
                    >
                        {loading ? <><Loader className="animate-spin" /> Opening Door</> : "Kol Jao Sim Sim"}
                    </Button>

                </form>
                {warning && (
                    <p className="text-center text-red-700 font-semibold animate-pulse">
                        {warning}
                    </p>
                )}
            </CardContent>
            <div className="text-center py-3 text-black text-sm">
                Only the admin 👑 everyone else, stay out!
            </div>
        </Card>
    );
}
