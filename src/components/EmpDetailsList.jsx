"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";


export default function EmpDetailsList({ onSelectEmployee, loggedInUserId, loggedInUserRole }) {
    const [employees, setEmployees] = useState([]);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    // 🛟 Fallback: agar prop nahi mili, localStorage se le lo
    const [role, setRole] = useState(loggedInUserRole || "");
    const [userId, setUserId] = useState(loggedInUserId || "");

    
    useEffect(() => {
        if (typeof window !== "undefined") {
            if (!loggedInUserRole) {
                setRole(localStorage.getItem("role") || "");
            }
            if (!loggedInUserId) {
                setUserId(localStorage.getItem("userId") || "");
            }
        }
    }, [loggedInUserRole, loggedInUserId]);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await fetch(`${apiUrl}/auth/employees`);
                const data = await res.json();
                setEmployees(data);
            } catch (error) {
                console.log("Error fetching employees:", error);
            }
        };

        fetchEmployees();
    }, []);
    

    const isAdmin = (role || "").toLowerCase() === "admin";

    // 🔍 Admin → sab employees | User → sirf khud ka record
    const visibleEmployees = isAdmin
        ? employees
        : employees.filter(emp => emp._id === userId);

    console.log("DEBUG → role:", role, "| userId:", userId, "| isAdmin:", isAdmin, "| employees:", employees.length, "| visible:", visibleEmployees.length);

    return (
        <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">

            <div className="px-4 py-4 border-b border-slate-800">
                <h2 className="text-[15px] font-medium text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    {isAdmin ? "Employees" : "My profile"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                    {isAdmin ? `${visibleEmployees.length} total` : "Your account"}
                </p>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
                {visibleEmployees.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">No employees found</p>
                ) : (
                    visibleEmployees.map(emp => (
                        <button
                            key={emp._id}
                            onClick={() => onSelectEmployee(emp)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-lg
                                       bg-slate-800/50 hover:bg-slate-800 active:bg-slate-700
                                       transition-colors duration-150 text-left"
                        >
                            <div className="w-9 h-9 rounded-full bg-indigo-500/15 flex items-center justify-center
                                            text-indigo-300 font-medium text-sm flex-shrink-0">
                                {emp.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-100 truncate">{emp.name}</p>
                                {emp.designation && (
                                    <p className="text-xs text-slate-400 truncate">{emp.designation}</p>
                                )}
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}