import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateColumnDialog } from './CreateColumnDialog';
import { BoardMenu } from './BoardMenu';
import { EditBoardDialog } from './EditBoardDialog';
import { useAction } from '@/hooks/use-action';
import { deleteBoardAction } from '@/app/actions';

interface BoardHeaderProps {
  title: string;
  boardId: string;
  updatedAt?: string;
  className?: string;
}

export function BoardHeader({
  title,
  boardId,
  updatedAt,
  className,
}: BoardHeaderProps) {
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // useAction for delete mutation (loading/error states)
  const { execute: deleteBoard, isPending: isDeleting } = useAction(deleteBoardAction);

  const handleDelete = async () => {
    await deleteBoard(
      { boardId },
      {
        onSuccess: () => {
          router.push('/boards');
        }
      }
    );
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
      />
    </div>
  );
}