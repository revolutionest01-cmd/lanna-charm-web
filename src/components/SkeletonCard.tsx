import { Skeleton } from "@/components/ui/skeleton";

export const HeroSkeleton = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4 px-4">
        <Skeleton className="h-12 w-96 mx-auto" />
        <Skeleton className="h-6 w-64 mx-auto" />
        <Skeleton className="h-10 w-40 mx-auto mt-8" />
      </div>
    </div>
  );
};

export const RoomSkeleton = () => {
  return (
    <div className="space-y-4">
      <Skeleton className="h-64 w-full rounded-lg" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-8 w-32 mt-4" />
    </div>
  );
};

export const MenuSkeleton = () => {
  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-24 mt-2" />
    </div>
  );
};

export const ReviewSkeleton = () => {
  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  );
};

export const GallerySkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(9)].map((_, i) => (
        <Skeleton key={i} className="h-64 w-full rounded-lg" />
      ))}
    </div>
  );
};

export const EventSkeleton = () => {
  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
};
