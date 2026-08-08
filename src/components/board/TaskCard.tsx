import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TaskData {
    id: string;
    title: string;
    description: string;
    estimate: {
        value: number;
        unit: string;
    };
    priority: {
        value: string;
    };
    type: string;
    assigneeId: string | null;
}

interface TaskCardProps {
    task: TaskData;
    className?: string;
}

export function TaskCard({ task, className }: TaskCardProps) {
    const priorityColors = {
        LOW: 'bg-green-500/10 text-green-700 dark:text-green-400',
        MEDIUM: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
        HIGH: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
        CRITICAL: 'bg-red-500/10 text-red-700 dark:text-red-400',
    };

    const typeColors = {
        bug: 'bg-red-500/10 text-red-700 dark:text-red-400',
        feature: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
        epic: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
    };

    return (
        <Card className={cn('overflow-hidden', className)}>
            <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
                    {task.title}
                </CardTitle>
                {task.description && (
                    <CardDescription className="line-clamp-2 text-xs">
                        {task.description}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                        variant="secondary"
                        className={cn(
                            'text-xs font-medium',
                            priorityColors[task.priority.value as keyof typeof priorityColors] || ''
                        )}
                    >
                        {task.priority.value}
                    </Badge>
                    <Badge
                        variant="outline"
                        className={cn(
                            'text-xs font-medium',
                            typeColors[task.type as keyof typeof typeColors] || ''
                        )}
                    >
                        {task.type}
                    </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {task.estimate && (
                        <span>
                            {task.estimate.value} {task.estimate.unit}
                        </span>
                    )}
                    {task.assigneeId && (
                        <span>👤 Assigned</span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}