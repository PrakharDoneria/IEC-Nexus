import { cn } from "@/lib/utils";
import { Card, type CardProps } from "@/components/ui/card";

export function NeoCard({ className, ...props }: CardProps) {
  return (
    <Card
      className={cn(
        "border-2 border-foreground bg-card text-card-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]",
        className
      )}
      {...props}
    />
  );
}

export function NeoCardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="p-6" {...props} />;
}

export function NeoCardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="p-6 pt-0" {...props} />;
}

export function NeoCardFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="p-6 pt-0" {...props} />;
}
