import { Skeleton } from '@/components/ui/skeleton';
debugger
export default function BoardsLoading() {
  return (
    <div className="space-y-6">
      <div className='flex items-center justify-between flex-wrap md:flex-nowrap gap-4'>
        <div className="space-y-2 w-full *:max-w-full!">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-9 w-35.5 rounded-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}