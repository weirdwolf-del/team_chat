"use client";

import { useMemo } from "react";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
    CartesianGrid, ResponsiveContainer,
} from "recharts";
import { CalendarCheck, Clock, TrendingUp, Wallet, Inbox } from "lucide-react";

const OVERTIME_RATE_PER_HOUR = 100;
const STANDARD_WORK_MINUTES = 9 * 60;
const STANDARD_DAYS_PER_MONTH = 26; // 👈 add this

const minutesToHours = (minutes) => {
    if (!minutes || isNaN(minutes)) return 0;
    return Math.round((minutes / 60) * 10) / 10;
};



const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
};

const formatCurrency = (value) => `₹${Math.round(value).toLocaleString("en-IN")}`;

const AttendanceTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const hours = payload[0]?.value ?? 0;
    return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md text-xs">
            <p className="font-medium text-slate-700 mb-1">{label}</p>
            <p className="text-slate-500">
                Working hours: <span className="font-medium text-indigo-600">{hours}h</span>
            </p>
        </div>
    );
};

const SalaryTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md text-xs space-y-1">
            <p className="font-medium text-slate-700 mb-1">{label}</p>
            {payload.map((entry) => (
                <p key={entry.dataKey} className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-slate-500">{entry.name}:</span>
                    <span className="font-medium text-slate-700">{formatCurrency(entry.value)}</span>
                </p>
            ))}
        </div>
    );
};

export default function EmployeeAttendanceAnalytics({ employee, attendanceData }) {
    const hasData = Array.isArray(attendanceData) && attendanceData.length > 0;

    const { attendanceChartData, salaryChartData, summary } = useMemo(() => {
        if (!hasData) {
            return {
                attendanceChartData: [],
                salaryChartData: [],
                summary: { presentDays: 0, totalHours: 0, overtimeHours: 0, estimatedSalary: 0 },
            };
        }

        const sorted = [...attendanceData].sort((a, b) => new Date(a.date) - new Date(b.date));
        // ✅ Replace with:
        const dailySalary = (employee?.salary || 0) / STANDARD_DAYS_PER_MONTH;

        let totalMinutesSum = 0;
        let overtimeMinutesSum = 0;
        let presentDays = 0;
        let regularSalaryTotal = 0;
        let overtimeSalaryTotal = 0;

        const attendanceChart = [];
        const salaryChart = [];

        sorted.forEach((record) => {
            const totalMinutes = record.totalMinutes || 0;
            const overtimeMinutes = record.overtimeMinutes || 0;

            if (totalMinutes > 0) presentDays += 1;

            totalMinutesSum += totalMinutes;
            overtimeMinutesSum += overtimeMinutes;

            const regularMinutes = Math.min(totalMinutes, STANDARD_WORK_MINUTES);
            const regularDayFraction = regularMinutes / STANDARD_WORK_MINUTES;

            const regularSalaryForDay = totalMinutes > 0 ? dailySalary * regularDayFraction : 0;
            const overtimeSalaryForDay = (overtimeMinutes / 60) * OVERTIME_RATE_PER_HOUR;

            regularSalaryTotal += regularSalaryForDay;
            overtimeSalaryTotal += overtimeSalaryForDay;

            const label = formatDateLabel(record.date);

            attendanceChart.push({ date: label, hours: minutesToHours(totalMinutes) });
            salaryChart.push({
                date: label,
                regular: Math.round(regularSalaryForDay),
                overtime: Math.round(overtimeSalaryForDay),
            });
        });

        return {
            attendanceChartData: attendanceChart,
            salaryChartData: salaryChart,
            summary: {
                presentDays,
                totalHours: minutesToHours(totalMinutesSum),
                overtimeHours: minutesToHours(overtimeMinutesSum),
                estimatedSalary: Math.round(regularSalaryTotal + overtimeSalaryTotal),
            },
        };
    }, [attendanceData, employee, hasData]);

    const summaryCards = [
        { label: "Present days", value: summary.presentDays, icon: CalendarCheck, iconBg: "bg-indigo-50", iconColor: "text-indigo-600" },
        { label: "Total working hours", value: `${summary.totalHours}h`, icon: Clock, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
        { label: "Overtime hours", value: `${summary.overtimeHours}h`, icon: TrendingUp, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
        { label: "Estimated salary", value: formatCurrency(summary.estimatedSalary), icon: Wallet, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
    ];

    if (!hasData) {
        return (
            <div className="w-full">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <Inbox className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">No attendance records available</p>
                    <p className="text-xs text-slate-400 mt-1">
                        {employee?.name ? `${employee.name} has no recorded attendance for this period.` : "Attendance data will appear here once available."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map(({ label, value, icon: Icon, iconBg, iconColor }) => (
                    <div key={label} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                            <Icon className={`w-5 h-5 ${iconColor}`} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-slate-500 truncate">{label}</p>
                            <p className="text-lg font-semibold text-slate-800 truncate">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-800">Monthly attendance</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Working hours per day</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-indigo-600" />
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={attendanceChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false}
                                    label={{ value: "Hours", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#94A3B8" } }} />
                                <Tooltip content={<AttendanceTooltip />} />
                                <Line type="monotone" dataKey="hours" name="Working hours" stroke="#6366F1" strokeWidth={2.5}
                                    dot={{ r: 3, fill: "#6366F1", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-800">Attendance based salary</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Regular vs overtime earnings</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-emerald-600" />
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salaryChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip content={<SalaryTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                                <Bar dataKey="regular" name="Regular salary" stackId="salary" fill="#6366F1" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="overtime" name="Overtime salary" stackId="salary" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}