"use client";

import { KeyboardEvent, useRef, useState } from "react";
import { Bot, Download, FileText, Send, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
}

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function resizeTextarea(textarea: HTMLTextAreaElement) {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }

  function submitMessage(content: string) {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        role: "user",
        content: trimmedContent,
      },
    ]);
    setDraft("");

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "72px";
    }
  }

  function handlePromptChip(prompt: string) {
    setDraft(prompt);

    window.requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }

      resizeTextarea(textarea);
      textarea.focus();
    });
  }

  function handleInputChange(value: string) {
    setDraft(value);

    const textarea = textareaRef.current;
    if (textarea) {
      resizeTextarea(textarea);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    submitMessage(draft);
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
              Collaborate with Ghost AI
            </p>
          </div>
        </div>
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
          <TabsList className="grid grid-cols-2 bg-subtle p-1 w-full h-9">
            <TabsTrigger
              value="ai-architect"
              className="text-copy-muted data-active:text-ai-text data-active:bg-accent-dim"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="text-copy-muted data-active:text-ai-text data-active:bg-accent-dim"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="ai-architect"
          className="top-16 bottom-0 absolute inset-x-0 flex flex-col mt-0 overflow-hidden"
        >
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="px-4 py-4 h-full">
              {messages.length === 0 ? (
                <div className="flex flex-col justify-center items-center px-2 py-10 min-h-full text-center">
                  <span className="flex justify-center items-center bg-elevated border border-surface-border rounded-2xl size-12 text-ai-text">
                    <Bot className="size-5" />
                  </span>
                  <p className="mt-4 font-medium text-copy-primary text-sm">
                    Start with a system prompt.
                  </p>
                  <p className="mt-2 text-copy-muted text-sm leading-6">
                    Ask Ghost AI to sketch architecture, services, data flow, or
                    deployment shape.
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
                  {messages.map((message) => (
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
              submitMessage(draft);
            }}
          >
            <div className="bg-elevated p-2 border border-surface-border rounded-2xl">
              <Textarea
                ref={textareaRef}
                value={draft}
                placeholder="Ask Ghost AI to design, revise, or explain..."
                className="bg-transparent shadow-none px-2 py-2 border-0 focus-visible:ring-0 min-h-18 max-h-40 text-copy-primary text-sm resize-none"
                onChange={(event) => handleInputChange(event.target.value)}
                onKeyDown={handleKeyDown}
              />

              <div className="flex justify-end mt-2">
                <Button
                  type="submit"
                  size="sm"
                  className="bg-ai hover:bg-ai/90 text-copy-primary"
                  disabled={!draft.trim()}
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
          className="top-16 bottom-0 absolute inset-x-0 data-active:flex flex-col gap-4 p-4 overflow-hidden"
        >
          <Button
            type="button"
            className="bg-ai hover:bg-ai/90 w-full text-copy-primary"
          >
            <FileText />
            Generate Spec
          </Button>

          <div className="bg-elevated p-4 border border-surface-border rounded-2xl">
            <div className="flex items-start gap-3">
              <span className="flex justify-center items-center bg-base border border-surface-border rounded-xl size-9 text-ai-text shrink-0">
                <FileText className="size-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-copy-primary text-sm truncate">
                  Architecture Spec
                </p>
                <p className="mt-2 text-copy-muted text-sm leading-6">
                  Draft technical specification generated from the current
                  canvas graph.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="mt-4 w-full"
              disabled
            >
              <Download />
              Download
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "px-3 py-2 rounded-2xl max-w-[88%] text-sm leading-6",
          isUser
            ? "border-2 border-brand/50 bg-accent-dim text-copy-primary"
            : "border border-surface-border bg-elevated text-ai-text"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
