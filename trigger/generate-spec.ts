import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { logger, metadata, task } from "@trigger.dev/sdk";
import { put } from "@vercel/blob";
import { generateText } from "ai";
import { randomUUID } from "crypto";
import { z } from "zod";

const chatMessageSchema = z
  .object({
    content: z.string().min(1).max(4000),
    role: z.string().min(1).max(40).optional(),
    sender: z.string().min(1).max(120).optional(),
    timestamp: z.string().optional(),
  })
  .passthrough();

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

const generateSpecPayloadSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(chatMessageSchema).max(100),
  nodes: z.array(canvasNodeSchema).max(200),
  edges: z.array(canvasEdgeSchema).max(300),
});

export type GenerateSpecPayload = z.infer<typeof generateSpecPayloadSchema>;

export const generateSpec = task({
  id: "generate-spec",
  run: async (payload: GenerateSpecPayload) => {
    metadata.set("status", "validating-input");

    const parsedPayload = generateSpecPayloadSchema.parse(payload);

    logger.info("Spec generation started", {
      projectId: parsedPayload.projectId,
      roomId: parsedPayload.roomId,
      chatMessageCount: parsedPayload.chatHistory.length,
      nodeCount: parsedPayload.nodes.length,
      edgeCount: parsedPayload.edges.length,
    });

    metadata
      .set("status", "generating-markdown")
      .set("projectId", parsedPayload.projectId)
      .set("roomId", parsedPayload.roomId)
      .set("nodeCount", parsedPayload.nodes.length)
      .set("edgeCount", parsedPayload.edges.length);

    try {
      const markdown = await generateMarkdownSpec(parsedPayload);
      const spec = await persistMarkdownSpec({
        markdown,
        projectId: parsedPayload.projectId,
      });

      metadata
        .set("status", "completed")
        .set("specId", spec.id)
        .set("completedAt", new Date().toISOString());

      logger.info("Spec generation completed", {
        projectId: parsedPayload.projectId,
        roomId: parsedPayload.roomId,
        specId: spec.id,
        markdownLength: markdown.length,
      });

      return {
        projectId: parsedPayload.projectId,
        specId: spec.id,
        createdAt: spec.createdAt.toISOString(),
        downloadPath: `/api/projects/${parsedPayload.projectId}/specs/${spec.id}/download`,
      };
    } catch (error) {
      const message = getErrorMessage(error);

      metadata.set("status", "failed").set("error", message);
      logger.error("Spec generation failed", {
        projectId: parsedPayload.projectId,
        roomId: parsedPayload.roomId,
        error: message,
      });

      throw error;
    }
  },
});

async function persistMarkdownSpec({
  markdown,
  projectId,
}: {
  markdown: string;
  projectId: string;
}) {
  metadata.set("status", "persisting-spec");

  const specId = randomUUID();
  const blob = await put(`specs/${projectId}/${specId}.md`, markdown, {
    access: "private",
    allowOverwrite: false,
    contentType: "text/markdown; charset=utf-8",
    cacheControlMaxAge: 60,
  });
  const { prisma } = await import("@/lib/prisma");

  return prisma.projectSpec.create({
    data: {
      id: specId,
      projectId,
      filePath: blob.url,
    },
    select: {
      id: true,
      createdAt: true,
    },
  });
}

async function generateMarkdownSpec(payload: GenerateSpecPayload) {
  const google = createGoogleGenerativeAI({
    apiKey: getGeminiApiKey(),
  });

  const result = await generateText({
    model: google("gemini-2.5-flash"),
    system: buildSystemPrompt(),
    prompt: buildUserPrompt(payload),
    temperature: 0.2,
  });

  return normalizeMarkdown(result.text);
}

function buildSystemPrompt() {
  return [
    "You are Ghost AI, a senior system architecture specification writer.",
    "Generate a practical Markdown technical specification from the provided architecture canvas and chat history.",
    "Return only Markdown. Do not wrap the response in code fences.",
    "Use concrete names from the canvas. Do not invent persistence, UI, billing, or operational details that are not supported by the canvas or chat history.",
    "Prefer concise sections that an engineering team can implement from.",
  ].join("\n");
}

function buildUserPrompt(payload: GenerateSpecPayload) {
  return [
    `Project ID: ${payload.projectId}`,
    `Room ID: ${payload.roomId}`,
    "",
    "Canvas nodes:",
    JSON.stringify(payload.nodes.map(summarizeNode), null, 2),
    "",
    "Canvas edges:",
    JSON.stringify(payload.edges.map(summarizeEdge), null, 2),
    "",
    "Chat history:",
    JSON.stringify(payload.chatHistory.map(summarizeChatMessage), null, 2),
    "",
    "Required Markdown outline:",
    "# Technical Specification",
    "## Overview",
    "## Architecture",
    "## Components",
    "## Data Flow",
    "## APIs and Integrations",
    "## Storage and State",
    "## Operational Considerations",
    "## Open Questions",
  ].join("\n");
}

function summarizeNode(node: Record<string, unknown>) {
  const data = isRecord(node.data) ? node.data : {};
  const position = isRecord(node.position) ? node.position : {};

  return {
    id: node.id,
    label: data.label,
    shape: data.shape,
    position,
    width: node.width,
    height: node.height,
  };
}

function summarizeEdge(edge: Record<string, unknown>) {
  const data = isRecord(edge.data) ? edge.data : {};

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: data.label,
  };
}

function summarizeChatMessage(message: Record<string, unknown>) {
  return {
    role: message.role,
    sender: message.sender,
    content: message.content,
    timestamp: message.timestamp,
  };
}

function normalizeMarkdown(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Ghost AI returned an empty spec.");
  }

  return trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getGeminiApiKey() {
  const apiKey =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is required for spec generation.",
    );
  }

  return apiKey;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}
