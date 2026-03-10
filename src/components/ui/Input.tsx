import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <input
        id={id}
        className={cn(
          "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/30",
          error ? "border-rose-400 focus:border-rose-400 focus:ring-rose-200" : "",
          className,
        )}
        {...props}
      />
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
