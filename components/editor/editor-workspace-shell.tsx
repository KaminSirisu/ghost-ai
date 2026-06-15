"use client";

import { useCallback, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LayoutTemplate,
  LoaderCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Share2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

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
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave";
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
  const [canvasSaveStatus, setCanvasSaveStatus] =
    useState<CanvasSaveStatus>("idle");
  const [saveCanvas, setSaveCanvas] = useState<(() => Promise<void>) | null>(
    null,
  );
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

  const handleSaveCanvasReady = useCallback(
    (nextSaveCanvas: (() => Promise<void>) | null) => {
      setSaveCanvas(() => nextSaveCanvas);
    },
    [],
  );

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
          <CanvasSaveButton
            onSave={saveCanvas}
            status={canvasSaveStatus}
          />
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
            variant={isAiSidebarOpen ? "default" : "ghost"}
            size="sm"
            type="button"
            className={
              isAiSidebarOpen
                ? "bg-brand text-base hover:bg-brand/90"
                : "text-copy-muted hover:text-copy-primary"
            }
            aria-label={isAiSidebarOpen ? "Hide AI sidebar" : "Show AI sidebar"}
            aria-pressed={isAiSidebarOpen}
            onClick={() => setIsAiSidebarOpen((isOpen) => !isOpen)}
          >
            <Sparkles />
            AI
          </Button>
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
          key={activeProjectId}
          isAiSidebarOpen={isAiSidebarOpen}
          onAiSidebarClose={() => setIsAiSidebarOpen(false)}
          onSaveCanvasReady={handleSaveCanvasReady}
          onSaveStatusChange={setCanvasSaveStatus}
          roomId={activeProjectId}
          templateImportRequest={templateImportRequest}
        />
      </section>

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

interface CanvasSaveButtonProps {
  onSave: (() => Promise<void>) | null;
  status: CanvasSaveStatus;
}

function CanvasSaveButton({ onSave, status }: CanvasSaveButtonProps) {
  const statusConfig = {
    error: {
      icon: AlertCircle,
      label: "Error",
      title: "Canvas autosave failed",
      className: "border-state-error/50 text-state-error",
    },
    idle: {
      icon: null,
      label: "Save",
      title: "Save canvas",
      className: "text-copy-muted",
    },
    saved: {
      icon: CheckCircle2,
      label: "Saved",
      title: "Canvas saved",
      className: "text-copy-muted",
    },
    saving: {
      icon: LoaderCircle,
      label: "Saving...",
      title: "Saving canvas",
      className: "text-brand",
    },
  } satisfies Record<
    CanvasSaveStatus,
    {
      className: string;
      icon: LucideIcon | null;
      label: string;
      title: string;
    }
  >;
  const { className, icon: StatusIcon, label, title } = statusConfig[status];

  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      className={className}
      aria-label={title}
      aria-live="polite"
      disabled={!onSave || status === "saving"}
      title={title}
      onClick={() => {
        void onSave?.();
      }}
    >
      {StatusIcon ? (
        status === "saving" ? (
          <StatusIcon className="animate-spin" />
        ) : (
          <StatusIcon />
        )
      ) : null}
      {label}
    </Button>
  );
}
