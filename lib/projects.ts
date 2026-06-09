import { prisma } from "@/lib/prisma";
import { EditorProject } from "@/lib/project-types";

interface GetEditorProjectsInput {
  userId: string;
  emailAddresses: string[];
}

function toEditorProject(
  project: { id: string; name: string },
  ownership: EditorProject["ownership"],
): EditorProject {
  return {
    id: project.id,
    name: project.name,
    roomId: project.id,
    ownership,
  };
}

export async function getEditorProjects({
  userId,
  emailAddresses,
}: GetEditorProjectsInput) {
  const [ownedProjects, sharedProjects] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    emailAddresses.length > 0
      ? prisma.project.findMany({
          where: {
            ownerId: { not: userId },
            collaborators: {
              some: {
                email: { in: emailAddresses },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  return {
    ownedProjects: ownedProjects.map((project) =>
      toEditorProject(project, "owned"),
    ),
    sharedProjects: sharedProjects.map((project) =>
      toEditorProject(project, "collaborator"),
    ),
  };
}
