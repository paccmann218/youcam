"use client";

import { useMemo, useRef, useState } from "react";
import { cx } from "./cx";

export type ChartPoint = { x: number; y: number; on?: boolean; label?: string };

const W = 520;
const H = 240;
const PAD = { top: 18, right: 16, bottom: 30, left: 40 };

/**
 * Single-series line chart with an optional noise band (baseline ± MDC) and an
 * "on product" region. Hover shows a crosshair and tooltip; a table view sits under it.
 */
export function LineChart({
  title,
  points,
  series = "a",
  dashed = false,
  baseline,
  mdc,
  yLabel = "raw_score",
  xLabel = "day",
  emptyText = "Nothing to draw.",
}: {
  title: string;
  points: ChartPoint[];
  series?: "a" | "b";
  dashed?: boolean;
  baseline?: number | null;
  mdc?: number | null;
  yLabel?: string;
  xLabel?: string;
  emptyText?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const geometry = useMemo(() => {
    if (points.length === 0) return null;
    const ys = points.map((point) => point.y);
    const band = baseline != null && mdc != null ? [baseline - mdc, baseline + mdc] : null;
    let min = Math.min(...ys, ...(band ?? []));
    let max = Math.max(...ys, ...(band ?? []));
    const room = Math.max(1, (max - min) * 0.15);
    min = Math.floor(min - room);
    max = Math.ceil(max + room);
    const xs = points.map((point) => point.x);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const sx = (x: number) => PAD.left + (xMax === xMin ? 0.5 : (x - xMin) / (xMax - xMin)) * (W - PAD.left - PAD.right);
    const sy = (y: number) => PAD.top + (1 - (y - min) / (max - min || 1)) * (H - PAD.top - PAD.bottom);
    const ticks = Array.from({ length: 4 }, (_, index) => min + ((max - min) * index) / 3);
    const xTicks = points.length <= 8 ? points.map((point) => point.x) : [xMin, Math.round((xMin + xMax) / 2), xMax];
    const firstOn = points.find((point) => point.on);
    const d = points.map((point, index) => `${index === 0 ? "M" : "L"}${sx(point.x).toFixed(1)} ${sy(point.y).toFixed(1)}`).join(" ");
    return { sx, sy, ticks, xTicks, band, firstOn, d };
  }, [points, baseline, mdc]);

  const stroke = series === "a" ? "stroke-series-a" : "stroke-series-b";
  const fill = series === "a" ? "fill-series-a" : "fill-series-b";

  function onMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!geometry || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let gap = Infinity;
    points.forEach((point, index) => {
      const dist = Math.abs(geometry.sx(point.x) - x);
      if (dist < gap) {
        gap = dist;
        best = index;
      }
    });
    setHover(best);
  }

  const active = hover != null ? points[hover] : null;

  return (
    <figure className="rounded-3xl border border-line bg-card p-5 shadow-soft">
      <figcaption className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          <svg width="22" height="8" aria-hidden="true">
            <path d="M1 4h20" className={stroke} strokeWidth="2" strokeDasharray={dashed ? "4 3" : undefined} strokeLinecap="round" />
          </svg>
          {title}
        </span>
        {geometry?.band ? (
          <span className="flex items-center gap-2 text-xs text-quiet">
            <span className="h-3 w-5 rounded-sm border border-dashed border-ink/25 bg-ink/[0.06]" aria-hidden="true" />
            noise band ±{mdc?.toFixed(1)}
          </span>
        ) : null}
      </figcaption>

      {!geometry ? (
        <div className="mt-4 flex h-48 items-center justify-center rounded-2xl border border-dashed border-line px-6 text-center text-sm text-quiet">{emptyText}</div>
      ) : (
        <div className="relative mt-3">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full touch-none select-none"
            role="img"
            aria-label={`${title}: ${points.length} points`}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          >
            {/* grid + y ticks */}
            {geometry.ticks.map((tick) => (
              <g key={tick}>
                <path d={`M${PAD.left} ${geometry.sy(tick)}H${W - PAD.right}`} className="stroke-line" strokeWidth="1" />
                <text x={PAD.left - 8} y={geometry.sy(tick) + 3.5} textAnchor="end" fontSize="10" className="num fill-quiet font-mono">
                  {tick.toFixed(0)}
                </text>
              </g>
            ))}
            {/* on-product region */}
            {geometry.firstOn ? (
              <g>
                <rect
                  x={geometry.sx(geometry.firstOn.x) - 6}
                  y={PAD.top}
                  width={W - PAD.right - geometry.sx(geometry.firstOn.x) + 6}
                  height={H - PAD.top - PAD.bottom}
                  className="fill-ink/[0.035]"
                />
                <text x={geometry.sx(geometry.firstOn.x)} y={PAD.top + 11} fontSize="9.5" className="fill-quiet font-mono" letterSpacing="1">
                  ON PRODUCT
                </text>
              </g>
            ) : null}
            {/* noise band */}
            {geometry.band ? (
              <g>
                <rect
                  x={PAD.left}
                  y={geometry.sy(geometry.band[1])}
                  width={W - PAD.left - PAD.right}
                  height={Math.max(1, geometry.sy(geometry.band[0]) - geometry.sy(geometry.band[1]))}
                  className="fill-ink/[0.06]"
                />
                <path d={`M${PAD.left} ${geometry.sy(geometry.band[1])}H${W - PAD.right}M${PAD.left} ${geometry.sy(geometry.band[0])}H${W - PAD.right}`} className="stroke-ink/25" strokeDasharray="3 4" />
              </g>
            ) : null}
            {/* axis */}
            <path d={`M${PAD.left} ${H - PAD.bottom}H${W - PAD.right}`} className="stroke-ink/30" />
            {geometry.xTicks.map((tick) => (
              <text key={tick} x={geometry.sx(tick)} y={H - PAD.bottom + 16} textAnchor="middle" fontSize="10" className="num fill-quiet font-mono">
                {tick}
              </text>
            ))}
            <text x={W - PAD.right} y={H - 2} textAnchor="end" fontSize="9.5" className="fill-quiet">
              {xLabel}
            </text>
            <text x={4} y={PAD.top - 6} fontSize="9.5" className="fill-quiet">
              {yLabel}
            </text>

            {/* series */}
            <path
              d={geometry.d}
              fill="none"
              className={cx(stroke, !dashed && "draw-line")}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={dashed ? "6 5" : undefined}
            />
            {points.length <= 40
              ? points.map((point, index) => (
                  <circle key={`${point.x}-${index}`} cx={geometry.sx(point.x)} cy={geometry.sy(point.y)} r="4" className={cx(fill, "stroke-card")} strokeWidth="2" />
                ))
              : null}

            {/* crosshair */}
            {active ? (
              <g pointerEvents="none">
                <path d={`M${geometry.sx(active.x)} ${PAD.top}V${H - PAD.bottom}`} className="stroke-ink/30" />
                <circle cx={geometry.sx(active.x)} cy={geometry.sy(active.y)} r="6" className={cx(fill, "stroke-card")} strokeWidth="2.5" />
              </g>
            ) : null}
          </svg>
          {active ? (
            <div
              className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl border border-line bg-elevated px-3 py-2 text-xs shadow-lift"
              style={{ left: `${(geometry.sx(active.x) / W) * 100}%` }}
            >
              <p className="text-quiet">{active.label ?? `${xLabel} ${active.x}`}</p>
              <p className="num font-mono text-sm font-medium text-ink">{active.y.toFixed(1)}</p>
              {active.on != null ? <p className="text-quiet">{active.on ? "on product" : "before"}</p> : null}
            </div>
          ) : null}
        </div>
      )}

      {points.length > 0 ? (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-quiet hover:text-ink">Show as table</summary>
          <div className="mt-2 max-h-56 overflow-auto rounded-2xl border border-line">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-card text-xs uppercase tracking-wider text-quiet">
                <tr>
                  <th className="px-3 py-2 font-medium">{xLabel}</th>
                  <th className="px-3 py-2 font-medium">{yLabel}</th>
                  <th className="px-3 py-2 font-medium">phase</th>
                </tr>
              </thead>
              <tbody className="num font-mono">
                {points.map((point, index) => (
                  <tr key={`${point.x}-${index}`} className="border-t border-line">
                    <td className="px-3 py-1.5">{point.label ?? point.x}</td>
                    <td className="px-3 py-1.5">{point.y.toFixed(1)}</td>
                    <td className="px-3 py-1.5 font-sans text-quiet">{point.on == null ? "—" : point.on ? "on product" : "before"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </figure>
  );
}
