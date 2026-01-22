import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonWrapperProps {
  className?: string;
  delay?: number;
  children: React.ReactNode;
}

const SkeletonWrapper = ({ className, delay = 0, children }: SkeletonWrapperProps) => (
  <div 
    className={cn("animate-pulse-soft", className)}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

export const HeroSkeleton = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
      <div className="text-center space-y-6 px-4">
        <SkeletonWrapper delay={0}>
          <Skeleton className="h-14 w-80 sm:w-[450px] mx-auto rounded-xl" />
        </SkeletonWrapper>
        <SkeletonWrapper delay={100}>
          <Skeleton className="h-6 w-56 sm:w-72 mx-auto rounded-lg" />
        </SkeletonWrapper>
        <SkeletonWrapper delay={200}>
          <Skeleton className="h-12 w-44 mx-auto mt-8 rounded-xl" />
        </SkeletonWrapper>
      </div>
    </div>
  );
};

export const RoomSkeleton = () => {
  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
      <SkeletonWrapper>
        <Skeleton className="h-48 sm:h-64 w-full" />
      </SkeletonWrapper>
      <div className="p-4 sm:p-6 space-y-4">
        <SkeletonWrapper delay={50}>
          <div className="flex justify-between items-start">
            <Skeleton className="h-7 w-3/5 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </SkeletonWrapper>
        <SkeletonWrapper delay={100}>
          <Skeleton className="h-4 w-full rounded-md" />
        </SkeletonWrapper>
        <SkeletonWrapper delay={150}>
          <Skeleton className="h-4 w-4/5 rounded-md" />
        </SkeletonWrapper>
        <SkeletonWrapper delay={200}>
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </SkeletonWrapper>
        <SkeletonWrapper delay={250}>
          <Skeleton className="h-11 w-full rounded-xl mt-4" />
        </SkeletonWrapper>
      </div>
    </div>
  );
};

export const MenuSkeleton = () => {
  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
      <SkeletonWrapper>
        <Skeleton className="h-48 sm:h-56 w-full" />
      </SkeletonWrapper>
      <div className="p-4 sm:p-6 space-y-3">
        <SkeletonWrapper delay={50}>
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-2/3 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
        </SkeletonWrapper>
        <SkeletonWrapper delay={100}>
          <Skeleton className="h-4 w-full rounded-md" />
        </SkeletonWrapper>
        <SkeletonWrapper delay={150}>
          <Skeleton className="h-4 w-3/4 rounded-md" />
        </SkeletonWrapper>
      </div>
    </div>
  );
};

export const MenuListSkeleton = () => {
  return (
    <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1">
          <SkeletonWrapper>
            <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
          </SkeletonWrapper>
          <div className="flex-1 space-y-2">
            <SkeletonWrapper delay={50}>
              <Skeleton className="h-5 w-3/4 rounded-md" />
            </SkeletonWrapper>
            <SkeletonWrapper delay={100}>
              <Skeleton className="h-4 w-full rounded-md" />
            </SkeletonWrapper>
          </div>
        </div>
        <SkeletonWrapper delay={150}>
          <Skeleton className="h-7 w-20 rounded-lg" />
        </SkeletonWrapper>
      </div>
    </div>
  );
};

export const ReviewSkeleton = () => {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-4">
        <SkeletonWrapper>
          <Skeleton className="h-12 w-12 rounded-full" />
        </SkeletonWrapper>
        <div className="space-y-2 flex-1">
          <SkeletonWrapper delay={50}>
            <Skeleton className="h-5 w-32 rounded-md" />
          </SkeletonWrapper>
          <SkeletonWrapper delay={100}>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-4 rounded-sm" />
              ))}
            </div>
          </SkeletonWrapper>
        </div>
      </div>
      <SkeletonWrapper delay={150}>
        <Skeleton className="h-4 w-full rounded-md" />
      </SkeletonWrapper>
      <SkeletonWrapper delay={200}>
        <Skeleton className="h-4 w-5/6 rounded-md" />
      </SkeletonWrapper>
      <SkeletonWrapper delay={250}>
        <Skeleton className="h-4 w-3/4 rounded-md" />
      </SkeletonWrapper>
    </div>
  );
};

export const GallerySkeleton = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
      {[...Array(9)].map((_, i) => (
        <SkeletonWrapper key={i} delay={i * 50}>
          <Skeleton className="aspect-square w-full rounded-xl" />
        </SkeletonWrapper>
      ))}
    </div>
  );
};

export const EventSkeleton = () => {
  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
      <SkeletonWrapper>
        <Skeleton className="h-48 sm:h-56 w-full" />
      </SkeletonWrapper>
      <div className="p-4 sm:p-6 space-y-3">
        <SkeletonWrapper delay={50}>
          <Skeleton className="h-6 w-3/4 rounded-lg" />
        </SkeletonWrapper>
        <SkeletonWrapper delay={100}>
          <Skeleton className="h-4 w-full rounded-md" />
        </SkeletonWrapper>
        <SkeletonWrapper delay={150}>
          <Skeleton className="h-4 w-5/6 rounded-md" />
        </SkeletonWrapper>
        <SkeletonWrapper delay={200}>
          <div className="flex flex-wrap gap-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </SkeletonWrapper>
      </div>
    </div>
  );
};

export const SectionTitleSkeleton = () => {
  return (
    <div className="text-center mb-10 sm:mb-16 space-y-4">
      <SkeletonWrapper>
        <Skeleton className="h-10 sm:h-12 w-64 sm:w-80 mx-auto rounded-xl" />
      </SkeletonWrapper>
      <SkeletonWrapper delay={100}>
        <Skeleton className="h-5 w-48 sm:w-96 mx-auto rounded-lg" />
      </SkeletonWrapper>
    </div>
  );
};
