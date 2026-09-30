import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  padding?: "sm" | "md" | "lg" | "none";
}

const paddings = { none: "", sm: "p-4", md: "p-5", lg: "p-6" };

export default function Card({ children, className = "", hover = false, onClick, padding = "md" }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={[
        "bg-white rounded-2xl border border-slate-100",
        "shadow-[0_1px_3px_0_rgb(0_0_0/0.08),0_1px_2px_-1px_rgb(0_0_0/0.06)]",
        hover ? "hover:shadow-[0_4px_12px_-2px_rgb(0_0_0/0.1),0_2px_6px_-2px_rgb(0_0_0/0.06)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer" : "",
        paddings[padding],
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  trend?: { value: string; up: boolean };
  color?: "primary" | "violet" | "green" | "amber" | "red" | "sky";
}

const colorMap = {
  primary: { bg: "bg-primary-50", text: "text-primary-600", icon: "bg-primary-100" },
  violet: { bg: "bg-violet-50", text: "text-violet-600", icon: "bg-violet-100" },
  green: { bg: "bg-green-50", text: "text-green-600", icon: "bg-green-100" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", icon: "bg-amber-100" },
  red: { bg: "bg-red-50", text: "text-red-600", icon: "bg-red-100" },
  sky: { bg: "bg-sky-50", text: "text-sky-600", icon: "bg-sky-100" },
};

export function StatCard({ label, value, sub, icon, trend, color = "primary" }: StatCardProps) {
  const c = colorMap[color];
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium mb-1">{label}</p>
          <p className={`text-2xl font-bold ${c.text} font-display`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          {trend && (
            <p className={`text-xs mt-1 font-medium ${trend.up ? "text-green-600" : "text-red-500"}`}>
              {trend.up ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon} ${c.text}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
