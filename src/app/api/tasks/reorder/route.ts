import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/di/container';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { columnId, orderedTaskIds } = body;

        const boardService = container.getBoardService();
        const result = await boardService.reorderTasks(columnId, orderedTaskIds);

        if (!result.isSuccess()) {
            return NextResponse.json(
                { success: false, message: result.error.message },
                { status: 400 }
            );
        }

        revalidatePath(`/boards/${columnId}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    }
}