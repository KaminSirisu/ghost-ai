"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type SyntheticEvent,
} from "react";
import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";

import { useCanvasNodeActions } from "@/components/editor/canvas-node-actions";
import { cn } from "@/lib/utils";
import {
  DEFAULT_NODE_COLOR,
  NODE_COLORS,
  type CanvasNode,
  type NodeColorPair,
  type NodeShape,
} from "@/types/canvas";

const MIN_NODE_WIDTH = 96;
const MIN_NODE_HEIGHT = 56;
const EMPTY_LABEL_PLACEHOLDER = "Add label";

export function CanvasNode({
  data,
  height,
  id,
  selected,
  width,
}: NodeProps<CanvasNode>) {
  const { updateNodeColor, updateNodeLabel } = useCanvasNodeActions();
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(data.label);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nodeWidth = width ?? 160;
  const nodeHeight = height ?? 88;
  const nodeTextColor = data.textColor || DEFAULT_NODE_COLOR.text;

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [isEditing]);

  const startEditing = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    setDraftLabel(data.label);
    setIsEditing(true);
  };

  const handleLabelChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextLabel = event.target.value;

    setDraftLabel(nextLabel);
    updateNodeLabel(id, nextLabel);
  };

  const handleEditingKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    event.stopPropagation();

    if (event.key === "Escape") {
      event.preventDefault();
      setIsEditing(false);
      textareaRef.current?.blur();
    }
  };

  const stopEditingInteraction = (event: SyntheticEvent) => {
    event.stopPropagation();
  };

  const handleColorSelect = (colorPair: NodeColorPair) => {
    updateNodeColor(id, colorPair.fill, colorPair.text);
  };

  return (
    <div
      className="group relative flex items-center justify-center text-center text-sm font-medium"
      style={{
        height: nodeHeight,
        width: nodeWidth,
      }}
    >
      <NodeResizer
        isVisible={selected}
        minHeight={MIN_NODE_HEIGHT}
        minWidth={MIN_NODE_WIDTH}
        color="var(--accent-primary)"
        lineClassName="!border-brand/50"
        handleClassName="nodrag nopan !h-2.5 !w-2.5 !border !border-base !bg-brand !shadow-none"
      />
      <NodeShape
        color={data.color}
        height={nodeHeight}
        selected={selected}
        shape={data.shape}
        width={nodeWidth}
      />
      {selected ? (
        <NodeColorToolbar
          activeColor={data.color}
          activeTextColor={nodeTextColor}
          onColorSelect={handleColorSelect}
          onToolbarInteraction={stopEditingInteraction}
        />
      ) : null}
      <div
        className="relative z-10 flex h-full w-full items-center justify-center px-4"
        onDoubleClick={startEditing}
      >
        <span
          className={cn(
            "pointer-events-none whitespace-pre-wrap break-words leading-snug text-copy-primary",
            !data.label && "text-copy-muted",
            isEditing && "opacity-0",
          )}
          style={{ color: nodeTextColor }}
        >
          {data.label || EMPTY_LABEL_PLACEHOLDER}
        </span>
        {isEditing ? (
          <div
            className="nodrag nopan absolute inset-0 z-20 flex items-center justify-center px-4"
            onClick={stopEditingInteraction}
            onDoubleClick={stopEditingInteraction}
            onMouseDown={stopEditingInteraction}
            onPointerDown={stopEditingInteraction}
            onWheel={stopEditingInteraction}
          >
            <textarea
              ref={textareaRef}
              aria-label="Node label"
              className="h-[1.25rem] max-h-[calc(100%-1rem)] w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-center text-sm font-medium leading-snug text-copy-primary outline-none placeholder:text-copy-muted"
              placeholder={EMPTY_LABEL_PLACEHOLDER}
              rows={1}
              style={{ color: nodeTextColor }}
              value={draftLabel}
              onBlur={() => setIsEditing(false)}
              onChange={handleLabelChange}
              onKeyDown={handleEditingKeyDown}
            />
          </div>
        ) : null}
      </div>
      <CanvasHandles />
    </div>
  );
}

interface NodeColorToolbarProps {
  activeColor: string;
  activeTextColor: string;
  onColorSelect: (colorPair: NodeColorPair) => void;
  onToolbarInteraction: (event: SyntheticEvent) => void;
}

type SwatchStyle = CSSProperties & {
  "--swatch-glow": string;
};

function NodeColorToolbar({
  activeColor,
  activeTextColor,
  onColorSelect,
  onToolbarInteraction,
}: NodeColorToolbarProps) {
  return (
    <div
      className="nodrag nopan absolute left-1/2 top-0 z-30 flex -translate-x-1/2 -translate-y-[calc(100%+0.75rem)] gap-1 rounded-xl border border-surface-border bg-surface/95 p-1 shadow-lg shadow-base/40"
      aria-label="Node colors"
      onClick={onToolbarInteraction}
      onDoubleClick={onToolbarInteraction}
      onMouseDown={onToolbarInteraction}
      onPointerDown={onToolbarInteraction}
      onWheel={onToolbarInteraction}
    >
      {NODE_COLORS.map((colorPair, index) => {
        const isActive =
          activeColor === colorPair.fill && activeTextColor === colorPair.text;
        const swatchStyle: SwatchStyle = {
          "--swatch-glow": `${colorPair.text}66`,
          backgroundColor: colorPair.fill,
          borderColor: colorPair.text,
        };

        return (
          <button
            key={`${colorPair.fill}-${colorPair.text}`}
            type="button"
            className={cn(
              "h-5 w-5 rounded-full border transition duration-150 hover:shadow-[0_0_0_3px_var(--swatch-glow)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              isActive
                ? "scale-110 border-2 ring-2 ring-brand ring-offset-1 ring-offset-surface"
                : "border opacity-85 hover:opacity-100",
            )}
            style={swatchStyle}
            aria-label={`Apply node color ${index + 1}`}
            aria-pressed={isActive}
            onClick={() => onColorSelect(colorPair)}
          />
        );
      })}
    </div>
  );
}

interface NodeShapeProps {
  color: string;
  height: number;
  selected?: boolean;
  shape: NodeShape;
  width: number;
}

export function NodeShape({
  color,
  height,
  selected = false,
  shape,
  width,
}: NodeShapeProps) {
  const strokeColor = selected ? "var(--accent-primary)" : "var(--border-subtle)";
  const strokeWidth = selected ? 3 : 2;

  if (shape === "diamond") {
    return (
      <svg
        className="absolute inset-0"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        aria-hidden="true"
      >
        <polygon
          points={`${width / 2},1 ${width - 1},${height / 2} ${width / 2},${height - 1} 1,${height / 2}`}
          fill={color}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  if (shape === "hexagon") {
    return (
      <svg
        className="absolute inset-0"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        aria-hidden="true"
      >
        <polygon
          points={`${width * 0.24},1 ${width * 0.76},1 ${width - 1},${height / 2} ${width * 0.76},${height - 1} ${width * 0.24},${height - 1} 1,${height / 2}`}
          fill={color}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  if (shape === "cylinder") {
    const ellipseHeight = Math.min(24, height * 0.24);

    return (
      <svg
        className="absolute inset-0"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        aria-hidden="true"
      >
        <path
          d={`M1 ${ellipseHeight / 2} C1 1 ${width - 1} 1 ${width - 1} ${ellipseHeight / 2} V${height - ellipseHeight / 2} C${width - 1} ${height - 1} 1 ${height - 1} 1 ${height - ellipseHeight / 2} Z`}
          fill={color}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        <path
          d={`M1 ${ellipseHeight / 2} C1 ${ellipseHeight - 1} ${width - 1} ${ellipseHeight - 1} ${width - 1} ${ellipseHeight / 2}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  const radiusClass = {
    circle: "rounded-full",
    pill: "rounded-full",
    rectangle: "rounded-xl",
  }[shape];

  return (
    <div
      className={cn(
        "absolute inset-0 border",
        selected ? "border-brand" : "border-surface-border-subtle",
        radiusClass,
      )}
      style={{
        backgroundColor: color,
        height,
        width,
      }}
      aria-hidden="true"
    />
  );
}

function CanvasHandles() {
  const handleClassName =
    "!h-2 !w-2 !border !border-base !bg-copy-primary opacity-0 transition-opacity group-hover:opacity-100";

  return (
    <>
      <Handle
        id="top"
        className={handleClassName}
        isConnectableEnd
        isConnectableStart
        type="source"
        position={Position.Top}
      />
      <Handle
        id="right"
        className={handleClassName}
        isConnectableEnd
        isConnectableStart
        type="source"
        position={Position.Right}
      />
      <Handle
        id="bottom"
        className={handleClassName}
        isConnectableEnd
        isConnectableStart
        type="source"
        position={Position.Bottom}
      />
      <Handle
        id="left"
        className={handleClassName}
        isConnectableEnd
        isConnectableStart
        type="source"
        position={Position.Left}
      />
    </>
  );
}
