"use client";

import { useMemo } from "react";
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

function layout(nodes: GraphNode[]) {
  const width = 900;
  const height = 560;
  const cx = width / 2;
  const cy = height / 2;
  const center = nodes.find((n) => n.id.startsWith("center:"));
  const others = nodes.filter((n) => n !== center);
  const pos = new Map<string, { x: number; y: number }>();

  if (center) pos.set(center.id, { x: cx, y: cy });

  others.forEach((n, i) => {
    const ring =
      n.kind === "concept" ? 150 : n.kind === "payment" ? 220 : 290;
    const angle = (2 * Math.PI * i) / Math.max(others.length, 1) - Math.PI / 2;
    pos.set(n.id, {
      x: cx + Math.cos(angle) * ring,
      y: cy + Math.sin(angle) * ring,
    });
  });

  return { width, height, pos, center };
}

export function EntityGraphView({ nodes, edges }: Props) {
  const { width, height, pos } = useMemo(() => layout(nodes), [nodes]);

  return (
    <div className="graph-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="graph-svg" role="img">
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#9aa89f" />
          </marker>
        </defs>

        {edges.map((e) => {
          const a = pos.get(e.source);
          const b = pos.get(e.target);
          if (!a || !b) return null;
          return (
            <g key={e.id}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#b7c4bb"
                strokeWidth="1.5"
                markerEnd="url(#arrow)"
              />
            </g>
          );
        })}

        {nodes.map((n) => {
          const p = pos.get(n.id);
          if (!p) return null;
          const isCenter = n.id.startsWith("center:");
          const r = isCenter ? 34 : n.kind === "concept" ? 22 : 26;
          const fill = COLORS[n.kind];
          const label =
            n.label.length > 28 ? `${n.label.slice(0, 26)}…` : n.label;

          return (
            <g key={n.id} transform={`translate(${p.x}, ${p.y})`}>
              <circle
                r={r}
                fill={fill}
                opacity={isCenter ? 1 : 0.92}
                stroke="#fff"
                strokeWidth={isCenter ? 3 : 2}
              />
              <text
                y={r + 14}
                textAnchor="middle"
                fontSize={isCenter ? 12 : 11}
                fontWeight={isCenter ? 700 : 500}
                fill="#15231c"
              >
                {label}
              </text>
              {n.detail ? (
                <text
                  y={r + 28}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#5a6b60"
                >
                  {n.detail}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      <div className="graph-legend">
        <span><i className="dot company" /> Empresa</span>
        <span><i className="dot person" /> Persona</span>
        <span><i className="dot concept" /> Concepto</span>
        <span><i className="dot payment" /> Monto (OCR)</span>
      </div>
    </div>
  );
}
