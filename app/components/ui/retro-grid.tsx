import { cn } from "@/lib/utils";

export function RetroGrid({
  className,
  angle = 65,
}: {
  className?: string;
  angle?: number;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute size-full overflow-hidden opacity-50 [perspective:200px]",
        className,
      )}
      style={{ "--grid-angle": `${angle}deg` } as React.CSSProperties}
    >
      {/* Grid - uses CSS variable for line color to work with light/dark themes */}
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div
          className={cn(
            "animate-grid",
            "[background-repeat:repeat] [background-size:60px_60px] [height:300vh] [inset:0%_0px] [margin-left:-50%] [transform-origin:100%_0_0] [width:600vw]",
          )}
          style={{
            backgroundImage: `linear-gradient(to right, var(--slide-accent, rgba(255,255,255,0.2)) 1px, transparent 0), linear-gradient(to bottom, var(--slide-accent, rgba(255,255,255,0.2)) 1px, transparent 0)`,
            opacity: 0.15,
          }}
        />
      </div>

      {/* Background Gradient - uses slide background color */}
      <div
        className="absolute inset-0 bg-gradient-to-t to-transparent to-90%"
        style={{ '--tw-gradient-from': 'var(--slide-bg, #000)' } as React.CSSProperties}
      />
    </div>
  );
}
