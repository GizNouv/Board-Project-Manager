import { Skeleton } from '@/components/ui/skeleton';

export default function BoardViewLoading() {
  return (
    <div className="space-y-6">
      <div className='flex items-center justify-between flex-wrap md:flex-nowrap gap-4'>
        <div className="space-y-2 w-full *:max-w-full!">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className="h-9 w-35.5" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
      <div className="flex gap-5 *:max-h-full *:basis-70 *:shrink-0 overflow-clip h-[calc(100svh-246px)]">
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    </div>
  );
}