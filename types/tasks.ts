import { z } from "zod";

export const AI_CHAT_FEED_ID = "ai-chat";
export const AI_ARCHITECT_FEED_ID = "ai-architect";
export const AI_STATUS_FEED_ID = "ai-status-feed";

export interface AiStatusFeedPayload {
  level?: "info" | "success" | "error";
  text?: string;
}

export interface AiStatusFeedMessage {
  id: string;
  createdAt?: string;
  level: "info" | "success" | "error";
  text?: string;
}

export const aiChatFeedPayloadSchema = z.object({
  sender: z.string().min(1).max(120),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
  timestamp: z.string().datetime(),
});

export type AiChatFeedPayload = z.infer<typeof aiChatFeedPayloadSchema>;

export interface AiChatFeedMessage extends AiChatFeedPayload {
  id: string;
  createdAt?: number;
}

export function validateAiStatusFeedPayload(
  value: unknown,
): AiStatusFeedPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const payload = value as Record<string, unknown>;
  const level = payload.level;
  const text = payload.text;

  if (
    level !== undefined &&
    level !== "info" &&
    level !== "success" &&
    level !== "error"
  ) {
    return null;
  }

  if (text !== undefined && typeof text !== "string") {
    return null;
  }

  return {
    level: level ?? "info",
    text,
  };
}

export function validateAiStatusFeedMessage(
  value: unknown,
): AiStatusFeedMessage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const message = value as Record<string, unknown>;
  const id = message.id;
  const createdAt = message.createdAt;
  const payload = validateAiStatusFeedPayload(message.data);

  if (typeof id !== "string" || !payload) {
    return null;
  }

  if (createdAt !== undefined && typeof createdAt !== "string") {
    return null;
  }

  return {
    id,
    createdAt,
    level: payload.level ?? "info",
    text: payload.text,
  };
}

export function validateAiChatFeedPayload(
  value: unknown,
): AiChatFeedPayload | null {
  const result = aiChatFeedPayloadSchema.safeParse(value);

  if (!result.success) {
    return null;
  }

  return result.data;
}

export function validateAiChatFeedMessage(
  value: unknown,
): AiChatFeedMessage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const message = value as Record<string, unknown>;
  const id = message.id;
  const createdAt = message.createdAt;
  const payload = validateAiChatFeedPayload(message.data);

  if (typeof id !== "string" || !payload) {
    return null;
  }

  if (createdAt !== undefined && typeof createdAt !== "number") {
    return null;
  }

  return {
    id,
    createdAt,
    ...payload,
  };
}
