import { requireUser } from '@/lib/session';
import { BoardApplicationService } from '@/core/application/services/BoardApplicationService';
import { PrismaBoardRepository } from '@/core/infrastructure/repositories/PrismaBoardRepository';
import { PrismaColumnRepository } from '@/core/infrastructure/repositories/PrismaColumnRepository';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';
import { CreateBoardDialog } from '@/components/board/CreateBoardDialog';

export default async function BoardsPage() {
  const user = await requireUser();

  const boardRepository = new PrismaBoardRepository();
  const columnRepository = new PrismaColumnRepository();
  const boardService = new BoardApplicationService(boardRepository, columnRepository);

  const boardsResult = await boardService.getBoardsByUser(user.id);

  if (boardsResult.isFailure()) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Boards</h1>
            <p className="text-muted-foreground">
              Manage your boards
            </p>
          </div>
          <CreateBoardDialog userId={user.id} />
        </div>
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <CardHeader>
            <CardTitle className="text-2xl">No Boards Found</CardTitle>
            <CardDescription>
              You don't have any boards yet. Create your first board to get started.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const boards = boardsResult.value;

  // Convert Domain Entities to plain objects for client components
  const boardDTOs = boards.map(board => ({
    id: board.id.toString(),
    title: board.title,
    columnCount: board.columnCount,
    createdAt: board.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Boards</h1>
          <p className="text-muted-foreground">
            Manage your boards
          </p>
        </div>
        <CreateBoardDialog userId={user.id} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {boardDTOs.map((board) => (
          <Link key={board.id} href={`/boards/${board.id}`}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
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
        ))}
      </div>
    </div>
  );
}