"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { GraphEdge, GraphNode } from "@/lib/balance-data";

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

const COLORS: Record<GraphNode["kind"], string> = {
  person: "#1d4f78",
  company: "#1f5c45",
  concept: "#7a4e12",
  payment: "#8b1e1e",
};

const KIND_LABEL: Record<GraphNode["kind"], string> = {
  person: "Persona",
  company: "Empresa",
  concept: "Concepto",
  payment: "Monto OCR",
};

function layout(nodes: GraphNode[]) {
  const width = 920;
  const padX = 80;
  const center = nodes.find((n) => n.id.startsWith("center:"));
  const concepts = nodes.filter((n) => n.kind === "concept");
  const payments = nodes.filter((n) => n.kind === "payment");
  const related = nodes.filter(
    (n) =>
      (n.kind === "person" || n.kind === "company") &&
      !n.id.startsWith("center:"),
  );

  const midRow = [...concepts, ...payments];
  const y0 = 56;
  const y1 = 170;
  const y2 = 320;
  const height = 400;

  const pos = new Map<string, { x: number; y: number }>();
  if (center) pos.set(center.id, { x: width / 2, y: y0 });

  midRow.forEach((n, i) => {
    const span = Math.max(midRow.length - 1, 1);
    const x =
      midRow.length === 1
        ? width / 2
        : padX + ((width - padX * 2) * i) / span;
    pos.set(n.id, { x, y: y1 });
  });

  // Related: up to 2 rows so circles don't crowd
  const perRow = Math.ceil(related.length / 2) || 1;
  related.forEach((n, i) => {
    const row = i < perRow ? 0 : 1;
    const idx = row === 0 ? i : i - perRow;
    const count = row === 0 ? Math.min(related.length, perRow) : related.length - perRow;
    const span = Math.max(count - 1, 1);
    const x =
      count === 1 ? width / 2 : padX + ((width - padX * 2) * idx) / span;
    const y = y2 + row * 70;
    pos.set(n.id, { x, y });
  });

  const finalHeight = related.length > perRow ? height + 40 : height;
  return { width, height: finalHeight, pos, center, related, midRow };
}

export function EntityGraphView({ nodes, edges }: Props) {
  const router = useRouter();
  const { width, height, pos, related, midRow, center } = useMemo(
    () => layout(nodes),
    [nodes],
  );

  function go(node: GraphNode) {
    if (!node.href || node.id.startsWith("center:")) return;
    router.push(node.href);
  }

  const clickable = related;

  return (
    <div className="graph-wrap">
      <p className="graph-help">
        El dibujo es el mapa. Los <strong>nombres completos</strong> están en la
        lista de abajo — ahí también podés hacer click para abrir otra ficha.
      </p>

      <div className="graph-scroll">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="graph-svg"
          role="img"
          aria-label="Grafo de relaciones"
        >
          {edges.map((e) => {
            const a = pos.get(e.source);
            const b = pos.get(e.target);
            if (!a || !b) return null;
            return (
              <line
                key={e.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#b7c4bb"
                strokeWidth="1.6"
              />
            );
          })}

          {nodes.map((n) => {
            const p = pos.get(n.id);
            if (!p) return null;
            const isCenter = n.id.startsWith("center:");
            const canClick = Boolean(n.href) && !isCenter;
            const r = isCenter ? 38 : n.kind === "concept" ? 26 : 30;

            return (
              <g
                key={n.id}
                transform={`translate(${p.x}, ${p.y})`}
                style={{ cursor: canClick ? "pointer" : "default" }}
                onClick={() => go(n)}
                tabIndex={canClick ? 0 : undefined}
                role={canClick ? "link" : undefined}
                onKeyDown={(ev) => {
                  if (canClick && (ev.key === "Enter" || ev.key === " ")) {
                    ev.preventDefault();
                    go(n);
                  }
                }}
              >
                <title>
                  {KIND_LABEL[n.kind]}: {n.label}
                  {n.detail ? ` — ${n.detail}` : ""}
                  {canClick ? " (click para abrir)" : ""}
                </title>
                <circle
                  r={r}
                  fill={COLORS[n.kind]}
                  stroke="#fff"
                  strokeWidth={isCenter ? 3 : 2}
                />
                <text
                  y={5}
                  textAnchor="middle"
                  fontSize={isCenter ? 14 : 12}
                  fontWeight={700}
                  fill="#fff"
                >
                  {n.kind === "person"
                    ? "P"
                    : n.kind === "company"
                      ? "E"
                      : n.kind === "concept"
                        ? "C"
                        : "$"}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="graph-legend">
        <span><i className="dot company" /> Empresa</span>
        <span><i className="dot person" /> Persona</span>
        <span><i className="dot concept" /> Concepto</span>
        <span><i className="dot payment" /> Monto (OCR)</span>
      </div>

      {center && (
        <div className="conn-list">
          <h3>Ficha central</h3>
          <div className="conn-static">
            <span className={`tag ${center.kind}`}>
              {KIND_LABEL[center.kind]}
            </span>
            <div>
              <strong>{center.label}</strong>
              {center.detail ? <em>{center.detail}</em> : null}
            </div>
          </div>
        </div>
      )}

      {midRow.length > 0 && (
        <div className="conn-list">
          <h3>Conceptos / montos</h3>
          <ul>
            {midRow.map((n) => (
              <li key={n.id}>
                <div className="conn-static">
                  <span className={`tag ${n.kind === "payment" ? "payment" : "concept"}`}>
                    {KIND_LABEL[n.kind]}
                  </span>
                  <div>
                    <strong>{n.label}</strong>
                    {n.detail ? <em>{n.detail}</em> : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {clickable.length > 0 && (
        <div className="conn-list">
          <h3>Conexiones (click para abrir su árbol)</h3>
          <ul>
            {clickable.map((n) => (
              <li key={n.id}>
                <button type="button" className="conn-btn" onClick={() => go(n)}>
                  <span className={`tag ${n.kind}`}>{KIND_LABEL[n.kind]}</span>
                  <strong>{n.label}</strong>
                  <em>{n.detail}</em>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
