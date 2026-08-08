import { CreateColumnDialog } from './CreateColumnDialog';

interface BoardHeaderProps {
    title: string;
    boardId: string;
    className?: string;
}

export function BoardHeader({ title, boardId, className }: BoardHeaderProps) {
    return (
        <div className={className}>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                    <p className="text-muted-foreground">
                        Manage your tasks and track progress
                    </p>
                </div>
                <CreateColumnDialog boardId={boardId} />
            </div>
        </div>
    );
}