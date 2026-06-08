"use client"

import { UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

interface EditorNavbarProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
}: EditorNavbarProps) {
  return (
    <header className="top-0 z-40 fixed inset-x-0 flex justify-between items-center bg-sidebar shadow-black/10 shadow-sm px-4 border-border border-b h-14 text-foreground">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          onClick={onToggleSidebar}
        >
          {isSidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>
      </div>

      <div className="flex-1 font-medium text-muted-foreground text-sm text-center">
        {/* center section reserved for future editor controls */}
      </div>

      <div className="flex items-center gap-2">
        <UserButton />
      </div>
    </header>
  )
}
