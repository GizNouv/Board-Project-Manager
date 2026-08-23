'use server';

import { createAction } from '@/lib/action-builder';
import { container } from '@/lib/di/container';
import { updateBoardSchema, type UpdateBoardInput, type BoardDTO } from './types';

export const updateBoardAction = createAction<UpdateBoardInput, BoardDTO>({
  handler: async ({ input }) => {
    const boardService = container.getBoardService();
    
    const result = await boardService.updateBoard(input.boardId, {
      title: input.title,
    });

    if (!result.isSuccess()) {
      throw new Error(result.error.message);
    }

    const board = result.value;
    return {
      success: true,
      data: {
        id: board.id.toString(),
        title: board.title,
        ownerId: board.ownerId.toString(),
        createdAt: board.createdAt.toISOString(),
        updatedAt: board.updatedAt.toISOString(),
      },
    };
  },
})
.withValidation(updateBoardSchema)
.withAuth()
.withRevalidation(({ input }) => `/boards/${input.boardId}`);