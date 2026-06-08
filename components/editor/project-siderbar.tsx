"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, XIcon } from "lucide-react"

interface ProjectSiderbarProps {
  isOpen: boolean
  onClose: () => void
}

export function ProjectSiderbar({ isOpen, onClose }: ProjectSiderbarProps) {
  return (
    <>
      <div
        className={cn(
          "z-40 fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!isOpen}
        onClick={onClose}
      />

      <aside
        className={cn(
          "left-0 z-50 fixed inset-y-0 flex flex-col bg-sidebar shadow-2xl shadow-black/40 px-4 py-5 border-border border-r w-full max-w-sm transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex justify-between items-center gap-4">
          <div>
            <p className="font-semibold text-foreground text-sm">Projects</p>
            <p className="text-muted-foreground text-xs">Manage and access your project workspaces.</p>
          </div>
          <Button variant="ghost" size="icon" type="button" onClick={onClose} aria-label="Close projects sidebar">
            <XIcon />
          </Button>
        </div>

        <div className="flex-1 mt-6 pr-1 overflow-y-auto">
          <Tabs defaultValue="my-projects" className="space-y-4">
            <TabsList className="w-full" variant="line">
              <TabsTrigger value="my-projects" className="w-1/2">
                My Projects
              </TabsTrigger>
              <TabsTrigger value="shared" className="w-1/2">
                Shared
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-projects" className="space-y-4 pt-4">
              <div className="bg-background/80 p-6 border border-border rounded-2xl text-muted-foreground text-sm">
                <p className="font-medium text-foreground">No projects yet</p>
                <p className="mt-2">Create a new project to start organizing your work.</p>
              </div>
            </TabsContent>

            <TabsContent value="shared" className="space-y-4 pt-4">
              <div className="bg-background/80 p-6 border border-border rounded-2xl text-muted-foreground text-sm">
                <p className="font-medium text-foreground">No shared projects</p>
                <p className="mt-2">Shared projects will appear here once they are available.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-auto pt-4">
          <Button className="justify-center w-full" size="lg" type="button">
            <Plus className="mr-2" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}
