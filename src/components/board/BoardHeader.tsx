interface BoardHeaderProps {
    title: string;
    className?: string;
}

export function BoardHeader({ title, className }: BoardHeaderProps) {
    return (
        <div className={className}>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">
                Manage your tasks and track progress
            </p>
        </div>
    );
}