import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/editor/access-denied";
import { EditorWorkspaceShell } from "@/components/editor/editor-workspace-shell";
import {
  getCurrentClerkIdentity,
  getProjectForUserAccess,
} from "@/lib/project-access";
import { getEditorProjects } from "@/lib/projects";

interface EditorWorkspacePageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default async function EditorWorkspacePage({
  params,
}: EditorWorkspacePageProps) {
  const { roomId } = await params;
  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    redirect("/sign-in");
  }

  const project = await getProjectForUserAccess({
    projectId: roomId,
    userId: identity.userId,
    primaryEmail: identity.primaryEmail,
  });

  if (!project) {
    return <AccessDenied />;
  }

  const { ownedProjects, sharedProjects } = await getEditorProjects({
    userId: identity.userId,
    emailAddresses: identity.primaryEmail ? [identity.primaryEmail] : [],
  });

  return (
    <EditorWorkspaceShell
      activeProjectId={project.id}
      canManageAccess={project.ownerId === identity.userId}
      projectName={project.name}
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  );
}
