"use client";

import { Component, ReactNode } from "react";
import { ClientSideSuspense, LiveblocksProvider, RoomProvider } from "@liveblocks/react";

import { CollaborativeCanvas } from "@/components/editor/collaborative-canvas";

interface CanvasRoomProps {
  roomId: string;
}

interface CanvasErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface CanvasErrorBoundaryState {
  hasError: boolean;
}

export function CanvasRoom({ roomId }: CanvasRoomProps) {
  return (
    <CanvasErrorBoundary fallback={<CanvasConnectionError />}>
      <LiveblocksProvider
        authEndpoint={async (room) => {
          const response = await fetch("/api/liveblocks-auth", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              projectId: roomId,
              room,
            }),
          });

          return await response.json();
        }}
      >
        <RoomProvider
          id={roomId}
          initialPresence={{
            cursor: null,
            isThinking: false,
          }}
        >
          <ClientSideSuspense fallback={<CanvasLoading />}>
            {() => <CollaborativeCanvas />}
          </ClientSideSuspense>
        </RoomProvider>
      </LiveblocksProvider>
    </CanvasErrorBoundary>
  );
}

class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function CanvasLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-base text-sm text-copy-muted">
      Loading canvas...
    </div>
  );
}

function CanvasConnectionError() {
  return (
    <div className="flex h-full items-center justify-center bg-base px-6 text-center">
      <div className="rounded-2xl border border-surface-border bg-surface px-6 py-5">
        <p className="text-sm font-medium text-copy-primary">
          Canvas connection failed
        </p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-copy-muted">
          Reload the workspace after checking the Liveblocks connection.
        </p>
      </div>
    </div>
  );
}
