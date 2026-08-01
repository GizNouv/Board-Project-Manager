import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface BoardCardData {
    id: string;
    title: string;
    createdAt: string;
    columnCount: number;
}

interface BoardCardProps {
    board: BoardCardData;
    className?: string;
}

export function BoardCard({ board, className }: BoardCardProps) {
    return (
        <Link href={`/boards/${board.id}`}>
            <Card className={cn('hover:bg-accent/50 transition-colors cursor-pointer h-full', className)}>
                <CardHeader>
                    <CardTitle className="text-lg">{board.title}</CardTitle>
                    <CardDescription>
                        Created {new Date(board.createdAt).toLocaleDateString()}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {board.columnCount} columns
                    </p>
                </CardContent>
            </Card>
        </Link>
    );
}