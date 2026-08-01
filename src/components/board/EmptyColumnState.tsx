import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyColumnStateProps {
    onCreateColumn?: () => void;
}

export function EmptyColumnState({ onCreateColumn }: EmptyColumnStateProps) {
    return (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <CardHeader>
                <CardTitle className="text-2xl">No Columns Yet</CardTitle>
                <CardDescription>
                    This board has no columns. Create your first column to organize your tasks.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={onCreateColumn}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Column
                </Button>
            </CardContent>
        </Card>
    );
}