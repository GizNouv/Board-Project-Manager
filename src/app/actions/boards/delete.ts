'use server';

import { createAction } from '@/lib/action-builder';
import { container } from '@/lib/di/container';
import { deleteBoardSchema, type DeleteBoardInput } from './types';

export const deleteBoardAction = createAction<DeleteBoardInput, void>({
  handler: async ({ input }) => {
    const boardService = container.getBoardService();
    const result = await boardService.deleteBoard(input.boardId);

    if (!result.isSuccess()) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      data: undefined,
    };
  },
})
.withValidation(deleteBoardSchema)
.withAuth()
.withRevalidation('/boards');