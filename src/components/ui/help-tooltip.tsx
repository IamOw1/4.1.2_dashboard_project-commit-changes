import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Универсальная подсказка с иконкой «?» — единый стиль на весь дашборд.
 *
 * Использование:
 *   <HelpTooltip text="Что делает эта кнопка и зачем нужна" />
 *   <HelpTooltip><b>RTL</b> — Возврат на базу. Дрон автоматически летит в точку взлёта.</HelpTooltip>
 *
 * Варианты:
 *   variant="inline" (по умолчанию) — иконка рядом с элементом, в потоке текста
 *   variant="corner" — поверх карточки/кнопки в правом верхнем углу (absolute)
 */
export function HelpTooltip({
  text,
  children,
  variant = "inline",
  className,
  side = "top",
  title,
}: {
  text?: string;
  children?: ReactNode;
  variant?: "inline" | "corner";
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  title?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        aria-label="Подсказка"
        className={cn(
          "inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          variant === "corner" && "absolute right-1.5 top-1.5 h-5 w-5 bg-card/80 backdrop-blur",
          variant === "inline" && "ml-1 align-middle",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </PopoverTrigger>
      <PopoverContent side={side} className="w-72 text-xs leading-relaxed">
        {title && <div className="mb-1 text-sm font-semibold text-foreground">{title}</div>}
        <div className="text-muted-foreground">{children ?? text}</div>
      </PopoverContent>
    </Popover>
  );
}
