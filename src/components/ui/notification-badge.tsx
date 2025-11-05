import * as React from "react"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface NotificationBadgeProps {
  count?: number
  className?: string
  onClick?: () => void
}

export function NotificationBadge({ 
  count = 0, 
  className, 
  onClick 
}: NotificationBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
        className
      )}
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 flex items-center justify-center p-0 text-xs"
        >
          {count > 99 ? "99+" : count}
        </Badge>
      )}
    </button>
  )
}