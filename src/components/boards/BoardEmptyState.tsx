import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface BoardEmptyStateProps {
    onCreateBoard?: () => void;
}

export function BoardEmptyState({ onCreateBoard }: BoardEmptyStateProps) {
    return (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <CardHeader>
                <CardTitle className="text-2xl">No Boards Found</CardTitle>
                <CardDescription>
                    You don't have any boards yet. Create your first board to get started.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={onCreateBoard}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Board
                </Button>
            </CardContent>
        </Card>
    );
}