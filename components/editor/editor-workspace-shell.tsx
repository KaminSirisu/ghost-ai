"use client";

import { useState } from "react";
import {
  Bot,
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
  Share2,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import {
  CanvasRoom,
  type CanvasTemplateImportRequest,
} from "@/components/editor/canvas-room";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectSiderbar } from "@/components/editor/project-siderbar";
import type { CanvasTemplate } from "@/components/editor/start-templates";
import { StartTemplatesModal } from "@/components/editor/start-templates-modal";
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
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [templateImportRequest, setTemplateImportRequest] =
    useState<CanvasTemplateImportRequest | null>(null);
  const projectActions = useProjectActions(activeProjectId);

  function selectProject(projectId: string) {
    projectActions.selectProject(projectId);
    setIsSidebarOpen(false);
  }

  function importTemplate(template: CanvasTemplate) {
    setTemplateImportRequest({
      id: Date.now(),
      template,
    });
  }

  return (
    <main className="relative h-screen overflow-hidden bg-base text-copy-primary">
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-surface-border bg-surface/95 px-4 backdrop-blur">
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
            onClick={() => setIsTemplatesOpen(true)}
          >
            <LayoutTemplate />
            Templates
          </Button>
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

      <section className="absolute inset-x-0 bottom-0 top-14 bg-base">
        <CanvasRoom
          roomId={activeProjectId}
          templateImportRequest={templateImportRequest}
        />
      </section>

      <aside
        className={[
          "fixed bottom-4 right-4 top-16 z-30 hidden w-80 flex-col rounded-2xl border border-surface-border bg-surface/90 px-4 py-5 shadow-2xl shadow-base/60 backdrop-blur transition-transform duration-300 md:flex",
          isAiSidebarOpen
            ? "translate-x-0"
            : "pointer-events-none translate-x-[calc(100%+1.5rem)]",
        ].join(" ")}
        aria-hidden={!isAiSidebarOpen}
      >
        <p className="text-sm font-semibold text-copy-primary">AI assistant</p>
        <p className="mt-2 text-sm leading-6 text-copy-muted">
          Chat controls and generation status will appear here later.
        </p>
      </aside>

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
      <StartTemplatesModal
        open={isTemplatesOpen}
        onImport={importTemplate}
        onOpenChange={setIsTemplatesOpen}
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
