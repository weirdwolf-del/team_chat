"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { UserPlus, UserCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        mobile: "",
        password: "",
        department: "",
        designation: "",
        salary: "",
        joiningDate: ""
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
        console.log(formData);

        // Validation
        if (
            !formData.name ||
            !formData.username ||
            !formData.email ||
            !formData.mobile ||
            !formData.password
        ) {
            toast.error("Please fill all fields!");
            return;
        }

        // Store data in an object
        const userData = { ...formData };
        console.log("User Registered:", userData);

        try {
            // Send data to backend API
            const res = await fetch(`${apiUrl}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            const data = await res.json();

            if (!res.ok) {
                //toast.error(data.message || "Registration failed!");
                alert(data.message || "Registration failed!");
                return;
            } else {
                toast.success("Registered Successfully!");

                // Clear inputs
                setFormData({
                    name: "",
                    username: "",
                    email: "",
                    mobile: "",
                    password: "",
                    department: "",
                    designation: "",
                    salary: "",
                    joiningDate: "" 
                });
            }
        } catch (err) {
            console.error(err);
            toast.error("Server error. Try again later!");
        }
    };

    return (
        <div className="flex justify-center items-start min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
            <Card className="w-full max-w-2xl shadow-sm border border-border/50 bg-background">
                <CardHeader className="pb-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <CardTitle className="text-[17px] font-medium">Add employee</CardTitle>
                            <p className="text-sm text-muted-foreground mt-0.5">Create a new employee account and profile</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Account Details */}
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-3">Account details</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-muted-foreground">Full name <span className="text-destructive">*</span></Label>
                                    <Input name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Rahul Sharma" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-muted-foreground">Username <span className="text-destructive">*</span></Label>
                                    <Input name="username" required value={formData.username} onChange={handleChange} placeholder="e.g. rahul.sharma" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-muted-foreground">Email <span className="text-destructive">*</span></Label>
                                    <Input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="rahul@company.com" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-muted-foreground">Mobile <span className="text-destructive">*</span></Label>
                                    <Input type="tel" name="mobile" required value={formData.mobile} onChange={handleChange} placeholder="+91 98765 43210" />
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <Label className="text-sm font-medium text-muted-foreground">Password <span className="text-destructive">*</span></Label>
                                    <Input type="password" name="password" required minLength={8} value={formData.password} onChange={handleChange} placeholder="Minimum 8 characters" />
                                </div>
                            </div>
                        </div>

                        <hr className="border-border/50" />

                        {/* Employment Details */}
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-3">
                                Employment details <span className="normal-case font-normal ml-1">— optional</span>
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                                    <Input name="department" value={formData.department} onChange={handleChange} placeholder="e.g. Sales, HR, IT" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-muted-foreground">Designation</Label>
                                    <Input name="designation" value={formData.designation} onChange={handleChange} placeholder="e.g. Manager, Executive" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-muted-foreground">Monthly salary</Label>
                                    <Input type="number" name="salary" value={formData.salary} onChange={handleChange} placeholder="e.g. 45000" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-muted-foreground">Joining date</Label>
                                    <Input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Button type="submit" className="gap-2">
                                <UserCheck className="w-4 h-4" /> Add employee
                            </Button>
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                        </div>
                    </form>

                    <div className="mt-5 pt-5 border-t border-border/50 text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
