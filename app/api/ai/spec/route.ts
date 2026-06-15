import { tasks } from "@trigger.dev/sdk";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  getCurrentClerkIdentity,
  getProjectForUserAccess,
} from "@/lib/project-access";
import type { generateSpec } from "@/trigger/generate-spec";

export const runtime = "nodejs";

const chatHistorySchema = z
  .array(
    z
      .object({
        content: z.string().min(1).max(4000),
        role: z.string().min(1).max(40).optional(),
        sender: z.string().min(1).max(120).optional(),
        timestamp: z.string().optional(),
      })
      .passthrough(),
  )
  .max(100);

const canvasNodeSchema = z
  .object({
    id: z.string().min(1).max(120),
  })
  .passthrough();

const canvasEdgeSchema = z
  .object({
    id: z.string().min(1).max(120),
    source: z.string().min(1).max(120),
    target: z.string().min(1).max(120),
  })
  .passthrough();

const specRequestSchema = z.object({
  roomId: z.string().trim().min(1),
  chatHistory: chatHistorySchema,
  nodes: z.array(canvasNodeSchema).max(200),
  edges: z.array(canvasEdgeSchema).max(300),
});

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

async function readSpecRequest(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    return specRequestSchema.safeParse(body);
  } catch {
    return specRequestSchema.safeParse(null);
  }
}

export async function POST(request: Request) {
  const body = await readSpecRequest(request);

  if (!body.success) {
    return Response.json(
      { error: "roomId, chatHistory, nodes, and edges are required" },
      { status: 400 },
    );
  }

  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    return unauthorized();
  }

  const project = await getProjectForUserAccess({
    projectId: body.data.roomId,
    userId: identity.userId,
    primaryEmail: identity.primaryEmail,
  });

  if (!project) {
    return forbidden();
  }

  const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
    projectId: project.id,
    roomId: body.data.roomId,
    chatHistory: body.data.chatHistory,
    nodes: body.data.nodes,
    edges: body.data.edges,
  });

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId: project.id,
      userId: identity.userId,
    },
  });

  return Response.json({ runId: handle.id }, { status: 201 });
}
