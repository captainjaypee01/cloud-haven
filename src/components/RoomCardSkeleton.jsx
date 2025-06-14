// components/RoomCardSkeleton.jsx
import { Skeleton } from "@/components/ui/skeleton";

export default function RoomCardSkeleton() {
  return (
    <div className="flex flex-col space-y-2 animate-pulse">
      <Skeleton className="h-48 w-full rounded-lg" /> {/* image placeholder */}
      <Skeleton className="h-5 w-3/4 rounded" />      {/* title */}
      <Skeleton className="h-4 w-1/2 rounded" />      {/* subtitle */}
    </div>
  );
}
