"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { EASE_OUT } from "./kit";

/*
 * A face drawn as a topographic map: a height field (forehead, brows, eye
 * sockets, nose, cheekbones, lips, chin) traced into contour lines with
 * marching squares. Computed once in the browser and cached.
 */

type Pt = [number, number];
export type Contour = { d: string; level: number; major: boolean };

export const FACE_W = 300;
export const FACE_H = 400;
// must divide both FACE_W and FACE_H
const STEP = 4;
const LEVELS = 15;

function bump(u: number, v: number, cx: number, cy: number, sx: number, sy: number, amp: number) {
  const dx = (u - cx) / sx;
  const dy = (v - cy) / sy;
  return amp * Math.exp(-(dx * dx + dy * dy) / 2);
}

function field(x: number, y: number): number {
  const u = (x - 150) / 150;
  const v = (y - 204) / 192;
  const narrow = 1 - 0.26 * Math.pow(Math.max(0, v), 1.5);
  const m = (u / (0.8 * narrow)) ** 2 + (v / 0.97) ** 2;
  if (m >= 1) return 0;
  // a gentle dome keeps the outer rings evenly spaced instead of crowding the edge
  let h = Math.pow(1 - m, 0.8) * 0.9;
  let f = 0;
  f += bump(u, v, 0, -0.62, 0.42, 0.24, 0.1); // forehead
  f += bump(u, v, -0.3, -0.31, 0.2, 0.06, 0.15) + bump(u, v, 0.3, -0.31, 0.2, 0.06, 0.15); // brows
  f += bump(u, v, -0.3, -0.13, 0.13, 0.075, -0.3) + bump(u, v, 0.3, -0.13, 0.13, 0.075, -0.3); // eye sockets
  f += bump(u, v, 0, 0.06, 0.075, 0.25, 0.48); // nose bridge
  f += bump(u, v, 0, 0.29, 0.11, 0.08, 0.26); // nose tip
  f += bump(u, v, -0.43, 0.19, 0.15, 0.13, 0.2) + bump(u, v, 0.43, 0.19, 0.15, 0.13, 0.2); // cheekbones
  f += bump(u, v, 0, 0.53, 0.17, 0.045, 0.13); // upper lip
  f += bump(u, v, 0, 0.6, 0.15, 0.04, 0.1); // lower lip
  f += bump(u, v, 0, 0.82, 0.13, 0.08, 0.12); // chin
  // features fade out toward the edge, so the outer rings keep the face outline clean
  h += f * Math.min(1, (1 - m) * 5);
  return h;
}

function chain(segments: [Pt, Pt][]): Pt[][] {
  const key = (p: Pt) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
  const byPoint = new Map<string, number[]>();
  segments.forEach((segment, index) => {
    for (const point of segment) {
      const k = key(point);
      const list = byPoint.get(k);
      if (list) list.push(index);
      else byPoint.set(k, [index]);
    }
  });
  const used = new Uint8Array(segments.length);
  const lines: Pt[][] = [];
  for (let start = 0; start < segments.length; start++) {
    if (used[start]) continue;
    used[start] = 1;
    const line: Pt[] = [segments[start][0], segments[start][1]];
    for (const forward of [true, false]) {
      for (;;) {
        const tail = forward ? line[line.length - 1] : line[0];
        const tailKey = key(tail);
        const next = (byPoint.get(tailKey) ?? []).find((index) => !used[index]);
        if (next === undefined) break;
        used[next] = 1;
        const [a, b] = segments[next];
        const other = key(a) === tailKey ? b : a;
        if (forward) line.push(other);
        else line.unshift(other);
      }
    }
    lines.push(line);
  }
  return lines;
}

const f1 = (n: number) => n.toFixed(1);
const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

/** Midpoint-quadratic smoothing, so the grid steps read as hand-drawn lines. */
function smooth(points: Pt[]): string {
  const n = points.length;
  const first = points[0];
  const last = points[n - 1];
  const closed = Math.hypot(first[0] - last[0], first[1] - last[1]) < 0.01;
  if (closed) {
    const ring = points.slice(0, -1);
    const start = mid(ring[0], ring[1]);
    let d = `M${f1(start[0])} ${f1(start[1])}`;
    for (let i = 1; i <= ring.length; i++) {
      const p = ring[i % ring.length];
      const q = mid(p, ring[(i + 1) % ring.length]);
      d += `Q${f1(p[0])} ${f1(p[1])} ${f1(q[0])} ${f1(q[1])}`;
    }
    return `${d}Z`;
  }
  let d = `M${f1(first[0])} ${f1(first[1])}`;
  for (let i = 1; i < n - 1; i++) {
    const q = mid(points[i], points[i + 1]);
    d += `Q${f1(points[i][0])} ${f1(points[i][1])} ${f1(q[0])} ${f1(q[1])}`;
  }
  return `${d}L${f1(last[0])} ${f1(last[1])}`;
}

let cache: Contour[] | null = null;

export function faceContours(): Contour[] {
  if (cache) return cache;
  const nx = FACE_W / STEP + 1;
  const ny = FACE_H / STEP + 1;
  const grid = new Float64Array(nx * ny);
  let max = 0;
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const value = field(i * STEP, j * STEP);
      grid[j * nx + i] = value;
      if (value > max) max = value;
    }
  }
  // The silhouette is drawn analytically (where the field reaches zero), so the outermost line is perfectly smooth.
  const outline: Pt[] = [];
  for (let k = 0; k <= 180; k++) {
    const t = (k / 180) * Math.PI * 2;
    const v = 0.97 * Math.sin(t);
    const narrow = 1 - 0.26 * Math.pow(Math.max(0, v), 1.5);
    const u = 0.8 * narrow * Math.cos(t);
    outline.push([150 + u * 150, 204 + v * 192]);
  }
  outline[outline.length - 1] = outline[0];
  const out: Contour[] = [{ d: smooth(outline), level: 0, major: true }];
  const lo = 0.07;
  const hi = max * 0.96;
  for (let l = 0; l < LEVELS; l++) {
    const level = lo + (hi - lo) * (l / (LEVELS - 1));
    const segments: [Pt, Pt][] = [];
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const a = grid[j * nx + i];
        const b = grid[j * nx + i + 1];
        const c = grid[(j + 1) * nx + i + 1];
        const d = grid[(j + 1) * nx + i];
        const index = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
        if (index === 0 || index === 15) continue;
        const x0 = i * STEP;
        const y0 = j * STEP;
        const top: Pt = [x0 + ((level - a) / (b - a)) * STEP, y0];
        const right: Pt = [x0 + STEP, y0 + ((level - b) / (c - b)) * STEP];
        const bottom: Pt = [x0 + ((level - d) / (c - d)) * STEP, y0 + STEP];
        const left: Pt = [x0, y0 + ((level - a) / (d - a)) * STEP];
        switch (index) {
          case 1:
          case 14:
            segments.push([left, bottom]);
            break;
          case 2:
          case 13:
            segments.push([bottom, right]);
            break;
          case 3:
          case 12:
            segments.push([left, right]);
            break;
          case 4:
          case 11:
            segments.push([top, right]);
            break;
          case 6:
          case 9:
            segments.push([top, bottom]);
            break;
          case 7:
          case 8:
            segments.push([left, top]);
            break;
          case 5:
            segments.push([left, top], [bottom, right]);
            break;
          case 10:
            segments.push([top, right], [left, bottom]);
            break;
        }
      }
    }
    for (const line of chain(segments)) {
      if (line.length > 3) out.push({ d: smooth(line), level: l + 1, major: (l + 1) % 4 === 0 });
    }
  }
  cache = out;
  return out;
}

/** Contours are built after mount: nothing heavy in the server HTML, no hydration drift from floating-point maths. */
export function useFaceContours() {
  const [contours, setContours] = useState<Contour[] | null>(null);
  useEffect(() => {
    setContours(faceContours());
  }, []);
  return contours;
}

export function TopoFace({
  className,
  strokeClass = "stroke-ink",
  weight = 1,
  opacity = 1,
  draw = true,
  delay = 0,
}: {
  className?: string;
  strokeClass?: string;
  /** Multiplies the stroke width, for small or large renders. */
  weight?: number;
  opacity?: number;
  /** Trace the lines in when scrolled into view. */
  draw?: boolean;
  delay?: number;
}) {
  const contours = useFaceContours();
  return (
    <svg viewBox={`0 0 ${FACE_W} ${FACE_H}`} className={className} fill="none" aria-hidden="true">
      {contours?.map((contour, index) => (
        <motion.path
          key={index}
          d={contour.d}
          className={strokeClass}
          strokeOpacity={(contour.major ? 0.85 : 0.42) * opacity}
          strokeWidth={(contour.major ? 1.25 : 0.75) * weight}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={draw ? { pathLength: 0, opacity: 0 } : false}
          whileInView={draw ? { pathLength: 1, opacity: 1 } : undefined}
          viewport={{ once: true }}
          transition={{ duration: 2.2, ease: EASE_OUT, delay: delay + contour.level * 0.07 }}
        />
      ))}
    </svg>
  );
}
