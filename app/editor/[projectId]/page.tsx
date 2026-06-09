import { auth, currentUser } from "@clerk/nextjs/server";

import { EditorShell } from "@/components/editor/editor-shell";
import { getEditorProjects } from "@/lib/projects";

interface EditorWorkspacePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function EditorWorkspacePage({
  params,
}: EditorWorkspacePageProps) {
  const { projectId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();
  const emailAddresses =
    user?.emailAddresses.map((email) => email.emailAddress) ?? [];
  const { ownedProjects, sharedProjects } = await getEditorProjects({
    userId,
    emailAddresses,
  });

  return (
    <EditorShell
      activeProjectId={projectId}
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  );
}
