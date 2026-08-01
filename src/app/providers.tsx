'use client';

import { SessionProvider } from '@/components/auth/SessionProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Session } from 'next-auth';

interface ProvidersProps {
    children: React.ReactNode;
    session?: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <SessionProvider session={session}>
                <TooltipProvider>
                    {children}
                </TooltipProvider>
            </SessionProvider>
        </ThemeProvider>
    );
}