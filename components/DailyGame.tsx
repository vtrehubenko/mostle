"use client";

import { useEffect, useMemo, useState } from "react";
import type { DailyGameDTO, MetricKey } from "@/types/game";
import { metricsForGame } from "@/types/game";
import type { CSSProperties } from "react";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
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
}: {
  id: string;
  title: string;
  subtitle?: string;
  isSelected?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });

  const style: CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "rounded-xl border p-3 text-left transition bg-white",
        isSelected ? "border-neutral-900" : "hover:bg-neutral-50",
        isDragging ? "opacity-50" : "",
      ].join(" ")}
      {...listeners}
      {...attributes}
    >
      <div className="font-medium">{title}</div>
      {subtitle && (
        <div className="mt-1 text-xs text-neutral-500">{subtitle}</div>
      )}
    </div>
  );
}

function DroppableSlot({
  id,
  title,
  hint,
  children,
  isOver,
}: {
  id: string;
  title: string;
  hint: string;
  children?: React.ReactNode;
  isOver: boolean;
}) {
  return (
    <div
      className={[
        "w-full rounded-xl border p-3 text-left transition",
        isOver ? "bg-neutral-50 border-neutral-900" : "bg-white",
      ].join(" ")}
    >
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-xs text-neutral-500">{hint}</div>
      <div className="mt-3">{children}</div>
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

  const poolObjects = useMemo(() => {
    if (!game) return [];
    const used = new Set<string>();
    (Object.keys(assignment) as MetricKey[]).forEach((k) => {
      const v = assignment[k];
      if (v) used.add(v);
    });
    return game.objects.filter((o) => !used.has(o.id));
  }, [game, assignment]);

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

  function handleDragStart(id: string) {
    setActiveId(id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const objectId = String(active.id);
    const overId = String(over.id);

    // Drop to pool (unassign)
    if (overId === DROPPABLE_POOL_ID) {
      const fromSlot = findSlotByObjectId(objectId);
      if (!fromSlot) return;

      setAssignment((prev) => ({ ...prev, [fromSlot]: null }));
      setCheckState({ status: "idle" });
      return;
    }

    // Drop to a slot
    const slot = overId as MetricKey;

    setAssignment((prev) => {
      const next: Assignment = { ...prev };

      const fromSlot = findSlotByObjectId(objectId);

      // If dragged from some slot -> clear it first
      if (fromSlot) next[fromSlot] = null;

      const existingInTarget = next[slot];

      // Put in target
      next[slot] = objectId;

      // Swap: if target was occupied, move that item back to fromSlot (if existed), else drop to pool
      if (existingInTarget) {
        if (fromSlot) {
          next[fromSlot] = existingInTarget;
        } else {
          // was from pool -> existing item goes to pool (i.e., unassigned)
        }
      }

      return next;
    });

    setCheckState({ status: "idle" });
  }

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
        onDragStart={(e) => handleDragStart(String(e.active.id))}
        onDragEnd={handleDragEnd}
      >
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {/* LEFT: pool (objects) */}
          <DroppableWrapper droppableId={DROPPABLE_POOL_ID}>
            {({ isOver }) => (
              <div
                className={[
                  "rounded-2xl border bg-white p-5 shadow-sm transition",
                  isOver ? "border-neutral-900 bg-neutral-50" : "",
                ].join(" ")}
              >
                <h3 className="text-base font-semibold">Objects</h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Drag one object into a metric slot.
                </p>

                <div className="mt-3 grid gap-2">
                  {poolObjects.map((o) => (
                    <DraggableCard
                      key={o.id}
                      id={o.id}
                      title={o.name}
                      subtitle="Drag me"
                    />
                  ))}
                  {poolObjects.length === 0 && (
                    <div className="text-sm text-neutral-400">
                      All objects assigned
                    </div>
                  )}
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

          {/* RIGHT: slots (metrics) */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
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
                        id={m.key}
                        title={m.label}
                        hint={m.hint}
                        isOver={isOver}
                      >
                        {placed ? (
                          <div className="flex items-center justify-between gap-3">
                            <DraggableCard
                              id={placed}
                              title={labelForObject(placed)}
                              subtitle="Drag to move"
                            />
                            {checkMark === true && (
                              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                                OK
                              </span>
                            )}
                            {checkMark === false && (
                              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                                NO
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-neutral-400">
                            Drop here
                          </div>
                        )}
                      </DroppableSlot>
                    )}
                  </DroppableWrapper>
                );
              })}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="rounded-xl border bg-white p-3 shadow-lg">
              <div className="font-medium">{overlayTitle}</div>
              <div className="mt-1 text-xs text-neutral-500">Dragging…</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}
