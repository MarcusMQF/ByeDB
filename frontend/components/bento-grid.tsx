import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/button";

const BentoGrid = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
}: {
  name: string;
  className: string;
  background: ReactNode;
  Icon: any;
  description: string;
  href: string;
  cta: string;
}) => (
  <div
    key={name}
    className={cn(
      "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-2xl",
      // Enhanced dark theme design
      "bg-gradient-to-br from-white/[0.08] to-white/[0.02]",
      "border border-white/[0.08] backdrop-blur-xl",
      "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.4)]",
      "hover:shadow-[0_16px_60px_-8px_rgba(0,0,0,0.6)]",
      "hover:border-white/[0.12]",
      "transition-all duration-500 ease-out",
      "transform-gpu hover:scale-[1.02]",
      className,
    )}
  >
    <div className="absolute inset-0">{background}</div>
    
    {/* Content */}
    <div className="relative z-10 flex flex-col gap-3 p-8 transition-all duration-500 group-hover:-translate-y-2">
      <div className="relative">
        <Icon className="h-12 w-12 text-white/90 transition-all duration-500 ease-out group-hover:scale-110 group-hover:text-white drop-shadow-lg" />
        <div className="absolute inset-0 h-12 w-12 bg-white/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-white/95 group-hover:text-white transition-colors duration-300">
          {name}
        </h3>
        <p className="text-sm text-white/60 leading-relaxed group-hover:text-white/70 transition-colors duration-300">
          {description}
        </p>
      </div>
    </div>

    {/* CTA Button */}
    <div className="relative z-10 p-8 pt-0">
      <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
        <Button 
          variant="ghost" 
          asChild 
          size="sm" 
          className="bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border border-white/20 hover:border-white/30 rounded-lg backdrop-blur-sm transition-all duration-300"
        >
          <a href={href} className="flex items-center gap-2">
            {cta}
            <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
    
    {/* Subtle overlay on hover */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
  </div>
);

export { BentoCard, BentoGrid };
