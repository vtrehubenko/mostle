"use client";

import { useEffect, useMemo, useState } from "react";
import type { DailyGameDTO, MetricKey } from "@/types/game";
import { metricsForGame } from "@/types/game";
import type { CSSProperties } from "react";
import { snapCenterToCursor } from "@dnd-kit/modifiers";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type Modifier,
} from "@dnd-kit/core";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: DailyGameDTO };

type Assignment = Record<MetricKey, string | null>;

const EMPTY_ASSIGNMENT: Assignment = {
  oldest: null,
  largest: null,
  value: null,
  influence: null,
  specialValue: null,
};

const DROPPABLE_POOL_ID = "pool";

function DraggableCard({
  id,
  title,
  subtitle,
  isSelected,
  disabled,
  variant = "full",
}: {
  id: string;
  title: string;
  subtitle?: string;
  isSelected?: boolean;
  disabled?: boolean;
  variant?: "full" | "pill";
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id, disabled });

  const style: CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const base = "rounded-xl border text-left transition bg-white";
  const full = "w-full p-3";
  const pill = "inline-flex w-fit max-w-[220px] items-center px-3 py-2";
  const hover = isSelected ? "border-neutral-900" : "hover:bg-neutral-50";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "rounded-xl border p-3 text-left transition bg-white",
        "select-none cursor-grab active:cursor-grabbing touch-none",
        isSelected ? "border-neutral-900" : "hover:bg-neutral-50",
        disabled ? "opacity-40" : "",
        isDragging ? "opacity-0" : "",
      ].join(" ")}
      {...(!disabled ? listeners : {})}
      {...attributes}
    >
      <div className="min-w-0">
        <div className="truncate font-medium">{title}</div>
        {subtitle && variant === "full" && (
          <div className="mt-1 text-xs text-neutral-500">{subtitle}</div>
        )}
      </div>
    </div>
  );
}

function StaticCard({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rounded-xl border p-3 text-left bg-white opacity-40">
      <div className="font-medium">{title}</div>
      {subtitle && (
        <div className="mt-1 text-xs text-neutral-500">{subtitle}</div>
      )}
    </div>
  );
}

function DroppableSlot({
  title,
  hint,
  placed,
  isOver,
  checkMark,
}: {
  title: string;
  hint: string;
  placed?: React.ReactNode;
  isOver: boolean;
  checkMark?: boolean | null;
}) {
  const isChecked = checkMark === true || checkMark === false;

  const baseBorder =
    checkMark === true
      ? "border-green-500 ring-2 ring-green-200"
      : checkMark === false
        ? "border-red-500 ring-2 ring-red-200"
        : "border-neutral-200";

  // ВАЖНО: когда есть результат проверки, НЕ перебиваем рамку hover/over
  const overStyle =
    !isChecked && isOver ? "bg-neutral-50 border-neutral-900" : "bg-white";

  return (
    <div
      className={[
        "w-full rounded-xl border p-4 transition",
        baseBorder,
        overStyle,
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="font-semibold">{title}</div>
          <div className="mt-1 text-xs text-neutral-500">{hint}</div>
        </div>

        <div className="shrink-0">
          {placed ?? (
            <span className="text-sm text-neutral-400">Drop here</span>
          )}
        </div>
      </div>
    </div>
  );
}
function DroppableWrapper({
  droppableId,
  children,
}: {
  droppableId: string;
  children: (props: { isOver: boolean }) => React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: droppableId });
  return <div ref={setNodeRef}>{children({ isOver })}</div>;
}

export default function DailyGame() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [assignment, setAssignment] = useState<Assignment>(EMPTY_ASSIGNMENT);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [activeRect, setActiveRect] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const [checkState, setCheckState] = useState<
    | { status: "idle" }
    | { status: "checking" }
    | {
        status: "done";
        allCorrect: boolean;
        result: Array<{ key: MetricKey; isCorrect: boolean }>;
      }
    | { status: "error"; message: string }
  >({ status: "idle" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch("/api/daily", { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as DailyGameDTO;
        if (!cancelled) setState({ status: "success", data });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        if (!cancelled) setState({ status: "error", message });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const game = state.status === "success" ? state.data : null;
  const metrics = useMemo(() => (game ? metricsForGame(game) : []), [game]);

  function labelForObject(id: string) {
    if (!game) return "";
    return game.objects.find((o) => o.id === id)?.name ?? "";
  }

  function findSlotByObjectId(objectId: string): MetricKey | null {
    const keys = Object.keys(assignment) as MetricKey[];
    for (const k of keys) {
      if (assignment[k] === objectId) return k;
    }
    return null;
  }

  function resetAll() {
    setAssignment(EMPTY_ASSIGNMENT);
    setCheckState({ status: "idle" });
  }

  function isFilledAll() {
    return (Object.keys(assignment) as MetricKey[]).every((k) => assignment[k]);
  }

  async function onCheck() {
    setCheckState({ status: "checking" });
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignment }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as {
        allCorrect: boolean;
        result: Array<{ key: MetricKey; isCorrect: boolean }>;
      };
      console.log("CHECK RESULT:", data);
      setCheckState({
        status: "done",
        allCorrect: data.allCorrect,
        result: data.result,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setCheckState({ status: "error", message });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setActiveId(null);
    setDragOffset(null);
    setActiveRect(null);

    if (!over) return;

    const objectId = String(active.id);
    const overId = String(over.id);

    if (overId === DROPPABLE_POOL_ID) {
      const fromSlot = findSlotByObjectId(objectId);
      if (!fromSlot) return;
      setAssignment((prev) => ({ ...prev, [fromSlot]: null }));
      setCheckState({ status: "idle" });
      return;
    }

    const slot = overId as MetricKey;

    setAssignment((prev) => {
      const next: Assignment = { ...prev };

      const fromSlot = findSlotByObjectId(objectId);
      if (fromSlot) next[fromSlot] = null;

      const existingInTarget = next[slot];
      next[slot] = objectId;

      if (existingInTarget && fromSlot) {
        next[fromSlot] = existingInTarget;
      }

      return next;
    });

    setCheckState({ status: "idle" });
  }

  const snapToPointer: Modifier = ({ transform }) => {
    if (!dragOffset) return transform;
    return {
      ...transform,
      x: transform.x - dragOffset.x,
      y: transform.y - dragOffset.y,
    };
  };

  if (state.status === "loading") {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8 text-sm text-neutral-500">
        Loading…
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="font-semibold text-red-700">
            Failed to load daily game
          </div>
          <div className="mt-1 text-sm text-red-700/80 break-words">
            {state.message}
          </div>
        </div>
      </section>
    );
  }

  const overlayTitle = activeId ? labelForObject(activeId) : "";

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold">{game!.theme}</h2>
          <span className="text-sm text-neutral-500">
            {new Date(game!.date).toLocaleDateString()}
          </span>
        </div>
        <p className="mt-2 text-sm text-neutral-600">
          Drag objects from the right into metric slots on the left. Drag back
          to “Objects” to unassign.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(e) => {
          const id = String(e.active.id);
          setActiveId(id);

          const p = e.activatorEvent as PointerEvent;
          const rect = e.active.rect.current.initial;

          if (rect) {
            setActiveRect({ width: rect.width, height: rect.height });
          } else {
            setActiveRect(null);
          }

          if (p && rect) {
            setDragOffset({
              x: p.clientX - rect.left,
              y: p.clientY - rect.top,
            });
          } else {
            setDragOffset(null);
          }
        }}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveId(null);
          setDragOffset(null);
          setActiveRect(null);
        }}
      >
        <div className="mt-6 grid gap-4 md:grid-cols-2 items-stretch">
          {/* LEFT: Objects */}
          <DroppableWrapper droppableId={DROPPABLE_POOL_ID}>
            {({ isOver }) => (
              <div
                className={[
                  "rounded-2xl border bg-white p-5 shadow-sm transition flex flex-col",
                  isOver ? "border-neutral-900 bg-neutral-50" : "",
                ].join(" ")}
              >
                <h3 className="text-base font-semibold">Objects</h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Drag one object into a metric slot.
                </p>

                <div className="mt-3 grid gap-2">
                  {game!.objects.map((o) => {
                    const assigned = findSlotByObjectId(o.id) !== null;

                    return assigned ? (
                      <StaticCard
                        key={o.id}
                        title={o.name}
                        subtitle="Assigned"
                      />
                    ) : (
                      <DraggableCard
                        key={o.id}
                        id={o.id}
                        title={o.name}
                        subtitle="Drag me"
                      />
                    );
                  })}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={resetAll}
                    className="rounded-xl border px-4 py-2 text-sm hover:bg-white"
                  >
                    Reset
                  </button>

                  <button
                    type="button"
                    onClick={onCheck}
                    disabled={
                      !isFilledAll() || checkState.status === "checking"
                    }
                    className={[
                      "rounded-xl px-4 py-2 text-sm font-semibold text-white",
                      !isFilledAll() || checkState.status === "checking"
                        ? "bg-neutral-300"
                        : "bg-neutral-900 hover:bg-neutral-800",
                    ].join(" ")}
                  >
                    {checkState.status === "checking" ? "Checking…" : "Check"}
                  </button>

                  {checkState.status === "done" && (
                    <span
                      className={[
                        "ml-auto rounded-xl px-3 py-2 text-sm font-semibold",
                        checkState.allCorrect
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700",
                      ].join(" ")}
                    >
                      {checkState.allCorrect ? "Perfect!" : "Not yet"}
                    </span>
                  )}
                </div>

                {checkState.status === "error" && (
                  <div className="mt-3 text-sm text-red-700 break-words">
                    {checkState.message}
                  </div>
                )}
              </div>
            )}
          </DroppableWrapper>

          {/* RIGHT: Metrics */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm flex flex-col">
            <h3 className="text-base font-semibold">Metrics</h3>

            <div className="mt-3 space-y-3">
              {metrics.map((m) => {
                const placed = assignment[m.key];
                const checkMark =
                  checkState.status === "done"
                    ? checkState.result.find((r) => r.key === m.key)?.isCorrect
                    : null;

                return (
                  <DroppableWrapper key={m.key} droppableId={m.key}>
                    {({ isOver }) => (
                      <DroppableSlot
                        title={m.label}
                        hint={m.hint}
                        isOver={isOver}
                        checkMark={
                          checkState.status === "done" ? checkMark : null
                        }
                        placed={
                          placed ? (
                            <div className="flex items-center gap-2">
                              <DraggableCard
                                id={placed}
                                title={labelForObject(placed)}
                              />
                            </div>
                          ) : undefined
                        }
                      />
                    )}
                  </DroppableWrapper>
                );
              })}
            </div>
          </div>
        </div>

        {/* Overlay same size as original card => cursor matches click point */}
        <DragOverlay modifiers={[snapCenterToCursor]}>
          {activeId ? (
            <div className="select-none cursor-grabbing touch-none inline-flex items-center rounded-xl border bg-white px-3 py-2 shadow-lg">
              <span className="max-w-[160px] truncate font-medium">
                {overlayTitle}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}
