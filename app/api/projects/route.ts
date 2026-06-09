import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

interface CreateProjectRequest {
  id?: unknown;
  name?: unknown;
  description?: unknown;
}

function getProjectId(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const id = value.trim();
  return /^[a-z0-9-]{3,100}$/.test(id) ? id : undefined;
}

function getProjectName(value: unknown) {
  if (typeof value !== "string") {
    return "Untitled Project";
  }

  const name = value.trim();
  return name.length > 0 ? name : "Untitled Project";
}

function getProjectDescription(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const description = value.trim();
  return description.length > 0 ? description : null;
}

async function readCreateProjectRequest(request: Request) {
  try {
    return (await request.json()) as CreateProjectRequest;
  } catch {
    return {};
  }
}

export async function GET() {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ projects });
}

export async function POST(request: Request) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await readCreateProjectRequest(request);
  const id = getProjectId(body.id);
  const project = await prisma.project.create({
    data: {
      ...(id ? { id } : {}),
      ownerId: userId,
      name: getProjectName(body.name),
      description: getProjectDescription(body.description),
    },
  });

  return Response.json({ project }, { status: 201 });
}
