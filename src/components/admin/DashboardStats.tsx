"use client";

import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type Trend = "up" | "down" | "neutral";
type AccentColor = "rose" | "sage" | "lavender" | "amber";

type DashboardStatsProps = {
  title: string;
  value: number;
  trend: Trend;
  trendValue: string;
  icon: LucideIcon;
  color: AccentColor;
};

const colorMap: Record<
  AccentColor,
  {
    iconBg: string;
    iconText: string;
    valueText: string;
  }
> = {
  rose: {
    iconBg: "bg-[#F9E9E8]",
    iconText: "text-[#D4918F]",
    valueText: "text-[#1E1810]",
  },
  sage: {
    iconBg: "bg-[#EAF3ED]",
    iconText: "text-[#7EA890]",
    valueText: "text-[#1E1810]",
  },
  lavender: {
    iconBg: "bg-[#F0ECFA]",
    iconText: "text-[#8E80B9]",
    valueText: "text-[#1E1810]",
  },
  amber: {
    iconBg: "bg-[#FFF2E5]",
    iconText: "text-[#C0853D]",
    valueText: "text-[#1E1810]",
  },
};

function formatStatNumber(value: number) {
  return new Intl.NumberFormat("it-IT").format(value);
}

export function DashboardStats({
  title,
  value,
  trend,
  trendValue,
  icon: Icon,
  color,
}: DashboardStatsProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const colors = colorMap[color];

  useEffect(() => {
    const duration = 900;
    const start = performance.now();

    const raf = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        requestAnimationFrame(raf);
      }
    };

    requestAnimationFrame(raf);
  }, [value]);

  const trendClass = useMemo(() => {
    if (trend === "up") {
      return "bg-[#E9F8EE] text-[#2F7B45]";
    }
    if (trend === "down") {
      return "bg-[#FDEEEE] text-[#A24D49]";
    }
    return "bg-[#F3EFE8] text-[#5C5048]";
  }, [trend]);

  return (
    <article className="rounded-2xl border border-black/7 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={cn("rounded-xl p-2.5", colors.iconBg)}>
          <Icon size={18} className={colors.iconText} />
        </div>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", trendClass)}>
          {trend === "up" ? <TrendingUp size={13} /> : null}
          {trend === "down" ? <TrendingDown size={13} /> : null}
          {trendValue}
        </span>
      </div>
      <p className="mt-4 text-sm text-[#5C5048]">{title}</p>
      <p className={cn("mt-1 font-serif text-4xl", colors.valueText)}>{formatStatNumber(displayValue)}</p>
    </article>
  );
}

