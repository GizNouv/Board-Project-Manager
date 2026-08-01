import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ColumnCardProps {
    id: string;
    title: string;
    taskCount: number;
    className?: string;
}

export function ColumnCard({ id, title, taskCount, className }: ColumnCardProps) {
    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                </p>
            </CardContent>
        </Card>
    );
}