import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

type OrderStatusBadgeProps = {
  status: OrderStatus;
  className?: string;
};

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    className: string;
    dotClassName: string;
  }
> = {
  pending: {
    label: "In attesa",
    className: "border-[#E6C79C] bg-[#FFF5E7] text-[#9A6718]",
    dotClassName: "bg-[#E2A34A]",
  },
  processing: {
    label: "In lavorazione",
    className: "border-[#D6CDEA] bg-[#F5F2FB] text-[#6B5A95]",
    dotClassName: "bg-[#9C84D3]",
  },
  shipped: {
    label: "Spedito",
    className: "border-[#C6E0CF] bg-[#ECF8F0] text-[#3C6E4E]",
    dotClassName: "bg-[#7EA890]",
  },
  delivered: {
    label: "Consegnato",
    className: "border-[#BFE0C9] bg-[#E9F8EE] text-[#2F7B45]",
    dotClassName: "bg-[#4FA96A]",
  },
  cancelled: {
    label: "Annullato",
    className: "border-[#EDC6C3] bg-[#FDF0EF] text-[#A24D49]",
    dotClassName: "bg-[#D4918F]",
  },
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        config.className,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotClassName)} />
      {config.label}
    </span>
  );
}

