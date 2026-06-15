import { get, put } from "@vercel/blob";

import { prisma } from "@/lib/prisma";
import {
  getCurrentClerkIdentity,
  getProjectForUserAccess,
} from "@/lib/project-access";
import type { CanvasSnapshot } from "@/types/canvas";

export const runtime = "nodejs";

interface CanvasRouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

interface CanvasRequestBody {
  edges?: unknown;
  nodes?: unknown;
}

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

function isCanvasRequestBody(value: unknown): value is CanvasRequestBody {
  return Boolean(value && typeof value === "object");
}

function isCanvasSnapshot(value: unknown): value is CanvasSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as Partial<CanvasSnapshot>;

  return (
    Array.isArray(snapshot.nodes) &&
    Array.isArray(snapshot.edges) &&
    typeof snapshot.savedAt === "string"
  );
}

async function getAccessibleProject(projectId: string) {
  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    return {
      response: unauthorized(),
      project: null,
    };
  }

  const project = await getProjectForUserAccess({
    projectId,
    userId: identity.userId,
    primaryEmail: identity.primaryEmail,
  });

  if (!project) {
    return {
      response: forbidden(),
      project: null,
    };
  }

  return {
    response: null,
    project,
  };
}

async function readCanvasBody(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    if (!isCanvasRequestBody(body)) {
      return null;
    }

    if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
      return null;
    }

    return {
      nodes: body.nodes,
      edges: body.edges,
    };
  } catch {
    return null;
  }
}

export async function GET(_request: Request, context: CanvasRouteContext) {
  const { projectId } = await context.params;
  const { response } = await getAccessibleProject(projectId);

  if (response) {
    return response;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });

  if (!project?.canvasJsonPath) {
    return Response.json({ canvas: null });
  }

  const blobResult = await get(project.canvasJsonPath, {
    access: "private",
    useCache: false,
  });

  if (!blobResult || blobResult.statusCode !== 200) {
    return Response.json(
      { error: "Saved canvas could not be loaded" },
      { status: 502 },
    );
  }

  const canvas = (await new Response(blobResult.stream).json()) as unknown;

  if (!isCanvasSnapshot(canvas)) {
    return Response.json(
      { error: "Saved canvas is invalid" },
      { status: 502 },
    );
  }

  return Response.json({ canvas });
}

export async function PUT(request: Request, context: CanvasRouteContext) {
  const { projectId } = await context.params;
  const { response } = await getAccessibleProject(projectId);

  if (response) {
    return response;
  }

  const body = await readCanvasBody(request);

  if (!body) {
    return Response.json(
      { error: "Canvas nodes and edges are required" },
      { status: 400 },
    );
  }

  const canvas = {
    edges: body.edges,
    nodes: body.nodes,
    savedAt: new Date().toISOString(),
  } satisfies CanvasSnapshot;
  const blob = await put(
    `canvas/${projectId}.json`,
    JSON.stringify(canvas),
    {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    },
  );

  await prisma.project.update({
    where: { id: projectId },
    data: {
      canvasJsonPath: blob.url,
    },
  });

  return Response.json({
    canvasJsonPath: blob.url,
    savedAt: canvas.savedAt,
  });
}
