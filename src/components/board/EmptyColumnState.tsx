import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateColumnDialog } from './CreateColumnDialog';

interface EmptyColumnStateProps {
    boardId: string;
}

export function EmptyColumnState({ boardId }: EmptyColumnStateProps) {
    return (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <CardHeader>
                <CardTitle className="text-2xl">No Columns Yet</CardTitle>
                <CardDescription>
                    This board has no columns. Create your first column to organize your tasks.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <CreateColumnDialog
                    boardId={boardId}
                    trigger={
                        <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                            <span className="mr-2">+</span>
                            Create First Column
                        </button>
                    }
                />
            </CardContent>
        </Card>
    );
}