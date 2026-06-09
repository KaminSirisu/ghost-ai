import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

interface ProjectRouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

interface RenameProjectRequest {
  name?: unknown;
}

function forbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

async function ownsProject(projectId: string, ownerId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  return project?.ownerId === ownerId;
}

async function readRenameProjectRequest(request: Request) {
  try {
    return (await request.json()) as RenameProjectRequest;
  } catch {
    return null;
  }
}

export async function PATCH(request: Request, context: ProjectRouteContext) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await context.params;

  if (!(await ownsProject(projectId, userId))) {
    return forbidden();
  }

  const body = await readRenameProjectRequest(request);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return Response.json({ error: "Project name is required" }, { status: 400 });
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { name },
  });

  return Response.json({ project });
}

export async function DELETE(_request: Request, context: ProjectRouteContext) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await context.params;

  if (!(await ownsProject(projectId, userId))) {
    return forbidden();
  }

  await prisma.project.delete({
    where: { id: projectId },
  });

  return Response.json({ success: true });
}
