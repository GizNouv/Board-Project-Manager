import { useState } from 'react';
import { CreateColumnDialog } from './CreateColumnDialog';
import { BoardMenu } from './BoardMenu';
import { deleteBoardAction } from '@/app/actions';
import { ColumnData } from '@/types/kanban';
import { useRouter } from 'next/navigation';
import { EditBoardDialog } from './EditBoardDialog';

interface BoardHeaderProps {
  title: string;
  boardId: string;
  updatedAt?: string;
  className?: string;
  onColumnCreated?: (column: ColumnData) => void;
  onBoardUpdated?: (board: { id: string; title: string }) => void;
  onBoardDeleted?: () => void;
}

export function BoardHeader({
  title,
  boardId,
  updatedAt,
  className,
  onColumnCreated,
  onBoardUpdated,
  onBoardDeleted,
}: BoardHeaderProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteBoardAction({ boardId });
      if (result.success) {
        onBoardDeleted?.();
        router.push('/boards');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">
              Manage your tasks and track progress
              {updatedAt && (
                <span className="ml-2 text-xs text-muted-foreground/70">
                  Updated {new Date(updatedAt).toLocaleString()}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className='flex gap-2 items-center'>
          <CreateColumnDialog
            boardId={boardId}
            onColumnCreated={onColumnCreated}
          />
          <BoardMenu
            boardId={boardId}
            boardTitle={title}
            onEdit={() => setEditDialogOpen(true)}
            onDelete={handleDelete}
            isDeleting={isDeleting}
          />
        </div>
      </div>

      <EditBoardDialog
        board={{ id: boardId, title }}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onBoardUpdated={onBoardUpdated}
      />
    </div>
  );
}