"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReportsTable from "@/components/ReportsTable";

export default function ReportsPage() {
    const router = useRouter();
    const [loggedInUserId, setLoggedInUserId] = useState(null);
    const [role, setRole] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const uid = localStorage.getItem("userId");
            const userRole = localStorage.getItem("role");
            if (!uid) {
                router.push("/login");
                return;
            }
            setLoggedInUserId(uid);
            setRole(userRole);
            setLoading(false);
        }
    }, [router]);

    if (loading || !role) {
        return <div className="flex items-center justify-center min-h-screen text-muted-foreground text-sm">Loading report...</div>;
    }

    return <ReportsTable loggedInUserId={loggedInUserId} role={role} />;
}