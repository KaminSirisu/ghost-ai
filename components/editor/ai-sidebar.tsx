"use client";

import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { Bot, Download, FileText, LoaderCircle, Send, XIcon } from "lucide-react";
import {
  useCreateFeed,
  useCreateFeedMessage,
  useFeedMessages,
  useOthers,
  useSelf,
} from "@liveblocks/react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AI_ARCHITECT_FEED_ID,
  AI_CHAT_FEED_ID,
  AI_STATUS_FEED_ID,
  type AiChatFeedMessage,
  validateAiChatFeedMessage,
  validateAiStatusFeedPayload,
} from "@/types/tasks";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

interface AiSidebarProps {
  canvasSnapshot: {
    edges: CanvasEdge[];
    nodes: CanvasNode[];
  };
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

interface ActiveDesignRun {
  runId: string;
  publicToken: string;
}

interface DesignRunResponse {
  runId?: unknown;
  publicToken?: unknown;
  error?: unknown;
}

interface DesignTokenResponse {
  token?: unknown;
  publicToken?: unknown;
  error?: unknown;
}

interface SpecRunResponse {
  runId?: unknown;
  publicToken?: unknown;
  error?: unknown;
}

interface SpecTokenResponse {
  token?: unknown;
  publicToken?: unknown;
  error?: unknown;
}

interface ProjectSpecListItem {
  id: string;
  createdAt: string;
  filename: string;
}

interface SpecsListResponse {
  specs?: unknown;
  error?: unknown;
}

export function AiSidebar({
  canvasSnapshot,
  isOpen,
  onClose,
  roomId,
}: AiSidebarProps) {
  const [architectDraft, setArchitectDraft] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [chatSendError, setChatSendError] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<ActiveDesignRun | null>(null);
  const [activeSpecRun, setActiveSpecRun] = useState<ActiveDesignRun | null>(null);
  const [specGenerateError, setSpecGenerateError] = useState<string | null>(null);
  const [specs, setSpecs] = useState<ProjectSpecListItem[]>([]);
  const [isSpecsLoading, setIsSpecsLoading] = useState(false);
  const [specsError, setSpecsError] = useState<string | null>(null);
  const [selectedSpec, setSelectedSpec] = useState<ProjectSpecListItem | null>(null);
  const [previewMarkdown, setPreviewMarkdown] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const architectTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const chatTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const reportedRealtimeErrorRunIdRef = useRef<string | null>(null);
  const createFeed = useCreateFeed();
  const createFeedMessage = useCreateFeedMessage();
  const self = useSelf();
  const statusFeedMessages = useFeedMessages(AI_STATUS_FEED_ID, { limit: 1 });
  const architectFeedMessages = useFeedMessages(AI_ARCHITECT_FEED_ID, {
    limit: 100,
  });
  const chatFeedMessages = useFeedMessages(AI_CHAT_FEED_ID, { limit: 100 });
  const activeThinkers = useOthers((others) =>
    others.filter((participant) => participant.presence.thinking),
  );
  const isRunActive = activeRun !== null;
  const isSpecRunActive = activeSpecRun !== null;
  const isGenerationActive =
    isRunActive || isSpecRunActive || activeThinkers.length > 0;
  const isInputDisabled = isSending || isRunActive;

  const ensureFeed = useCallback(async (feedId: string, name: string) => {
    await createFeed(feedId, {
      metadata: {
        name,
      },
    }).catch(() => {
      // The shared feed may already exist; creation is best-effort.
    });
  }, [createFeed]);

  const pushFeedMessage = useCallback(
    async ({
      feedId,
      role,
      content,
      sender,
    }: {
      feedId: string;
      role: "user" | "assistant";
      content: string;
      sender?: string;
    }) => {
      await ensureFeed(
        feedId,
        feedId === AI_ARCHITECT_FEED_ID ? "AI Architect" : "AI Chat",
      );
      await createFeedMessage(feedId, {
        sender: sender ?? (role === "assistant" ? "Ghost AI" : self?.info.name || "Anonymous"),
        role,
        content,
        timestamp: new Date().toISOString(),
      });
    },
    [createFeedMessage, ensureFeed, self?.info.name],
  );

  const { run, error: realtimeRunError } = useRealtimeRun(activeRun?.runId, {
    accessToken: activeRun?.publicToken,
    enabled: activeRun !== null,
    onComplete: (completedRun, error) => {
      const status = completedRun.status;
      const content = error
        ? `Design run could not be tracked: ${error.message}`
        : status === "COMPLETED"
          ? getRunSummary(completedRun.output) ??
            "Design update complete. Canvas changes are live."
          : `Design run ended with status ${formatRunStatus(status)}.`;

      void pushFeedMessage({
        feedId: AI_ARCHITECT_FEED_ID,
        role: "assistant",
        content,
      });
      setActiveRun(null);
      setIsSending(false);
      reportedRealtimeErrorRunIdRef.current = null;
    },
  });
  const latestStatus = useMemo(() => {
    if (!("messages" in statusFeedMessages)) {
      return null;
    }

    const latestMessage = statusFeedMessages.messages?.[0];

    if (!latestMessage) {
      return null;
    }

    const payload = validateAiStatusFeedPayload(latestMessage.data);

    if (!payload) {
      return null;
    }

    return {
      id: latestMessage.id,
      level: payload.level ?? "info",
      text: payload.text,
    };
  }, [statusFeedMessages]);
  const architectMessages = useMemo(
    () => getValidatedChatMessages(architectFeedMessages),
    [architectFeedMessages],
  );
  const chatMessages = useMemo(
    () => getValidatedChatMessages(chatFeedMessages),
    [chatFeedMessages],
  );
  const isArchitectLoading =
    "isLoading" in architectFeedMessages
      ? architectFeedMessages.isLoading
      : false;
  const architectFeedError =
    "error" in architectFeedMessages ? architectFeedMessages.error : null;
  const isChatLoading =
    "isLoading" in chatFeedMessages ? chatFeedMessages.isLoading : false;
  const chatFeedError =
    "error" in chatFeedMessages ? chatFeedMessages.error : null;
  const runStatusText = run?.status
    ? `Run ${formatRunStatus(run.status)}`
    : latestStatus?.text;

  const loadSpecs = useCallback(
    async (signal?: AbortSignal) => {
      setIsSpecsLoading(true);
      setSpecsError(null);

      try {
        const response = await fetch(`/api/projects/${roomId}/specs`, {
          signal,
        });
        const data = await readJsonResponse<SpecsListResponse>(response);

        if (!response.ok) {
          throw new Error(getResponseError(data, "Specs could not be loaded."));
        }

        setSpecs(normalizeSpecs(data?.specs));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setSpecs([]);
        setSpecsError(
          error instanceof Error ? error.message : "Specs could not be loaded.",
        );
      } finally {
        if (!signal?.aborted) {
          setIsSpecsLoading(false);
        }
      }
    },
    [roomId],
  );

  const { run: specRun, error: realtimeSpecRunError } = useRealtimeRun(
    activeSpecRun?.runId,
    {
      accessToken: activeSpecRun?.publicToken,
      enabled: activeSpecRun !== null,
      onComplete: (completedRun, error) => {
        const status = completedRun.status;

        if (error) {
          setSpecGenerateError(`Spec run could not be tracked: ${error.message}`);
        } else if (status !== "COMPLETED") {
          setSpecGenerateError(
            `Spec run ended with status ${formatRunStatus(status)}.`,
          );
        } else {
          setSpecGenerateError(null);
          void loadSpecs();
        }

        setActiveSpecRun(null);
      },
    },
  );
  const currentRunStatusText = specRun?.status
    ? `Spec ${formatRunStatus(specRun.status)}`
    : runStatusText;

  useEffect(() => {
    if (!activeRun || !realtimeRunError) {
      return;
    }

    if (reportedRealtimeErrorRunIdRef.current === activeRun.runId) {
      return;
    }

    reportedRealtimeErrorRunIdRef.current = activeRun.runId;
    void pushFeedMessage({
      feedId: AI_ARCHITECT_FEED_ID,
      role: "assistant",
      content: `Design run could not be tracked: ${realtimeRunError.message}`,
    });
    setActiveRun(null);
    setIsSending(false);
  }, [activeRun, pushFeedMessage, realtimeRunError]);

  useEffect(() => {
    if (!activeSpecRun || !realtimeSpecRunError) {
      return;
    }

    window.queueMicrotask(() => {
      setSpecGenerateError(
        `Spec run could not be tracked: ${realtimeSpecRunError.message}`,
      );
      setActiveSpecRun(null);
    });
  }, [activeSpecRun, realtimeSpecRunError]);

  useEffect(() => {
    void ensureFeed(AI_STATUS_FEED_ID, "AI Status Feed");
    void ensureFeed(AI_ARCHITECT_FEED_ID, "AI Architect");
    void ensureFeed(AI_CHAT_FEED_ID, "AI Chat");
  }, [ensureFeed]);

  useEffect(() => {
    const controller = new AbortController();

    window.queueMicrotask(() => {
      void loadSpecs(controller.signal);
    });

    return () => {
      controller.abort();
    };
  }, [loadSpecs]);

  function resizeTextarea(textarea: HTMLTextAreaElement) {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }

  async function fetchPublicToken(runId: string) {
    const response = await fetch("/api/ai/design/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ runId }),
    });
    const data = await readJsonResponse<DesignTokenResponse>(response);

    if (!response.ok) {
      throw new Error(getResponseError(data, "Design run token could not be issued."));
    }

    const token = data ? data.publicToken ?? data.token : null;

    if (typeof token !== "string" || token.length === 0) {
      throw new Error("Design run token was missing.");
    }

    return token;
  }

  async function fetchSpecPublicToken(runId: string) {
    const response = await fetch("/api/ai/spec/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ runId }),
    });
    const data = await readJsonResponse<SpecTokenResponse>(response);

    if (!response.ok) {
      throw new Error(getResponseError(data, "Spec run token could not be issued."));
    }

    const token = data ? data.publicToken ?? data.token : null;

    if (typeof token !== "string" || token.length === 0) {
      throw new Error("Spec run token was missing.");
    }

    return token;
  }

  async function generateSpecFromCanvas() {
    if (isSpecRunActive) {
      return;
    }

    setSpecGenerateError(null);

    try {
      const response = await fetch("/api/ai/spec", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          chatHistory: [...architectMessages, ...chatMessages].map(
            ({ content, role, sender, timestamp }) => ({
              content,
              role,
              sender,
              timestamp,
            }),
          ),
          nodes: canvasSnapshot.nodes,
          edges: canvasSnapshot.edges,
        }),
      });
      const data = await readJsonResponse<SpecRunResponse>(response);

      if (!response.ok) {
        throw new Error(getResponseError(data, "Spec generation could not be started."));
      }

      if (!data || typeof data.runId !== "string" || data.runId.length === 0) {
        throw new Error("Spec run ID was missing.");
      }

      const publicToken =
        typeof data.publicToken === "string" && data.publicToken.length > 0
          ? data.publicToken
          : await fetchSpecPublicToken(data.runId);

      setActiveSpecRun({
        runId: data.runId,
        publicToken,
      });
    } catch (error) {
      setSpecGenerateError(
        error instanceof Error
          ? error.message
          : "Spec generation could not be started.",
      );
    }
  }

  async function submitArchitectMessage(content: string) {
    const trimmedContent = content.trim();

    if (!trimmedContent || isInputDisabled) {
      return;
    }

    setIsSending(true);
    setSendError(null);

    try {
      await pushFeedMessage({
        feedId: AI_ARCHITECT_FEED_ID,
        role: "user",
        content: trimmedContent,
      });

      setArchitectDraft("");

      const textarea = architectTextareaRef.current;
      if (textarea) {
        textarea.style.height = "72px";
      }

      const response = await fetch("/api/ai/design", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: trimmedContent,
          projectId: roomId,
          roomId,
        }),
      });
      const data = await readJsonResponse<DesignRunResponse>(response);

      if (!response.ok) {
        throw new Error(getResponseError(data, "Design run could not be started."));
      }

      if (!data || typeof data.runId !== "string" || data.runId.length === 0) {
        throw new Error("Design run ID was missing.");
      }

      const publicToken =
        typeof data.publicToken === "string" && data.publicToken.length > 0
          ? data.publicToken
          : await fetchPublicToken(data.runId);

      setActiveRun({
        runId: data.runId,
        publicToken,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Design request could not be sent.";
      setSendError(message);
      await pushFeedMessage({
        feedId: AI_ARCHITECT_FEED_ID,
        role: "assistant",
        content: message,
      }).catch(() => {
        // Keep the local error visible if the shared feed write also fails.
      });
    } finally {
      setIsSending(false);
    }
  }

  async function submitChatMessage(content: string) {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return;
    }

    setChatSendError(null);

    try {
      await pushFeedMessage({
        feedId: AI_CHAT_FEED_ID,
        role: "user",
        content: trimmedContent,
      });

      setChatDraft("");

      const textarea = chatTextareaRef.current;
      if (textarea) {
        textarea.style.height = "72px";
      }
    } catch {
      setChatSendError("Chat message could not be sent.");
    }
  }

  async function openSpecPreview(spec: ProjectSpecListItem) {
    setSelectedSpec(spec);
    setPreviewMarkdown(null);
    setPreviewError(null);
    setIsPreviewLoading(true);

    try {
      const response = await fetch(getSpecDownloadPath(roomId, spec.id));
      const markdown = await response.text();

      if (!response.ok) {
        throw new Error(markdown || "Spec preview could not be loaded.");
      }

      setPreviewMarkdown(markdown);
    } catch (error) {
      setPreviewError(
        error instanceof Error
          ? error.message
          : "Spec preview could not be loaded.",
      );
    } finally {
      setIsPreviewLoading(false);
    }
  }

  function closeSpecPreview() {
    setSelectedSpec(null);
    setPreviewMarkdown(null);
    setPreviewError(null);
    setIsPreviewLoading(false);
  }

  function downloadSpec(spec: ProjectSpecListItem) {
    window.location.href = getSpecDownloadPath(roomId, spec.id);
  }

  function handlePromptChip(prompt: string) {
    setArchitectDraft(prompt);

    window.requestAnimationFrame(() => {
      const textarea = architectTextareaRef.current;
      if (!textarea) {
        return;
      }

      resizeTextarea(textarea);
      textarea.focus();
    });
  }

  function handleArchitectInputChange(value: string) {
    setArchitectDraft(value);

    const textarea = architectTextareaRef.current;
    if (textarea) {
      resizeTextarea(textarea);
    }
  }

  function handleChatInputChange(value: string) {
    setChatDraft(value);

    const textarea = chatTextareaRef.current;
    if (textarea) {
      resizeTextarea(textarea);
    }
  }

  function handleArchitectKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void submitArchitectMessage(architectDraft);
  }

  function handleChatKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void submitChatMessage(chatDraft);
  }

  return (
    <aside
      className={cn(
        "hidden top-16 right-4 bottom-4 z-30 fixed md:flex flex-col bg-base/95 shadow-2xl shadow-base/60 backdrop-blur border border-surface-border rounded-2xl w-80 transition-transform duration-300",
        isOpen
          ? "translate-x-0"
          : "pointer-events-none translate-x-[calc(100%+1.5rem)]"
      )}
      aria-hidden={!isOpen}
    >
      <div className="flex justify-between items-start gap-3 px-4 py-4 border-surface-border border-b">
        <div className="flex items-start gap-3 min-w-0">
          <span className="flex justify-center items-center border border-surface-border rounded-xl size-9 text-ai-text bg-accent-dim shrink-0">
            <Bot className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-copy-primary text-sm truncate">
              AI Workspace
            </p>
            <p className="mt-1 text-copy-muted text-xs truncate">
              {isGenerationActive
                ? "Ghost AI is working"
                : "Collaborate with Ghost AI"}
            </p>
          </div>
        </div>
        <AiActivityIndicator active={isGenerationActive} />
        <Button
          variant="ghost"
          size="icon-sm"
          type="button"
          aria-label="Close AI sidebar"
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </div>

      <Tabs
        defaultValue="ai-architect"
        className="relative flex flex-col flex-1 gap-0 min-h-0 overflow-hidden"
      >
        <div className="px-4 py-3 border-surface-border border-b h-16">
          <TabsList className="grid grid-cols-3 bg-subtle p-1 w-full h-9">
            <TabsTrigger
              value="ai-architect"
              className="text-copy-muted data-active:text-ai-text data-active:bg-accent-dim"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="text-copy-muted data-active:text-ai-text data-active:bg-accent-dim"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="text-copy-muted data-active:text-ai-text data-active:bg-accent-dim"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>
        <LatestAiStatusMessage
          active={isRunActive || isSpecRunActive}
          level={latestStatus?.level}
          text={currentRunStatusText}
        />

        <TabsContent
          value="ai-architect"
          className={cn(
            "bottom-0 absolute inset-x-0 flex flex-col mt-0 overflow-hidden",
            isRunActive || isSpecRunActive ? "top-28" : "top-16",
          )}
        >
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="px-4 py-4 h-full">
              {isArchitectLoading ? (
                <div className="flex min-h-full items-center justify-center text-sm text-copy-muted">
                  Loading AI messages...
                </div>
              ) : architectFeedError ? (
                <div className="flex min-h-full items-center justify-center px-3 text-center text-sm text-state-error">
                  AI messages could not be loaded.
                </div>
              ) : architectMessages.length === 0 ? (
                <div className="flex flex-col justify-center items-center px-2 py-10 min-h-full text-center">
                  <span className="flex justify-center items-center bg-elevated border border-surface-border rounded-2xl size-12 text-ai-text">
                    <Bot className="size-5" />
                  </span>
                  <p className="mt-4 font-medium text-copy-primary text-sm">
                    Ask Ghost AI to design the system.
                  </p>
                  <p className="mt-2 text-copy-muted text-sm leading-6">
                    Prompts here update the canvas and receive Ghost AI design
                    responses in this tab.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-5">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className="bg-subtle hover:bg-accent-dim px-3 py-1.5 rounded-full font-medium text-ai-text text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        onClick={() => handlePromptChip(prompt)}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {architectMessages.map((message) => (
                    <ChatBubble key={message.id} message={message} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <form
            className="p-3 border-surface-border border-t shrink-0"
            onSubmit={(event) => {
              event.preventDefault();
              void submitArchitectMessage(architectDraft);
            }}
          >
            <div className="bg-elevated p-2 border border-surface-border rounded-2xl">
              <Textarea
                ref={architectTextareaRef}
                value={architectDraft}
                placeholder="Describe the architecture change..."
                className="bg-transparent shadow-none px-2 py-2 border-0 focus-visible:ring-0 min-h-18 max-h-40 text-copy-primary text-sm resize-none"
                disabled={isInputDisabled}
                onChange={(event) => handleArchitectInputChange(event.target.value)}
                onKeyDown={handleArchitectKeyDown}
              />

              <div className="flex items-center justify-between gap-3 mt-2">
                <p
                  className={cn(
                    "min-h-4 text-xs",
                    sendError ? "text-state-error" : "text-copy-muted",
                  )}
                  aria-live="polite"
                >
                  {sendError ?? ""}
                </p>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-state-success hover:bg-state-success/90 text-base"
                  disabled={!architectDraft.trim() || isInputDisabled}
                >
                  {isInputDisabled ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Send />
                  )}
                  {isRunActive ? "Running" : isSending ? "Sending" : "Send"}
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>

        <TabsContent
          value="chat"
          className={cn(
            "bottom-0 absolute inset-x-0 flex flex-col mt-0 overflow-hidden",
            isRunActive || isSpecRunActive ? "top-28" : "top-16",
          )}
        >
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="px-4 py-4 h-full">
              {isChatLoading ? (
                <div className="flex min-h-full items-center justify-center text-sm text-copy-muted">
                  Loading chat...
                </div>
              ) : chatFeedError ? (
                <div className="flex min-h-full items-center justify-center px-3 text-center text-sm text-state-error">
                  Chat messages could not be loaded.
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex flex-col justify-center items-center px-2 py-10 min-h-full text-center">
                  <span className="flex justify-center items-center bg-elevated border border-surface-border rounded-2xl size-12 text-ai-text">
                    <Bot className="size-5" />
                  </span>
                  <p className="mt-4 font-medium text-copy-primary text-sm">
                    Start the room chat.
                  </p>
                  <p className="mt-2 text-copy-muted text-sm leading-6">
                    Share context and decisions with everyone in this project.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatMessages.map((message) => (
                    <ChatBubble key={message.id} message={message} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <form
            className="p-3 border-surface-border border-t shrink-0"
            onSubmit={(event) => {
              event.preventDefault();
              void submitChatMessage(chatDraft);
            }}
          >
            <div className="bg-elevated p-2 border border-surface-border rounded-2xl">
              <Textarea
                ref={chatTextareaRef}
                value={chatDraft}
                placeholder="Message the project..."
                className="bg-transparent shadow-none px-2 py-2 border-0 focus-visible:ring-0 min-h-18 max-h-40 text-copy-primary text-sm resize-none"
                onChange={(event) => handleChatInputChange(event.target.value)}
                onKeyDown={handleChatKeyDown}
              />

              <div className="flex items-center justify-between gap-3 mt-2">
                <p
                  className={cn(
                    "min-h-4 text-xs",
                    chatSendError ? "text-state-error" : "text-copy-muted",
                  )}
                  aria-live="polite"
                >
                  {chatSendError ?? ""}
                </p>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-state-success hover:bg-state-success/90 text-base"
                  disabled={!chatDraft.trim()}
                >
                  <Send />
                  Send
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>

        <TabsContent
          value="specs"
          className={cn(
            "bottom-0 absolute inset-x-0 data-active:flex flex-col gap-4 p-4 overflow-hidden",
            isRunActive || isSpecRunActive ? "top-28" : "top-16",
          )}
        >
          <Button
            type="button"
            className="bg-ai hover:bg-ai/90 w-full text-copy-primary"
            disabled={isSpecRunActive}
            onClick={() => void generateSpecFromCanvas()}
          >
            {isSpecRunActive ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <FileText />
            )}
            {isSpecRunActive ? "Generating Spec" : "Generate Spec"}
          </Button>
          {specGenerateError ? (
            <p className="text-center text-sm text-state-error" aria-live="polite">
              {specGenerateError}
            </p>
          ) : null}

          <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-surface-border bg-elevated">
            <ScrollArea className="h-full">
              <div className="space-y-2 p-3">
                {isSpecsLoading ? (
                  <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-copy-muted">
                    <LoaderCircle className="size-4 animate-spin" />
                    Loading specs...
                  </div>
                ) : specsError ? (
                  <div className="flex min-h-40 items-center justify-center px-3 text-center text-sm text-state-error">
                    {specsError}
                  </div>
                ) : specs.length === 0 ? (
                  <div className="flex min-h-40 flex-col items-center justify-center px-3 text-center">
                    <span className="flex size-10 items-center justify-center rounded-xl border border-surface-border bg-base text-ai-text">
                      <FileText className="size-4" />
                    </span>
                    <p className="mt-3 text-sm font-medium text-copy-primary">
                      No generated specs yet.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-copy-muted">
                      Generated Markdown specs will appear here.
                    </p>
                  </div>
                ) : (
                  specs.map((spec) => (
                    <div
                      key={spec.id}
                      className="group flex w-full items-center gap-3 rounded-xl border border-surface-border bg-base px-3 py-2 text-left transition-colors hover:border-ai/50 hover:bg-accent-dim focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none"
                        onClick={() => void openSpecPreview(spec)}
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-elevated text-ai-text">
                          <FileText className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-copy-primary">
                            {spec.filename}
                          </span>
                          <time
                            dateTime={spec.createdAt}
                            className="mt-1 block truncate text-xs text-copy-muted"
                          >
                            {formatSpecDate(spec.createdAt)}
                          </time>
                        </span>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        type="button"
                        aria-label={`Download ${spec.filename}`}
                        className="shrink-0 opacity-80 group-hover:opacity-100"
                        onClick={() => downloadSpec(spec)}
                      >
                        <Download />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={selectedSpec !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeSpecPreview();
          }
        }}
      >
        <DialogContent className="max-h-[calc(100vh-4rem)] w-[calc(100vw-2rem)] max-w-none gap-0 overflow-hidden rounded-3xl border border-surface-border bg-base p-0 text-copy-primary sm:w-[92vw] sm:max-w-6xl">
          <DialogHeader className="border-b border-surface-border px-5 py-4 pr-12">
            <DialogTitle className="truncate text-copy-primary">
              {selectedSpec?.filename ?? "Generated spec"}
            </DialogTitle>
            <DialogDescription className="text-copy-muted">
              {selectedSpec ? formatSpecDate(selectedSpec.createdAt) : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end border-b border-surface-border px-5 py-3">
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={!selectedSpec}
              onClick={() => {
                if (selectedSpec) {
                  downloadSpec(selectedSpec);
                }
              }}
            >
              <Download />
              Download
            </Button>
          </div>

          <ScrollArea className="h-[min(68vh,42rem)]">
            <div className="px-5 py-5">
              {isPreviewLoading ? (
                <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-copy-muted">
                  <LoaderCircle className="size-4 animate-spin" />
                  Loading preview...
                </div>
              ) : previewError ? (
                <div className="flex min-h-64 items-center justify-center px-3 text-center text-sm text-state-error">
                  {previewError}
                </div>
              ) : previewMarkdown ? (
                <MarkdownPreview markdown={previewMarkdown} />
              ) : null}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

function AiActivityIndicator({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "mt-1 flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium",
        active
          ? "border-ai/50 bg-accent-dim text-ai-text"
          : "border-surface-border bg-elevated text-copy-muted",
      )}
      aria-live="polite"
    >
      {active ? <LoaderCircle className="size-3 animate-spin" /> : null}
      {active ? "Working" : "Idle"}
    </span>
  );
}

function LatestAiStatusMessage({
  active,
  level = "info",
  text,
}: {
  active: boolean;
  level?: "info" | "success" | "error";
  text?: string;
}) {
  if (!active) {
    return null;
  }

  const messageText =
    text || "Ghost AI is working.";

  return (
    <div className="px-4 py-3 border-surface-border border-b">
      <div className="flex items-center gap-2 rounded-xl border border-state-success/40 bg-elevated px-3 py-2">
        <span className="size-2 rounded-full bg-state-success animate-pulse shrink-0" />
        <LoaderCircle className="size-4 shrink-0 animate-spin text-state-success" />
        <p
          className={cn(
            "truncate text-sm",
            level === "error"
              ? "text-state-error"
              : level === "success"
                ? "text-state-success"
                : "text-copy-primary",
          )}
          aria-live="polite"
        >
          {messageText}
        </p>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: AiChatFeedMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-6",
          isUser
            ? "border border-state-success/70 bg-state-success text-base"
            : "border border-surface-border bg-elevated text-copy-primary"
        )}
      >
        <div className="mb-1 flex items-center gap-2 text-[11px] leading-4 text-copy-muted">
          <span className="min-w-0 truncate font-medium">{message.sender}</span>
          <time dateTime={message.timestamp} className="shrink-0">
            {formatChatTimestamp(message.timestamp)}
          </time>
        </div>
        {message.content}
      </div>
    </div>
  );
}

function MarkdownPreview({ markdown }: { markdown: string }) {
  const blocks = parseMarkdownBlocks(markdown);

  return (
    <div className="space-y-4 text-sm leading-6 text-copy-secondary">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const HeadingTag = `h${block.level}` as "h1" | "h2" | "h3";

          return (
            <HeadingTag
              key={`${block.type}-${index}`}
              className={cn(
                "font-semibold text-copy-primary",
                block.level === 1 ? "text-xl" : "text-base",
              )}
            >
              {block.text}
            </HeadingTag>
          );
        }

        if (block.type === "list") {
          return (
            <ul
              key={`${block.type}-${index}`}
              className="list-disc space-y-1 pl-5"
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{item}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "code") {
          return (
            <pre
              key={`${block.type}-${index}`}
              className="overflow-x-auto rounded-2xl border border-surface-border bg-elevated p-3 font-mono text-xs leading-5 text-copy-primary"
            >
              <code>{block.text}</code>
            </pre>
          );
        }

        return (
          <p key={`${block.type}-${index}`} className="whitespace-pre-wrap">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

function getResponseError(
  data: { error?: unknown } | null,
  fallbackMessage: string,
) {
  return data && typeof data.error === "string" && data.error.length > 0
    ? data.error
    : fallbackMessage;
}

async function readJsonResponse<TResponse>(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as TResponse;
  } catch {
    return null;
  }
}

function normalizeSpecs(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): ProjectSpecListItem | null => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const record = item as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : null;
      const createdAt =
        typeof record.createdAt === "string" ? record.createdAt : null;

      if (!id || !createdAt) {
        return null;
      }

      return {
        id,
        createdAt,
        filename:
          getFilenameFromUnknown(record.filename) ??
          getFilenameFromUnknown(record.name) ??
          `ghost-ai-spec-${id}.md`,
      };
    })
    .filter((spec): spec is ProjectSpecListItem => spec !== null);
}

function getFilenameFromUnknown(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function getSpecDownloadPath(projectId: string, specId: string) {
  return `/api/projects/${encodeURIComponent(projectId)}/specs/${encodeURIComponent(specId)}/download`;
}

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; text: string }
  | { type: "paragraph"; text: string };

function parseMarkdownBlocks(markdown: string) {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let paragraphLines: string[] = [];
  let listItems: string[] = [];
  let codeLines: string[] | null = null;

  function flushParagraph() {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push({
      type: "paragraph",
      text: paragraphLines.join("\n"),
    });
    paragraphLines = [];
  }

  function flushList() {
    if (listItems.length === 0) {
      return;
    }

    blocks.push({
      type: "list",
      items: listItems,
    });
    listItems = [];
  }

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      flushParagraph();
      flushList();

      if (codeLines === null) {
        codeLines = [];
      } else {
        blocks.push({
          type: "code",
          text: codeLines.join("\n"),
        });
        codeLines = null;
      }

      continue;
    }

    if (codeLines !== null) {
      codeLines.push(line);
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2],
      });
      continue;
    }

    const listMatch = /^\s*[-*]\s+(.+)$/.exec(line);
    if (listMatch) {
      flushParagraph();
      listItems.push(listMatch[1]);
      continue;
    }

    if (line.trim().length === 0) {
      flushParagraph();
      flushList();
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  if (codeLines !== null) {
    blocks.push({
      type: "code",
      text: codeLines.join("\n"),
    });
  }

  return blocks;
}

function getValidatedChatMessages(feedMessages: ReturnType<typeof useFeedMessages>) {
  if (!("messages" in feedMessages)) {
    return [];
  }

  return (feedMessages.messages ?? [])
    .map((message) => validateAiChatFeedMessage(message))
    .filter((message): message is AiChatFeedMessage => message !== null)
    .sort((firstMessage, secondMessage) => {
      return (
        new Date(firstMessage.timestamp).getTime() -
        new Date(secondMessage.timestamp).getTime()
      );
    });
}

function getRunSummary(output: unknown) {
  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return null;
  }

  const summary = (output as Record<string, unknown>).summary;

  return typeof summary === "string" && summary.trim().length > 0
    ? summary.trim()
    : null;
}

function formatRunStatus(status: string) {
  return status.toLowerCase().replaceAll("_", " ");
}

function formatChatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatSpecDate(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}
