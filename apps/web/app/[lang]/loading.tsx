export default function Loading() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        {/* Animated Zama-inspired logo */}
        <div className="relative w-24 h-24">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-spin" />
          
          {/* Middle ring - counter rotating */}
          <div className="absolute inset-2 border-4 border-border rounded-full animate-[spin_3s_linear_infinite_reverse]" />
          
          {/* Inner pulsing core */}
          <div className="absolute inset-4 bg-primary rounded-full animate-pulse" />
          
          {/* Orbiting dots */}
          <div className="absolute inset-0 animate-spin">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-3 h-3 bg-foreground rounded-full" />
          </div>
          <div className="absolute inset-0 animate-[spin_2s_linear_infinite_reverse]">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2 h-2 bg-foreground rounded-full" />
          </div>
        </div>

        {/* Loading text with animated dots */}
        <div className="flex items-center gap-1 text-foreground/60">
          <span>Loading</span>
          <span className="flex gap-1">
            <span className="w-1 h-1 bg-foreground rounded-full animate-[bounce_1s_infinite]" />
            <span className="w-1 h-1 bg-foreground rounded-full animate-[bounce_1s_infinite_0.2s]" />
            <span className="w-1 h-1 bg-foreground rounded-full animate-[bounce_1s_infinite_0.4s]" />
          </span>
        </div>
      </div>
    </div>
  );
}
