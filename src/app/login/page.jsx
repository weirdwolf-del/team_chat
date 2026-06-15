"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
//import { User, Lock, LogIn } from "lucide-react";
import { ShieldCheck, User, Lock, LogIn } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { useEffect } from "react";

// Temporary dummy users (for frontend testing)
export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);


    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    useEffect(() => {
        fetch(`${apiUrl}/health`).catch(() => { });
    }, []);


    const handleSubmit = async (e) => {
        e.preventDefault();

        const { username, password } = formData;

        // 🔍 Basic validation
        if (!username || !password) {
            toast.error("Please fill all fields!");
            return;
        }

        try {
            setLoading(true);
            // 🔐 Login API call
            const res = await fetch(`${apiUrl}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok || data.success === false) {

                //alert(data.message || "Login failed");
                toast.error(data.message || "Login failed");

                setLoading(false);
                return;
            }


            // ✅ Save auth data
            localStorage.setItem("userId", data.user._id);
            localStorage.setItem("userName", data.user.name);
            localStorage.setItem("role", data.user.role);
            localStorage.setItem("joiningDate", data.user.joiningDate);
            localStorage.setItem("department", data.user.department);
            localStorage.setItem("designation", data.user.designation);
            localStorage.setItem("salary", data.user.salary);

            toast.success("Login successful!");

            // 🚀 Instant redirect
            router.replace("/dashboard");

        } catch (error) {
            //console.error("Login error:", error);
            toast.error("Server is waking up, please wait...");
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
            <Card className="w-full max-w-sm shadow-sm border border-border/50 bg-background">

                {/* Header */}
                <CardHeader className="pb-4 text-center">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto mb-3">
                        <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-[18px] font-medium">Welcome back</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Sign in to your account to continue</p>
                </CardHeader>

                {/* Form */}
                <CardContent className="pt-0">
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                                <Input
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="Enter your username"
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-muted-foreground">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                                <Input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full gap-2 mt-1" disabled={loading}>
                            <LogIn className="w-4 h-4" />
                            {loading ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>

                    <div className="mt-5 pt-4 border-t border-border/50 text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link href="/register" className="text-blue-600 hover:underline">
                            Add Employee
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
