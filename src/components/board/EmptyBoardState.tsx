import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyBoardStateProps {
    onCreateBoard?: () => void;
}

export function EmptyBoardState({ onCreateBoard }: EmptyBoardStateProps) {
    return (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <CardHeader>
                <CardTitle className="text-2xl">No Board Found</CardTitle>
                <CardDescription>
                    Create your first board to start organizing your tasks
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