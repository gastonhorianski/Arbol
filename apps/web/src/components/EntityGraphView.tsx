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

function shortLabel(text: string, max = 22) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function layout(nodes: GraphNode[]) {
  const width = 980;
  const padX = 70;
  const center = nodes.find((n) => n.id.startsWith("center:"));
  const concepts = nodes.filter((n) => n.kind === "concept");
  const payments = nodes.filter((n) => n.kind === "payment");
  const related = nodes.filter(
    (n) =>
      (n.kind === "person" || n.kind === "company") &&
      !n.id.startsWith("center:"),
  );

  const midRow = [...concepts, ...payments];
  const rowGap = 150;
  const y0 = 70;
  const y1 = y0 + rowGap;
  const y2 = y1 + rowGap + 20;
  const height = y2 + 120;

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

  related.forEach((n, i) => {
    const span = Math.max(related.length - 1, 1);
    const x =
      related.length === 1
        ? width / 2
        : padX + ((width - padX * 2) * i) / span;
    pos.set(n.id, { x, y: y2 });
  });

  return { width, height, pos, center, related, midRow };
}

export function EntityGraphView({ nodes, edges }: Props) {
  const router = useRouter();
  const { width, height, pos, related } = useMemo(() => layout(nodes), [nodes]);

  function go(node: GraphNode) {
    if (!node.href) return;
    if (node.id.startsWith("center:")) return;
    router.push(node.href);
  }

  return (
    <div className="graph-wrap">
      <p className="graph-help">
        Click en una <strong>persona</strong> o <strong>empresa</strong> del
        grafo (o de la lista de abajo) para abrir su árbol.
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
            const clickable = Boolean(n.href) && !isCenter;
            const r = isCenter ? 36 : n.kind === "concept" ? 24 : 28;

            return (
              <g
                key={n.id}
                transform={`translate(${p.x}, ${p.y})`}
                style={{ cursor: clickable ? "pointer" : "default" }}
                onClick={() => go(n)}
                onKeyDown={(ev) => {
                  if (clickable && (ev.key === "Enter" || ev.key === " ")) {
                    ev.preventDefault();
                    go(n);
                  }
                }}
                tabIndex={clickable ? 0 : undefined}
                role={clickable ? "link" : undefined}
              >
                <title>
                  {n.label}
                  {n.detail ? ` — ${n.detail}` : ""}
                  {clickable ? " (click para abrir)" : ""}
                </title>
                <circle
                  r={r}
                  fill={COLORS[n.kind]}
                  stroke={isCenter ? "#0f3d2c" : "#fff"}
                  strokeWidth={isCenter ? 3 : 2}
                />
                <text
                  y={4}
                  textAnchor="middle"
                  fontSize={isCenter ? 11 : 10}
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
                <text
                  y={r + 16}
                  textAnchor="middle"
                  fontSize={isCenter ? 13 : 11}
                  fontWeight={isCenter ? 700 : 600}
                  fill="#15231c"
                >
                  {shortLabel(n.label, isCenter ? 34 : 18)}
                </text>
                {n.detail ? (
                  <text
                    y={r + 30}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#5a6b60"
                  >
                    {shortLabel(n.detail, 28)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="graph-legend">
        <span>
          <i className="dot company" /> Empresa
        </span>
        <span>
          <i className="dot person" /> Persona
        </span>
        <span>
          <i className="dot concept" /> Concepto
        </span>
        <span>
          <i className="dot payment" /> Monto (OCR)
        </span>
      </div>

      {related.length > 0 && (
        <div className="conn-list">
          <h3>Conexiones clickeables</h3>
          <ul>
            {related.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className="conn-btn"
                  onClick={() => go(n)}
                >
                  <span className={`tag ${n.kind}`}>
                    {n.kind === "company" ? "Empresa" : "Persona"}
                  </span>
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
