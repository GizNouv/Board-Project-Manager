'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ROUTES } from '@/config/routes';
import { BoardData } from '@/types/kanban';
import { Route } from 'next';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { ArrowRightCircle } from 'lucide-react';
import { ListTodo } from 'lucide-react';
import { SquareKanban } from 'lucide-react';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DashboardClientProps {
    board: BoardData;
    userName: string;
}

enum NavigationCardsIds {
    Boards,
    RecentBoard,
    Teams
}

type NavigationCards = {
    id: NavigationCardsIds
    title: string,
    description: string,
    href: (param?: string) => Route
    icon: LucideIcon
    isFeatureAvailable: boolean
}

const navigationCards: NavigationCards[] = [
    {
        id: NavigationCardsIds.Boards,
        title: "Your Boards",
        description: "View and manage your boards",
        href: () => ROUTES.boards,
        icon: SquareKanban,
        isFeatureAvailable: true
    },
    {
        id: NavigationCardsIds.RecentBoard,
        title: "Recent Tasks",
        description: "Track your recent activity",
        href: (boardId) => ROUTES.board(boardId ?? ''),
        icon: ListTodo,
        isFeatureAvailable: true
    },
    {
        id: NavigationCardsIds.Teams,
        title: "Team Updates",
        description: "See what your team is working on",
        href: () => '' as Route,
        icon: Users,
        isFeatureAvailable: false
    }
]

export function DashboardClient({ board: initialBoard, userName }: DashboardClientProps) {

    const { push } = useRouter()

    return (
        <div className="space-y-10">
            <div className="flex flex-col gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Welcome To Task Board Dashboard👋</h1>
                <p className="text-muted-foreground">
                    {userName}, Here you are able to track your boards, check your recent tasks and manage your teams.
                </p>
            </div>

            <div className='flex gap-5 *:flex-1 *:basis-[256px] flex-wrap'>
                {
                    navigationCards.map(card => {
                        return (
                            <Card
                                key={card.id}
                                className='cursor-pointer hover:bg-muted/80 transition-colors *:flex-1! group'
                                onClick={() => push(card.href(card.id === NavigationCardsIds.RecentBoard ? initialBoard.id : undefined))}
                            >
                                <CardHeader>
                                    <card.icon className='size-12 md:size-16!' />
                                </CardHeader>
                                <CardContent className='space-y-1'>
                                    <h2 className='text-xl font-bold'>{card.title}</h2>
                                    <p className='text-base text-muted-foreground'>{card.description}</p>
                                </CardContent>
                                <CardFooter className={cn('justify-end', !card.isFeatureAvailable && 'justify-between')}>
                                    {!card.isFeatureAvailable && <Badge>Will Be Available Soon</Badge>}
                                    <ArrowRightCircle size={32} className='opacity-80' />
                                </CardFooter>
                            </Card>
                        )
                    }
                    )
                }
            </div>
        </div>
    );
}