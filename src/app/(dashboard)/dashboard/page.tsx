import { requireUser } from '@/lib/session';
import { BoardApplicationService } from '@/core/application/services/BoardApplicationService';
import { PrismaBoardRepository } from '@/core/infrastructure/repositories/PrismaBoardRepository';
import { PrismaColumnRepository } from '@/core/infrastructure/repositories/PrismaColumnRepository';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await requireUser();

  // Instantiate repositories and services
  const boardRepository = new PrismaBoardRepository();
  const columnRepository = new PrismaColumnRepository();
  const boardService = new BoardApplicationService(boardRepository, columnRepository);

  // Load the user's first board
  const boardResult = await boardService.getFirstBoardByUser(user.id);

  // If no board exists, show empty state
  if (boardResult.isFailure()) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your task board. Get started by creating your first board.
          </p>
        </div>
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <CardHeader className='w-full'>
            <CardTitle className="text-2xl">No Board Found</CardTitle>
            <CardDescription>
              Create your first board to start organizing your tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Board
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const board = boardResult.value;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{board.title}</h1>
          <p className="text-muted-foreground">
            Manage your tasks and track progress
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {board.columns.map((column) => (
          <Card key={column.id.toString()} className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {column.title}
              </CardTitle>
              <CardDescription>
                {column.taskCount} tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
              {column.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks yet</p>
              ) : (
                column.tasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id.toString()}
                    className="rounded-md border bg-background p-3 text-sm"
                  >
                    <p className="font-medium">{task.title}</p>
                    {task.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {task.priority.value}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                        {task.type}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {column.taskCount > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{column.taskCount - 3} more tasks
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}