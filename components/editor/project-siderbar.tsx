"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EditorProject } from "@/lib/project-types"
import { Pencil, Plus, Trash2, XIcon } from "lucide-react"

interface ProjectSiderbarProps {
  isOpen: boolean
  onClose: () => void
  ownedProjects: EditorProject[]
  sharedProjects: EditorProject[]
  activeProjectId: string | null
  onNewProject: () => void
  onSelectProject: (projectId: string) => void
  onRenameProject: (project: EditorProject) => void
  onDeleteProject: (project: EditorProject) => void
}

export function ProjectSiderbar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  activeProjectId,
  onNewProject,
  onSelectProject,
  onRenameProject,
  onDeleteProject,
}: ProjectSiderbarProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-base/70 backdrop-blur-sm transition-opacity duration-300 md:bg-base/45",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!isOpen}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col border-r border-surface-border bg-sidebar/95 px-4 py-5 shadow-2xl shadow-base/60 backdrop-blur transition-transform duration-300",
          isOpen
            ? "translate-x-0"
            : "pointer-events-none -translate-x-[calc(100%+1.5rem)]"
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
              <ProjectList
                projects={ownedProjects}
                activeProjectId={activeProjectId}
                emptyTitle="No projects yet"
                emptyDescription="Create a new project to start organizing your work."
                showActions
                onSelectProject={onSelectProject}
                onRenameProject={onRenameProject}
                onDeleteProject={onDeleteProject}
              />
            </TabsContent>

            <TabsContent value="shared" className="space-y-4 pt-4">
              <ProjectList
                projects={sharedProjects}
                activeProjectId={activeProjectId}
                emptyTitle="No shared projects"
                emptyDescription="Shared projects will appear here once they are available."
                showActions={false}
                onSelectProject={onSelectProject}
                onRenameProject={onRenameProject}
                onDeleteProject={onDeleteProject}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-auto pt-4">
          <Button
            className="justify-center w-full"
            size="lg"
            type="button"
            onClick={onNewProject}
          >
            <Plus className="mr-2" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}

interface ProjectListProps {
  projects: EditorProject[]
  activeProjectId: string | null
  emptyTitle: string
  emptyDescription: string
  showActions: boolean
  onSelectProject: (projectId: string) => void
  onRenameProject: (project: EditorProject) => void
  onDeleteProject: (project: EditorProject) => void
}

function ProjectList({
  projects,
  activeProjectId,
  emptyTitle,
  emptyDescription,
  showActions,
  onSelectProject,
  onRenameProject,
  onDeleteProject,
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="bg-background/80 p-6 border border-border rounded-2xl text-muted-foreground text-sm">
        <p className="font-medium text-foreground">{emptyTitle}</p>
        <p className="mt-2">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <div
          key={project.id}
          className={cn(
            "group flex items-center gap-2 rounded-2xl border border-border bg-background/80 p-2 transition-colors hover:bg-muted/60",
            activeProjectId === project.id &&
              "border-primary/70 bg-accent text-accent-foreground"
          )}
        >
          <button
            type="button"
            className="min-w-0 flex-1 rounded-xl px-2 py-1.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => onSelectProject(project.id)}
          >
            <span className="block truncate font-medium text-foreground text-sm">
              {project.name}
            </span>
            <span className="mt-1 block truncate font-mono text-muted-foreground text-xs">
              {project.roomId}
            </span>
          </button>

          {showActions && (
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <Button
                variant="ghost"
                size="icon-sm"
                type="button"
                aria-label={`Rename ${project.name}`}
                onClick={() => onRenameProject(project)}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                type="button"
                aria-label={`Delete ${project.name}`}
                onClick={() => onDeleteProject(project)}
              >
                <Trash2 />
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
