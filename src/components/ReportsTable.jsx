"use client";
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Download, CalendarDays } from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────
const OVERTIME_RATE_PER_HOUR = 100;
const STANDARD_WORK_MINUTES = 9 * 60;
const STANDARD_DAYS_PER_MONTH = 26;

// ── Helpers ────────────────────────────────────────────────────────────────
const durationsToMinutes = (durations) => {
    if (!durations?.length) return 0;
    const match = durations[0].match(/(\d+)h\s*(\d+)m/);
    if (!match) return 0;
    return parseInt(match[1]) * 60 + parseInt(match[2]);
};

const isLate = (checkInTime) => {
    if (!checkInTime) return false;
    const m = checkInTime.match(/(\d+):(\d+):(\d+)\s*(AM|PM)/i);
    if (!m) return false;
    let h = parseInt(m[1]), min = parseInt(m[2]);
    if (m[4].toUpperCase() === "PM" && h !== 12) h += 12;
    if (m[4].toUpperCase() === "AM" && h === 12) h = 0;
    return (h * 60 + min) > (10 * 60 + 5);
};

const formatHours = (minutes) => {
    if (!minutes) return "0h 0m";
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

// Escape a value for CSV (handles commas, quotes, newlines)
const csvEscape = (val) => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

export default function ReportsPage() {
    const router = useRouter();

    const [loggedInUserId, setLoggedInUserId] = useState(null);
    const [role, setRole] = useState("");
    const [loading, setLoading] = useState(true);

    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);

    // Default to current month "YYYY-MM"
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().toISOString().slice(0, 7)
    );

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    // ── Auth check ──────────────────────────────────────────────────────────
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
        }
    }, [router]);

    // ── Fetch all data ──────────────────────────────────────────────────────
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [empRes, attRes, leaveRes] = await Promise.all([
                    fetch(`${apiUrl}/auth/employees`),
                    fetch(`${apiUrl}/attendance`),
                    fetch(`${apiUrl}/leave`),
                ]);
                const [empData, attData, leaveData] = await Promise.all([
                    empRes.json(),
                    attRes.json(),
                    leaveRes.json(),
                ]);
                setEmployees(Array.isArray(empData) ? empData : []);
                setAttendance(Array.isArray(attData) ? attData : []);
                setLeaves(Array.isArray(leaveData) ? leaveData : []);
            } catch (err) {
                console.error("Error fetching report data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const isAdmin = (role || "").toLowerCase() === "admin";

    // ── Build report rows ─────────────────────────────────────────────────
    const reportRows = useMemo(() => {
        if (!employees.length) return [];

        // Filter to visible employees (admin = all, user = self)
        const visibleEmployees = isAdmin
            ? employees
            : employees.filter(e => e._id === loggedInUserId);

        const rows = [];

        visibleEmployees.forEach(emp => {
            // Attendance for this employee in selected month
            const empAttendance = attendance.filter(
                r => r.userId === emp._id && r.date?.startsWith(selectedMonth)
            );

            // Leaves for this employee in selected month
            const empLeaves = leaves.filter(
                l => l.userId === emp._id &&
                    (l.fromDate || l.date || "").startsWith(selectedMonth)
            );

            const presentDays = empAttendance.filter(r => (r.totalMinutes || durationsToMinutes(r.durations)) > 0).length;
            const lateDays = empAttendance.filter(r => isLate(r.checkInTime)).length;

            let totalMinutesSum = 0;
            let overtimeMinutesSum = 0;

            empAttendance.forEach(r => {
                totalMinutesSum += r.totalMinutes || durationsToMinutes(r.durations);
                overtimeMinutesSum += r.overtimeMinutes || 0;
            });

            const dailySalary = (emp.salary || 0) / STANDARD_DAYS_PER_MONTH;

            let regularSalaryTotal = 0;
            empAttendance.forEach(r => {
                const totalMinutes = r.totalMinutes || durationsToMinutes(r.durations);
                if (totalMinutes > 0) {
                    const regularMinutes = Math.min(totalMinutes, STANDARD_WORK_MINUTES);
                    regularSalaryTotal += dailySalary * (regularMinutes / STANDARD_WORK_MINUTES);
                }
            });

            const overtimeSalaryTotal = (overtimeMinutesSum / 60) * OVERTIME_RATE_PER_HOUR;
            const estimatedSalary = Math.round(regularSalaryTotal + overtimeSalaryTotal);

            const approvedLeaves = empLeaves.filter(l => (l.status || "").toLowerCase() === "approved").length;
            const pendingLeaves = empLeaves.filter(l => (l.status || "").toLowerCase() === "pending").length;
            const rejectedLeaves = empLeaves.filter(l => (l.status || "").toLowerCase() === "rejected").length;

            rows.push({
                name: emp.name,
                department: emp.department || "-",
                designation: emp.designation || "-",
                month: selectedMonth,
                presentDays,
                lateDays,
                totalHours: formatHours(totalMinutesSum),
                overtimeHours: formatHours(overtimeMinutesSum),
                monthlySalary: emp.salary || 0,
                estimatedSalary,
                approvedLeaves,
                pendingLeaves,
                rejectedLeaves,
                totalLeaves: empLeaves.length,
            });
        });

        return rows;
    }, [employees, attendance, leaves, isAdmin, loggedInUserId, selectedMonth]);

    // ── CSV download ──────────────────────────────────────────────────────
    const downloadCSV = () => {
        const headers = [
            "Employee Name", "Department", "Designation", "Month",
            "Present Days", "Late Days", "Total Hours", "Overtime Hours",
            "Monthly Salary", "Estimated Salary",
            "Approved Leaves", "Pending Leaves", "Rejected Leaves", "Total Leaves",
        ];

        const csvRows = reportRows.map(r => [
            r.name, r.department, r.designation, r.month,
            r.presentDays, r.lateDays, r.totalHours, r.overtimeHours,
            r.monthlySalary, r.estimatedSalary,
            r.approvedLeaves, r.pendingLeaves, r.rejectedLeaves, r.totalLeaves,
        ]);

        const csvContent = [headers, ...csvRows]
            .map(row => row.map(csvEscape).join(","))
            .join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `report_${selectedMonth}${isAdmin ? "_all" : "_" + (reportRows[0]?.name || "employee")}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading || !role) {
        return (
            <div className="flex items-center justify-center min-h-screen text-muted-foreground text-sm">
                Loading report...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 space-y-5">

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-[17px] font-medium flex items-center gap-2">
                        <FileSpreadsheet className="w-[18px] h-[18px] text-muted-foreground" />
                        Reports
                        <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md ${isAdmin
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                            }`}>
                            {isAdmin ? "Admin" : "My report"}
                        </span>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isAdmin
                            ? "Attendance, salary and leave summary for all employees"
                            : "Your attendance, salary and leave summary"}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-background border border-border/50 rounded-md px-3 h-9">
                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="text-sm bg-transparent outline-none"
                        />
                    </div>
                    <Button className="gap-2" onClick={downloadCSV} disabled={reportRows.length === 0}>
                        <Download className="w-4 h-4" /> Download CSV
                    </Button>
                </div>
            </div>

            {/* Table */}
            <Card className="border border-border/50 shadow-none">
                <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
                    <h2 className="text-sm font-medium">
                        {isAdmin ? "All employees" : "Your summary"}
                    </h2>
                    <span className="text-xs text-muted-foreground">{reportRows.length} record(s)</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm whitespace-nowrap">
                        <thead>
                            <tr className="border-b bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                                {isAdmin && <th className="px-4 py-3 text-left font-medium">Name</th>}
                                {isAdmin && <th className="px-4 py-3 text-left font-medium">Department</th>}
                                {isAdmin && <th className="px-4 py-3 text-left font-medium">Designation</th>}
                                <th className="px-4 py-3 text-left font-medium">Present days</th>
                                <th className="px-4 py-3 text-left font-medium">Late days</th>
                                <th className="px-4 py-3 text-left font-medium">Total hours</th>
                                <th className="px-4 py-3 text-left font-medium">Overtime hours</th>
                                <th className="px-4 py-3 text-left font-medium">Monthly salary</th>
                                <th className="px-4 py-3 text-left font-medium">Estimated salary</th>
                                <th className="px-4 py-3 text-left font-medium">Approved leaves</th>
                                <th className="px-4 py-3 text-left font-medium">Pending leaves</th>
                                <th className="px-4 py-3 text-left font-medium">Rejected leaves</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportRows.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 12 : 9} className="px-4 py-8 text-center text-muted-foreground">
                                        No records found for this month
                                    </td>
                                </tr>
                            ) : reportRows.map((r, idx) => (
                                <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                                    {isAdmin && <td className="px-4 py-3 font-medium">{r.name}</td>}
                                    {isAdmin && <td className="px-4 py-3 text-muted-foreground">{r.department}</td>}
                                    {isAdmin && <td className="px-4 py-3 text-muted-foreground">{r.designation}</td>}
                                    <td className="px-4 py-3">{r.presentDays}</td>
                                    <td className="px-4 py-3">{r.lateDays}</td>
                                    <td className="px-4 py-3">{r.totalHours}</td>
                                    <td className="px-4 py-3">{r.overtimeHours}</td>
                                    <td className="px-4 py-3">₹{r.monthlySalary.toLocaleString("en-IN")}</td>
                                    <td className="px-4 py-3 font-medium">₹{r.estimatedSalary.toLocaleString("en-IN")}</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-md bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                                            {r.approvedLeaves}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                            {r.pendingLeaves}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                                            {r.rejectedLeaves}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}