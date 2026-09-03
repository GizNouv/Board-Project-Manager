import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateBoardDialog } from '../board/CreateBoardDialog';

interface BoardEmptyStateProps {
    userId: string;
}

export function BoardEmptyState({ userId }: BoardEmptyStateProps) {
    return (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <CardHeader className='w-full'>
                <CardTitle className="text-2xl">No Boards Found</CardTitle>
                <CardDescription>
                    You don't have any boards yet. Create your first board to get started.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <CreateBoardDialog userId={userId} />
            </CardContent>
        </Card>
    );
}