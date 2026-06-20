import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  iconClassName?: string;
};

export function BrandMark({ className, iconClassName }: BrandMarkProps) {
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#164e63] shadow-glow",
        className
      )}
      aria-label="升云阶"
      role="img"
    >
      <svg
        className={cn("h-5 w-5", iconClassName)}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        <title>升云阶阶梯标志</title>
        <path d="M16 47h32" stroke="white" strokeWidth="5" strokeLinecap="round" />
        <path
          d="M20 42h8v-8h8v-8h8v-8"
          stroke="white"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M22 18h20" stroke="#a5f3fc" strokeWidth="5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
