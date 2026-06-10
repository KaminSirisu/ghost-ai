"use client";

import { useState } from "react";
import { Bot, PanelLeftClose, PanelLeftOpen, Share2 } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectSiderbar } from "@/components/editor/project-siderbar";
import { ShareDialog } from "@/components/editor/share-dialog";
import { Button } from "@/components/ui/button";
import { useProjectActions } from "@/hooks/use-project-actions";
import { EditorProject } from "@/lib/project-types";

interface EditorWorkspaceShellProps {
  activeProjectId: string;
  canManageAccess: boolean;
  projectName: string;
  ownedProjects: EditorProject[];
  sharedProjects: EditorProject[];
}

export function EditorWorkspaceShell({
  activeProjectId,
  canManageAccess,
  projectName,
  ownedProjects,
  sharedProjects,
}: EditorWorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const projectActions = useProjectActions(activeProjectId);

  function selectProject(projectId: string) {
    projectActions.selectProject(projectId);
    setIsSidebarOpen(false);
  }

  return (
    <main className="flex min-h-screen flex-col bg-base text-copy-primary">
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-surface-border bg-surface px-4 shadow-sm shadow-black/10">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            onClick={() => setIsSidebarOpen((isOpen) => !isOpen)}
          >
            {isSidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-copy-primary">
              {projectName}
            </p>
            <p className="truncate font-mono text-xs text-copy-muted">
              {activeProjectId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => setIsShareOpen(true)}
          >
            <Share2 />
            Share
          </Button>
          <Button
            variant={isAiSidebarOpen ? "secondary" : "ghost"}
            size="icon"
            type="button"
            aria-label={isAiSidebarOpen ? "Hide AI sidebar" : "Show AI sidebar"}
            aria-pressed={isAiSidebarOpen}
            onClick={() => setIsAiSidebarOpen((isOpen) => !isOpen)}
          >
            <Bot />
          </Button>
          <UserButton />
        </div>
      </header>

      <ProjectSiderbar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        activeProjectId={activeProjectId}
        onNewProject={projectActions.openCreateDialog}
        onSelectProject={selectProject}
        onRenameProject={projectActions.openRenameDialog}
        onDeleteProject={projectActions.openDeleteDialog}
      />

      <div className="grid min-h-screen pt-14 md:grid-cols-[1fr_auto]">
        <section className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-base px-6">
          <div className="rounded-2xl border border-surface-border bg-surface/70 px-6 py-5 text-center">
            <p className="text-sm font-medium text-copy-primary">
              Canvas workspace placeholder
            </p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-copy-muted">
              Real-time canvas editing will be added in a later feature unit.
            </p>
          </div>
        </section>

        {isAiSidebarOpen && (
          <aside className="hidden w-80 border-l border-surface-border bg-surface px-4 py-5 md:block">
            <div className="rounded-2xl border border-surface-border bg-elevated p-4">
              <p className="text-sm font-semibold text-copy-primary">
                AI assistant
              </p>
              <p className="mt-2 text-sm leading-6 text-copy-muted">
                Chat controls and generation status will appear here later.
              </p>
            </div>
          </aside>
        )}
      </div>

      <ProjectDialogs
        createName={projectActions.createName}
        createOpen={projectActions.createOpen}
        createRoomId={projectActions.createRoomId}
        deleteProject={projectActions.deleteProject}
        isMutating={projectActions.isMutating}
        mutationError={projectActions.mutationError}
        renameName={projectActions.renameName}
        renameProject={projectActions.renameProject}
        onCreateNameChange={projectActions.setCreateName}
        onCreateOpenChange={projectActions.setCreateOpen}
        onCreateProject={projectActions.createProject}
        onDeleteOpenChange={projectActions.setDeleteOpen}
        onDeleteProject={projectActions.deleteSelectedProject}
        onRenameNameChange={projectActions.setRenameName}
        onRenameOpenChange={projectActions.setRenameOpen}
        onRenameProject={projectActions.renameSelectedProject}
      />
      <ShareDialog
        canManageAccess={canManageAccess}
        open={isShareOpen}
        projectId={activeProjectId}
        projectName={projectName}
        onOpenChange={setIsShareOpen}
      />
    </main>
  );
}
