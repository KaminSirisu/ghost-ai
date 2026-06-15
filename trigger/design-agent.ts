import {
  createGoogleGenerativeAI,
  type GoogleGenerativeAIProviderOptions,
} from "@ai-sdk/google";
import { logger, task } from "@trigger.dev/sdk";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { generateObject, jsonSchema } from "ai";
import { z } from "zod";

import { getLiveblocksClient } from "@/lib/liveblocks-client";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_SIZES,
  NODE_COLORS,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeData,
  type NodeShape,
} from "@/types/canvas";

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

type DesignAction =
  | {
      action: "add_node";
      id?: string;
      label: string;
      shape?: NodeShape;
      color?: string;
      textColor?: string;
      x: number;
      y: number;
      width?: number;
      height?: number;
    }
  | {
      action: "move_node";
      id: string;
      x: number;
      y: number;
    }
  | {
      action: "resize_node";
      id: string;
      width: number;
      height: number;
    }
  | {
      action: "update_node_data";
      id: string;
      label?: string;
      shape?: NodeShape;
      color?: string;
      textColor?: string;
    }
  | {
      action: "delete_node";
      id: string;
    }
  | {
      action: "add_edge";
      id?: string;
      source: string;
      target: string;
      label?: string;
    }
  | {
      action: "delete_edge";
      id: string;
    };

interface DesignPlan {
  summary: string;
  actions: DesignAction[];
}

type AiStatusLevel = "info" | "success" | "error";

const AI_USER_ID = "ghost-ai-agent";
const AI_USER_INFO = {
  name: "Ghost AI",
  avatar: "",
  color: "#8b82ff",
};
const DEFAULT_EDGE_MARKER = {
  type: "arrowclosed",
  color: "var(--text-muted)",
  width: 14,
  height: 14,
} as const;
const EDGE_INTERACTION_WIDTH = 24;
const MIN_NODE_WIDTH = 80;
const MIN_NODE_HEIGHT = 56;
const MAX_NODE_WIDTH = 320;
const MAX_NODE_HEIGHT = 220;
const MIN_SPACING = 180;
const MAX_DESIGN_ACTIONS = 24;
const MAX_DESIGN_GENERATION_ATTEMPTS = 2;
const designActionValidationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("add_node"),
    id: z.string().min(1).max(80).optional(),
    label: z.string().min(1).max(80),
    shape: z.enum(NODE_SHAPES).optional(),
    color: z.string().optional(),
    textColor: z.string().optional(),
    x: z.number(),
    y: z.number(),
    width: z.number().optional(),
    height: z.number().optional(),
  }),
  z.object({
    action: z.literal("move_node"),
    id: z.string().min(1).max(80),
    x: z.number(),
    y: z.number(),
  }),
  z.object({
    action: z.literal("resize_node"),
    id: z.string().min(1).max(80),
    width: z.number(),
    height: z.number(),
  }),
  z.object({
    action: z.literal("update_node_data"),
    id: z.string().min(1).max(80),
    label: z.string().min(1).max(80).optional(),
    shape: z.enum(NODE_SHAPES).optional(),
    color: z.string().optional(),
    textColor: z.string().optional(),
  }),
  z.object({
    action: z.literal("delete_node"),
    id: z.string().min(1).max(80),
  }),
  z.object({
    action: z.literal("add_edge"),
    id: z.string().min(1).max(80).optional(),
    source: z.string().min(1).max(80),
    target: z.string().min(1).max(80),
    label: z.string().min(1).max(80).optional(),
  }),
  z.object({
    action: z.literal("delete_edge"),
    id: z.string().min(1).max(80),
  }),
]);
const designPlanValidationSchema = z.object({
  summary: z.string().min(1).max(240),
  actions: z.array(designActionValidationSchema).min(1).max(MAX_DESIGN_ACTIONS),
});
const designPlanSchema = jsonSchema<DesignPlan>({
  type: "object",
  additionalProperties: false,
  required: ["summary", "actions"],
  properties: {
    summary: {
      type: "string",
      maxLength: 240,
    },
    actions: {
      type: "array",
      minItems: 1,
      maxItems: MAX_DESIGN_ACTIONS,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["action"],
        properties: {
          action: {
            type: "string",
            enum: [
              "add_node",
              "move_node",
              "resize_node",
              "update_node_data",
              "delete_node",
              "add_edge",
              "delete_edge",
            ],
          },
          id: { type: "string", minLength: 1, maxLength: 80 },
          label: { type: "string", maxLength: 80 },
          shape: { type: "string", enum: [...NODE_SHAPES] },
          color: {
            type: "string",
            enum: NODE_COLORS.map((color) => color.fill),
          },
          textColor: {
            type: "string",
            enum: NODE_COLORS.map((color) => color.text),
          },
          x: { type: "number" },
          y: { type: "number" },
          width: { type: "number" },
          height: { type: "number" },
          source: { type: "string", minLength: 1, maxLength: 80 },
          target: { type: "string", minLength: 1, maxLength: 80 },
        },
      },
    },
  },
});

export const designAgent = task({
  id: "design-agent",
  run: async (payload: DesignAgentPayload) => {
    const liveblocks = getLiveblocksClient();

    await publishStatus(liveblocks, payload.roomId, "info", "Ghost AI started.");
    await setAiPresence(liveblocks, payload.roomId, {
      cursor: { x: 0, y: 0 },
      thinking: true,
    });

    try {
      const currentCanvas = await readCanvas(liveblocks, payload.roomId);

      await publishStatus(
        liveblocks,
        payload.roomId,
        "info",
        "Interpreting the design prompt.",
      );
      await setAiPresence(liveblocks, payload.roomId, {
        cursor: estimateFocusCursor(currentCanvas.nodes),
        thinking: true,
      });

      const plan = await generateDesignPlan(payload.prompt, currentCanvas);
      const actionCount = plan.actions.length;

      logger.info("Design agent generated plan", {
        roomId: payload.roomId,
        summary: plan.summary,
        actionCount,
      });

      await publishStatus(
        liveblocks,
        payload.roomId,
        "info",
        `Applying ${actionCount} canvas update${actionCount === 1 ? "" : "s"}.`,
      );

      const applied = await applyDesignPlan(liveblocks, payload.roomId, plan);

      await publishStatus(
        liveblocks,
        payload.roomId,
        "success",
        `Design complete: ${applied} update${applied === 1 ? "" : "s"} applied.`,
      );

      return {
        roomId: payload.roomId,
        summary: plan.summary,
        actionsGenerated: actionCount,
        actionsApplied: applied,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      const message = getErrorMessage(error);

      logger.error("Design agent failed", {
        error: message,
        roomId: payload.roomId,
      });
      await publishStatus(
        liveblocks,
        payload.roomId,
        "error",
        `Design failed: ${message}`,
      );

      throw error;
    } finally {
      await setAiPresence(liveblocks, payload.roomId, {
        cursor: null,
        thinking: false,
      });
    }
  },
});

async function readCanvas(
  liveblocks: ReturnType<typeof getLiveblocksClient>,
  roomId: string,
) {
  let snapshot: { nodes: readonly CanvasNode[]; edges: readonly CanvasEdge[] } = {
    edges: [],
    nodes: [],
  };

  await mutateFlow<CanvasNode, CanvasEdge>(
    {
      client: liveblocks,
      roomId,
    },
    (flow) => {
      snapshot = flow.toJSON();
    },
  );

  return {
    edges: [...snapshot.edges],
    nodes: [...snapshot.nodes],
  };
}

async function generateDesignPlan(
  prompt: string,
  canvas: { nodes: CanvasNode[]; edges: CanvasEdge[] },
) {
  const google = createGoogleGenerativeAI({
    apiKey: getGeminiApiKey(),
  });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_DESIGN_GENERATION_ATTEMPTS; attempt += 1) {
    try {
      const result = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: designPlanSchema,
        schemaName: "DesignPlan",
        schemaDescription:
          "A JSON object describing the architecture canvas update plan.",
        providerOptions: {
          google: {
            structuredOutputs: false,
          } satisfies GoogleGenerativeAIProviderOptions,
        },
        experimental_repairText: async ({ text }) => {
          return extractJsonObjectText(text);
        },
        system: buildDesignSystemPrompt({ attempt }),
        prompt: buildDesignUserPrompt({ prompt, canvas, attempt }),
        temperature: 0.2,
      });

      return normalizeDesignPlan(result.object);
    } catch (error) {
      const normalizedError =
        error instanceof Error
          ? error
          : new Error("Ghost AI could not produce a valid design plan.");

      lastError = normalizedError;

      logger.warn("Design agent generation attempt failed", {
        attempt,
        error: normalizedError.message,
      });
    }
  }

  throw lastError ?? new Error("Ghost AI could not produce a valid design plan.");
}

async function applyDesignPlan(
  liveblocks: ReturnType<typeof getLiveblocksClient>,
  roomId: string,
  plan: DesignPlan,
) {
  let applied = 0;

  await mutateFlow<CanvasNode, CanvasEdge>(
    {
      client: liveblocks,
      roomId,
    },
    (flow) => {
      const knownNodeIds = new Set(flow.nodes.map((node) => node.id));
      const knownEdgeIds = new Set(flow.edges.map((edge) => edge.id));
      const nodeReferenceIds = createNodeReferenceIndex(flow.nodes);
      const nodeLabelsById = createNodeLabelIndex(flow.nodes);
      const createdNodeIds: string[] = [];

      for (const action of plan.actions) {
        if (action.action === "add_node") {
          const node = createNode(action, knownNodeIds);
          flow.addNode(node);
          knownNodeIds.add(node.id);
          nodeLabelsById.set(node.id, node.data.label);
          createdNodeIds.push(node.id);
          registerNodeReferences(nodeReferenceIds, node);

          if (action.id) {
            registerNodeReference(nodeReferenceIds, action.id, node.id);
          }

          applied += 1;
          continue;
        }

        if (action.action === "move_node") {
          const nodeId = resolveNodeReference(nodeReferenceIds, action.id);

          if (!nodeId || !knownNodeIds.has(nodeId)) {
            continue;
          }

          flow.updateNode(nodeId, {
            position: {
              x: roundCanvasNumber(action.x),
              y: roundCanvasNumber(action.y),
            },
          });
          applied += 1;
          continue;
        }

        if (action.action === "resize_node") {
          const nodeId = resolveNodeReference(nodeReferenceIds, action.id);

          if (!nodeId || !knownNodeIds.has(nodeId)) {
            continue;
          }

          const width = clampSize(action.width, MIN_NODE_WIDTH, MAX_NODE_WIDTH);
          const height = clampSize(action.height, MIN_NODE_HEIGHT, MAX_NODE_HEIGHT);

          flow.updateNode(nodeId, {
            height,
            initialHeight: height,
            initialWidth: width,
            width,
          });
          applied += 1;
          continue;
        }

        if (action.action === "update_node_data") {
          const nodeId = resolveNodeReference(nodeReferenceIds, action.id);

          if (!nodeId || !knownNodeIds.has(nodeId)) {
            continue;
          }

          const node = flow.getNode(nodeId);
          const colorPair = getColorPair(action.color, action.textColor);
          const nextData: Partial<CanvasNodeData> = {};

          if (typeof action.label === "string") {
            nextData.label = action.label.trim().slice(0, 80);
          }

          if (action.shape && isNodeShape(action.shape)) {
            nextData.shape = action.shape;
          }

          if (colorPair) {
            nextData.color = colorPair.fill;
            nextData.textColor = colorPair.text;
          }

          if (node && Object.keys(nextData).length > 0) {
            flow.updateNodeData(nodeId, nextData);
            if (nextData.label) {
              nodeLabelsById.set(nodeId, nextData.label);
              registerNodeReference(nodeReferenceIds, nextData.label, nodeId);
            }
            applied += 1;
          }
          continue;
        }

        if (action.action === "delete_node") {
          const nodeId = resolveNodeReference(nodeReferenceIds, action.id);

          if (!nodeId || !knownNodeIds.has(nodeId)) {
            continue;
          }

          const connectedEdgeIds = flow.edges
            .filter((edge) => edge.source === nodeId || edge.target === nodeId)
            .map((edge) => edge.id);

          flow.removeEdges(connectedEdgeIds);
          connectedEdgeIds.forEach((edgeId) => knownEdgeIds.delete(edgeId));
          flow.removeNode(nodeId);
          knownNodeIds.delete(nodeId);
          nodeLabelsById.delete(nodeId);
          applied += 1;
          continue;
        }

        if (action.action === "add_edge") {
          const source = resolveNodeReference(nodeReferenceIds, action.source);
          const target = resolveNodeReference(nodeReferenceIds, action.target);

          if (
            !source ||
            !target ||
            !knownNodeIds.has(source) ||
            !knownNodeIds.has(target) ||
            source === target
          ) {
            continue;
          }

          const edge = createEdge(
            {
              ...action,
              source,
              target,
              label:
                normalizeEdgeLabel(action.label) ??
                getFallbackEdgeLabel(source, target, nodeLabelsById),
            },
            knownEdgeIds,
          );
          flow.addEdge(edge);
          knownEdgeIds.add(edge.id);
          applied += 1;
          continue;
        }

        if (action.action === "delete_edge") {
          if (!knownEdgeIds.has(action.id)) {
            continue;
          }

          flow.removeEdge(action.id);
          knownEdgeIds.delete(action.id);
          applied += 1;
        }
      }

      const fallbackEdges = createFallbackEdges({
        createdNodeIds,
        existingEdges: flow.edges,
        knownEdgeIds,
        nodeLabelsById,
      });

      for (const edge of fallbackEdges) {
        flow.addEdge(edge);
        knownEdgeIds.add(edge.id);
        applied += 1;
      }
    },
  );

  return applied;
}

function createNode(
  action: Extract<DesignAction, { action: "add_node" }>,
  knownNodeIds: Set<string>,
): CanvasNode {
  const shape = isNodeShape(action.shape) ? action.shape : "rectangle";
  const fallbackSize = DEFAULT_NODE_SIZES[shape];
  const colorPair =
    getColorPair(action.color, action.textColor) ??
    getSemanticColorPair(action.label, shape, knownNodeIds.size);
  const width = clampSize(action.width ?? fallbackSize.width, MIN_NODE_WIDTH, MAX_NODE_WIDTH);
  const height = clampSize(
    action.height ?? fallbackSize.height,
    MIN_NODE_HEIGHT,
    MAX_NODE_HEIGHT,
  );

  return {
    id: createUniqueId(action.id ?? slugify(action.label), knownNodeIds),
    type: CANVAS_NODE_TYPE,
    position: {
      x: roundCanvasNumber(action.x),
      y: roundCanvasNumber(action.y),
    },
    data: {
      label: action.label.trim().slice(0, 80),
      color: colorPair.fill,
      textColor: colorPair.text,
      shape,
    },
    height,
    initialHeight: height,
    initialWidth: width,
    width,
  };
}

function createEdge(
  action: Extract<DesignAction, { action: "add_edge" }>,
  knownEdgeIds: Set<string>,
): CanvasEdge {
  return {
    id: createUniqueId(
      action.id ?? `edge-${action.source}-${action.target}`,
      knownEdgeIds,
    ),
    source: action.source,
    target: action.target,
    type: CANVAS_EDGE_TYPE,
    data: {
      label: normalizeEdgeLabel(action.label) ?? "Flow",
    },
    markerEnd: DEFAULT_EDGE_MARKER,
    interactionWidth: EDGE_INTERACTION_WIDTH,
  };
}

function createFallbackEdges({
  createdNodeIds,
  existingEdges,
  knownEdgeIds,
  nodeLabelsById,
}: {
  createdNodeIds: string[];
  existingEdges: readonly CanvasEdge[];
  knownEdgeIds: Set<string>;
  nodeLabelsById: Map<string, string>;
}) {
  if (createdNodeIds.length < 2) {
    return [];
  }

  const fallbackEdges: CanvasEdge[] = [];
  const connectedNodeIds = new Set<string>();

  for (const edge of existingEdges) {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  }

  for (let index = 0; index < createdNodeIds.length - 1; index += 1) {
    const source = createdNodeIds[index];
    const target = createdNodeIds[index + 1];

    if (
      source === target ||
      hasEdgeBetween([...existingEdges, ...fallbackEdges], source, target)
    ) {
      continue;
    }

    const edge = createEdge(
      {
        action: "add_edge",
        source,
        target,
        label: getFallbackEdgeLabel(source, target, nodeLabelsById),
      },
      knownEdgeIds,
    );

    fallbackEdges.push(edge);
    knownEdgeIds.add(edge.id);
    connectedNodeIds.add(source);
    connectedNodeIds.add(target);
  }

  return fallbackEdges;
}

function createNodeLabelIndex(nodes: readonly CanvasNode[]) {
  return new Map(nodes.map((node) => [node.id, node.data.label]));
}

function normalizeEdgeLabel(label?: string) {
  const trimmedLabel = label?.trim();

  return trimmedLabel ? trimmedLabel.slice(0, 80) : null;
}

function getFallbackEdgeLabel(
  source: string,
  target: string,
  nodeLabelsById: Map<string, string>,
) {
  const sourceLabel = (nodeLabelsById.get(source) ?? source).toLowerCase();
  const targetLabel = (nodeLabelsById.get(target) ?? target).toLowerCase();

  if (targetLabel.includes("auth") || targetLabel.includes("identity")) {
    return "Authenticate";
  }

  if (targetLabel.includes("gateway")) {
    return "Route Request";
  }

  if (targetLabel.includes("cache") || targetLabel.includes("redis")) {
    return sourceLabel.includes("cache") ? "Cache Hit" : "Read Cache";
  }

  if (
    targetLabel.includes("database") ||
    targetLabel.includes("db") ||
    targetLabel.includes("nosql")
  ) {
    return "Read/Write";
  }

  if (
    targetLabel.includes("queue") ||
    targetLabel.includes("event") ||
    targetLabel.includes("stream")
  ) {
    return "Publish Event";
  }

  if (targetLabel.includes("order")) {
    return sourceLabel.includes("catalog") || sourceLabel.includes("product")
      ? "Place Order"
      : "Process Order";
  }

  if (targetLabel.includes("user")) {
    return "Verify User";
  }

  if (sourceLabel.includes("gateway")) {
    return "Route Request";
  }

  return "Flow";
}

function normalizeDesignPlan(value: unknown): DesignPlan {
  const candidatePlan = coerceDesignPlan(value);
  const parsedPlan = designPlanValidationSchema.safeParse(candidatePlan);

  if (parsedPlan.success) {
    return parsedPlan.data;
  }

  logger.warn("Design agent produced an invalid plan.", {
    issues: parsedPlan.error.issues.map((issue) => issue.message),
  });

  throw new Error("Ghost AI returned no valid canvas actions.");
}

function buildDesignSystemPrompt({ attempt }: { attempt: number }) {
  const retryInstruction =
    attempt > 1
      ? "\nPrevious output was invalid. Do not rename `actions`, do not omit edge labels, and do not return an empty action list."
      : "";

  return [
    "You are Ghost AI, a collaborative system architecture design agent.",
    "Return exactly one valid JSON object. Do not include Markdown, code fences, prose, or comments.",
    "Return only actions that update the existing React Flow canvas.",
    "Use the allowed node shapes exactly: rectangle, diamond, circle, pill, cylinder, hexagon.",
    "Use only the provided node color pairs.",
    `Keep nodes at least ${MIN_SPACING}px apart where possible and lay systems left-to-right from clients to storage/async workers.`,
    "Prefer adding clear service, datastore, queue, gateway, worker, and external-system nodes with meaningful edge labels.",
    "Do not delete existing canvas content unless the user explicitly asks to remove or replace it.",
    "For add_edge actions, source and target should use the exact id from an add_node action. If unsure, use the visible node label.",
    "Every add_edge action must include a short visible label such as Authenticate, Read Cache, Cache Miss, Write, Publish Event, Process Order, or Response.",
    "Every newly added node must participate in at least one edge. Prefer a connected request/data/event flow over isolated nodes.",
    "The top-level object must include a non-empty `summary` string and a non-empty `actions` array.",
    retryInstruction,
  ].join("\n");
}

function buildDesignUserPrompt({
  prompt,
  canvas,
  attempt,
}: {
  prompt: string;
  canvas: { nodes: CanvasNode[]; edges: CanvasEdge[] };
  attempt: number;
}) {
  return [
    `User prompt:\n${prompt}`,
    "",
    "Current canvas JSON:",
    JSON.stringify({
      nodes: canvas.nodes.map((node) => ({
        id: node.id,
        label: node.data.label,
        shape: node.data.shape,
        position: node.position,
        width: node.width,
        height: node.height,
      })),
      edges: canvas.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.data?.label ?? "",
      })),
    }),
    "",
    "Allowed color pairs:",
    JSON.stringify(NODE_COLORS),
    "",
    "Required JSON shape:",
    JSON.stringify({
      summary: "Brief summary of the design update",
      actions: [
        {
          action: "add_node",
          id: "api-gateway",
          label: "API Gateway",
          shape: "hexagon",
          color: NODE_COLORS[1]?.fill,
          textColor: NODE_COLORS[1]?.text,
          x: 0,
          y: 0,
          width: 180,
          height: 96,
        },
        {
          action: "add_edge",
          source: "api-gateway",
          target: "user-service",
          label: "Route Request",
        },
      ],
    }),
    attempt > 1
      ? "Retry note: the previous response did not satisfy the required JSON shape. Return only the JSON object."
      : "",
  ].join("\n");
}

function coerceDesignPlan(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      summary: "Design update prepared.",
      actions: [],
    };
  }

  const record = value as Record<string, unknown>;
  const rawActions =
    getFirstArray(record.actions) ??
    getFirstArray(record.updates) ??
    getFirstArray(record.changes) ??
    getFirstArray(record.steps) ??
    getFirstArray(record.operations) ??
    [];
  const nodeActions =
    getFirstArray(record.nodes)
      ?.map((node, index) => coerceNodeAction(node, index))
      .filter((action): action is Extract<DesignAction, { action: "add_node" }> => {
        return action !== null;
      }) ?? [];
  const edgeActions =
    getFirstArray(record.edges)
      ?.map((edge) => coerceEdgeAction(edge))
      .filter((action): action is Extract<DesignAction, { action: "add_edge" }> => {
        return action !== null;
      }) ?? [];

  const actions = [
    ...rawActions
      .map((action) => coerceDesignAction(action))
      .filter((action): action is DesignAction => action !== null),
    ...nodeActions,
    ...edgeActions,
  ];

  return {
    summary: getSummaryValue(record.summary),
    actions: limitDesignActions(actions),
  };
}

function getFirstArray(value: unknown) {
  return Array.isArray(value) ? value : null;
}

function getSummaryValue(value: unknown) {
  if (typeof value !== "string") {
    return "Design update prepared.";
  }

  const trimmed = value.trim().slice(0, 240);
  return trimmed.length > 0 ? trimmed : "Design update prepared.";
}

function limitDesignActions(actions: DesignAction[]) {
  if (actions.length <= MAX_DESIGN_ACTIONS) {
    return actions;
  }

  logger.warn("Design agent plan exceeded action limit; truncating.", {
    actionCount: actions.length,
    maxActions: MAX_DESIGN_ACTIONS,
  });

  return actions.slice(0, MAX_DESIGN_ACTIONS);
}

function coerceDesignAction(value: unknown): DesignAction | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const actionName = normalizeActionName(
    record.action ?? record.type ?? record.kind ?? record.operation,
  );
  const nodeRecord = getObjectRecord(record.node);
  const edgeRecord = getObjectRecord(record.edge);

  if (!actionName) {
    return null;
  }

  if (actionName === "add_node") {
    const nodeAction = coerceNodeAction(nodeRecord ?? record, 0);

    if (!nodeAction) {
      return null;
    }

    return nodeAction;
  }

  if (actionName === "move_node") {
    const id = getOptionalString(record.id ?? record.nodeId ?? record.targetId);
    const x = getCoordinateValue(record.x, record.position, "x");
    const y = getCoordinateValue(record.y, record.position, "y");

    return id && x !== null && y !== null
      ? { action: "move_node", id, x, y }
      : null;
  }

  if (actionName === "resize_node") {
    const id = getOptionalString(record.id ?? record.nodeId ?? record.targetId);
    const width = getOptionalNumber(record.width);
    const height = getOptionalNumber(record.height);

    return id && width !== null && height !== null
      ? { action: "resize_node", id, width, height }
      : null;
  }

  if (actionName === "update_node_data") {
    const id = getOptionalString(record.id ?? record.nodeId ?? record.targetId);

    if (!id) {
      return null;
    }

      return {
        action: "update_node_data",
        id,
        label:
          getOptionalString(record.label ?? record.name ?? record.title) ??
          undefined,
        shape: getOptionalShape(record.shape),
        color: getOptionalString(record.color ?? record.fill) ?? undefined,
        textColor:
          getOptionalString(record.textColor ?? record.text) ?? undefined,
      };
  }

  if (actionName === "delete_node") {
    const id = getOptionalString(record.id ?? record.nodeId ?? record.targetId);
    return id ? { action: "delete_node", id } : null;
  }

  if (actionName === "add_edge") {
    return coerceEdgeAction(edgeRecord ?? record);
  }

  if (actionName === "delete_edge") {
    const id = getOptionalString(record.id ?? record.edgeId ?? record.targetId);
    return id ? { action: "delete_edge", id } : null;
  }

  return null;
}

function coerceNodeAction(
  value: unknown,
  index: number,
): Extract<DesignAction, { action: "add_node" }> | null {
  const record = getObjectRecord(value);

  if (!record) {
    return null;
  }

  const label = getOptionalString(
    record.label ??
      record.name ??
      record.title ??
      record.text ??
      record.service ??
      record.component,
  );

  if (!label) {
    return null;
  }

  const fallbackPosition = getFallbackNodePosition(index);
  const x =
    getCoordinateValue(record.x, record.position, "x") ??
    getCoordinateValue(undefined, record.coordinates, "x") ??
    fallbackPosition.x;
  const y =
    getCoordinateValue(record.y, record.position, "y") ??
    getCoordinateValue(undefined, record.coordinates, "y") ??
    fallbackPosition.y;

  return {
    action: "add_node",
    id: getOptionalString(record.id ?? record.nodeId ?? record.key) ?? undefined,
    label,
    shape: getOptionalShape(record.shape ?? record.type),
    color: getOptionalString(record.color ?? record.fill) ?? undefined,
    textColor:
      getOptionalString(record.textColor ?? record.text_color ?? record.foreground) ??
      undefined,
    x,
    y,
    width: getOptionalNumber(record.width) ?? undefined,
    height: getOptionalNumber(record.height) ?? undefined,
  };
}

function coerceEdgeAction(
  value: unknown,
): Extract<DesignAction, { action: "add_edge" }> | null {
  const record = getObjectRecord(value);

  if (!record) {
    return null;
  }

  const source = getOptionalString(
    record.source ??
      record.sourceId ??
      record.sourceNodeId ??
      record.from ??
      record.fromId,
  );
  const target = getOptionalString(
    record.target ??
      record.targetId ??
      record.targetNodeId ??
      record.to ??
      record.toId,
  );

  if (!source || !target) {
    return null;
  }

  return {
    action: "add_edge",
    id: getOptionalString(record.id ?? record.edgeId) ?? undefined,
    source,
    target,
    label:
      getOptionalString(
        record.label ?? record.name ?? record.text ?? record.relationship,
      ) ?? undefined,
  };
}

function getObjectRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getFallbackNodePosition(index: number) {
  return {
    x: 80 + (index % 4) * MIN_SPACING,
    y: 80 + Math.floor(index / 4) * 140,
  };
}

function normalizeActionName(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");

  switch (normalized) {
    case "add_node":
    case "create_node":
    case "node":
      return "add_node";
    case "move_node":
    case "reposition_node":
      return "move_node";
    case "resize_node":
    case "update_size":
      return "resize_node";
    case "update_node_data":
    case "update_node":
    case "edit_node":
      return "update_node_data";
    case "delete_node":
    case "remove_node":
      return "delete_node";
    case "add_edge":
    case "create_edge":
    case "connect":
    case "link":
      return "add_edge";
    case "delete_edge":
    case "remove_edge":
      return "delete_edge";
    default:
      return null;
  }
}

function getOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 80) : null;
}

function getOptionalNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

function getCoordinateValue(
  directValue: unknown,
  positionValue: unknown,
  axis: "x" | "y",
) {
  const directNumber = getOptionalNumber(directValue);

  if (directNumber !== null) {
    return directNumber;
  }

  if (
    positionValue &&
    typeof positionValue === "object" &&
    !Array.isArray(positionValue)
  ) {
    return getOptionalNumber((positionValue as Record<string, unknown>)[axis]);
  }

  return null;
}

function getOptionalShape(value: unknown) {
  return isNodeShape(value) ? value : undefined;
}

function extractJsonObjectText(text: string) {
  const fencedJsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fencedJsonMatch?.[1]?.trim() ?? text.trim();

  if (candidate.startsWith("{") && candidate.endsWith("}")) {
    return candidate;
  }

  const startIndex = candidate.indexOf("{");

  if (startIndex === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < candidate.length; index += 1) {
    const character = candidate[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === "\\") {
      escaped = true;
      continue;
    }

    if (character === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (character === "{") {
      depth += 1;
    }

    if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        return candidate.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

function hasEdgeBetween(
  edges: readonly CanvasEdge[],
  source: string,
  target: string,
) {
  return edges.some((edge) => {
    return (
      (edge.source === source && edge.target === target) ||
      (edge.source === target && edge.target === source)
    );
  });
}

async function publishStatus(
  liveblocks: ReturnType<typeof getLiveblocksClient>,
  roomId: string,
  level: AiStatusLevel,
  message: string,
) {
  await liveblocks.broadcastEvent(roomId, {
    type: "AI_STATUS",
    id: `ai-status-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level,
    message,
    createdAt: new Date().toISOString(),
  });
}

async function setAiPresence(
  liveblocks: ReturnType<typeof getLiveblocksClient>,
  roomId: string,
  presence: Liveblocks["Presence"],
) {
  await liveblocks.setPresence(roomId, {
    userId: AI_USER_ID,
    data: presence,
    userInfo: AI_USER_INFO,
    ttl: presence.thinking ? 60 : 2,
  });
}

function estimateFocusCursor(nodes: CanvasNode[]) {
  if (nodes.length === 0) {
    return { x: 80, y: 80 };
  }

  const lastNode = nodes[nodes.length - 1];

  return {
    x: roundCanvasNumber(lastNode.position.x + (lastNode.width ?? 160) + 80),
    y: roundCanvasNumber(lastNode.position.y),
  };
}

function getColorPair(color?: string, textColor?: string) {
  if (!color && !textColor) {
    return null;
  }

  return (
    NODE_COLORS.find(
      (pair) =>
        (!color || pair.fill === color) && (!textColor || pair.text === textColor),
    ) ?? null
  );
}

function getSemanticColorPair(label: string, shape: NodeShape, seed: number) {
  const normalizedLabel = label.toLowerCase();

  if (
    shape === "cylinder" ||
    normalizedLabel.includes("database") ||
    normalizedLabel.includes("db") ||
    normalizedLabel.includes("cache") ||
    normalizedLabel.includes("redis")
  ) {
    return normalizedLabel.includes("cache") || normalizedLabel.includes("redis")
      ? NODE_COLORS[7]
      : NODE_COLORS[6];
  }

  if (
    normalizedLabel.includes("queue") ||
    normalizedLabel.includes("event") ||
    normalizedLabel.includes("stream")
  ) {
    return NODE_COLORS[3];
  }

  if (
    shape === "hexagon" ||
    normalizedLabel.includes("gateway") ||
    normalizedLabel.includes("external") ||
    normalizedLabel.includes("client") ||
    normalizedLabel.includes("user")
  ) {
    return NODE_COLORS[1];
  }

  if (normalizedLabel.includes("auth") || normalizedLabel.includes("identity")) {
    return NODE_COLORS[2];
  }

  if (normalizedLabel.includes("order") || normalizedLabel.includes("payment")) {
    return NODE_COLORS[4];
  }

  if (normalizedLabel.includes("product") || normalizedLabel.includes("catalog")) {
    return NODE_COLORS[5];
  }

  return NODE_COLORS[(seed % (NODE_COLORS.length - 1)) + 1];
}

function createNodeReferenceIndex(nodes: readonly CanvasNode[]) {
  const index = new Map<string, string>();

  for (const node of nodes) {
    registerNodeReferences(index, node);
  }

  return index;
}

function registerNodeReferences(index: Map<string, string>, node: CanvasNode) {
  registerNodeReference(index, node.id, node.id);
  registerNodeReference(index, node.data.label, node.id);
}

function registerNodeReference(
  index: Map<string, string>,
  reference: string,
  nodeId: string,
) {
  const normalizedReference = normalizeReference(reference);

  if (!normalizedReference) {
    return;
  }

  index.set(normalizedReference, nodeId);
  index.set(slugify(normalizedReference), nodeId);
}

function resolveNodeReference(index: Map<string, string>, reference: string) {
  return index.get(normalizeReference(reference)) ?? index.get(slugify(reference));
}

function isNodeShape(value: unknown): value is NodeShape {
  return typeof value === "string" && NODE_SHAPES.includes(value as NodeShape);
}

function createUniqueId(baseValue: string, existingIds: Set<string>) {
  const base = slugify(baseValue) || "ai-node";
  let candidate = base;
  let index = 1;

  while (existingIds.has(candidate)) {
    index += 1;
    candidate = `${base}-${index}`;
  }

  return candidate;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function normalizeReference(value: string) {
  return value.trim().toLowerCase();
}

function clampSize(value: number, min: number, max: number) {
  return Math.min(Math.max(roundCanvasNumber(value), min), max);
}

function roundCanvasNumber(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function getGeminiApiKey() {
  const apiKey =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is required for the design agent.",
    );
  }

  return apiKey;
}
