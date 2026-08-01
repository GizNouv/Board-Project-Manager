import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';
import { Route } from 'next';

export default function BoardNotFound() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Board Not Found</CardTitle>
                    <CardDescription className="text-center">
                        The board you're looking for doesn't exist or you don't have access to it.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Button asChild>
                        <Link href={ROUTES.boards}>Back to Boards</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}