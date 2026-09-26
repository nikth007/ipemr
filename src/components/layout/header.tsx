"use client";

import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn, getInitials } from "@/lib/utils";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { data: session } = useSession();
  const notificationCount = 0;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-6">
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">IP EMR</span>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-card-foreground">{title}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button
          className={cn(
            "relative rounded-md p-2 text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-card-foreground"
          )}
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {notificationCount}
            </span>
          )}
        </button>

        {/* User avatar */}
        {session?.user && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {getInitials(session.user.name ?? "")}
          </div>
        )}
      </div>
    </header>
  );
}
