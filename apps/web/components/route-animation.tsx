"use client";

import { useEffect, useState } from "react";

const route =
  "M 78 176 C 150 176 176 108 258 104 C 340 100 372 148 520 132";

export function RouteAnimation() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-stone-100 dark:border-stone-700 dark:bg-stone-800">
      <svg
        viewBox="0 0 600 300"
        className="h-auto w-full"
        role="img"
        aria-label="A plane following a route between three stops"
      >
        <circle
          cx="500"
          cy="58"
          r="26"
          className="fill-stone-300 dark:fill-stone-500"
        />
        <g className="animate-cloud motion-reduce:animate-none fill-stone-200 dark:fill-stone-600">
          <ellipse cx="130" cy="64" rx="38" ry="14" />
          <ellipse cx="158" cy="58" rx="22" ry="12" />
        </g>
        <g className="animate-cloud motion-reduce:animate-none fill-stone-200/80 dark:fill-stone-600/80">
          <ellipse cx="390" cy="46" rx="34" ry="12" />
          <ellipse cx="412" cy="40" rx="18" ry="10" />
        </g>

        <path
          d="M 0 210 C 90 188 150 236 250 214 C 360 190 410 236 600 206 L 600 300 L 0 300 Z"
          className="fill-stone-300 dark:fill-stone-600"
        />
        <path
          d="M 0 252 C 130 230 210 270 330 250 C 450 230 510 268 600 244 L 600 300 L 0 300 Z"
          className="fill-stone-400 dark:fill-stone-500"
        />

        <path
          d={route}
          fill="none"
          strokeWidth="2"
          className="stroke-stone-500/40 dark:stroke-stone-300/40"
        />
        <path
          id="trip-route"
          d={route}
          fill="none"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeDasharray="5 8"
          className="animate-route-dash stroke-stone-700 motion-reduce:animate-none dark:stroke-stone-100"
        />

        <Pin x={78} y={176} label="Home" />
        <Pin x={258} y={104} label="Coast" />
        <Pin x={520} y={132} label="City" />

        <g transform={reduceMotion ? "translate(258 104)" : undefined}>
          {reduceMotion ? null : (
            <animateMotion
              dur="16s"
              repeatCount="indefinite"
              rotate="auto"
              calcMode="spline"
              keyPoints="0;1;0"
              keyTimes="0;0.5;1"
              keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
            >
              <mpath href="#trip-route" />
            </animateMotion>
          )}
          <path
            d="M 16 0 L -12 7 L -5 0 L -12 -7 Z"
            className="fill-stone-900 dark:fill-stone-50"
          />
        </g>
      </svg>
    </div>
  );
}

function Pin({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="5" className="fill-stone-800 dark:fill-stone-100" />
      <circle r="1.8" className="fill-stone-100 dark:fill-stone-800" />
      <text
        y="-16"
        textAnchor="middle"
        fontSize="13"
        fontFamily="var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
        className="fill-stone-800 dark:fill-stone-100"
      >
        {label}
      </text>
    </g>
  );
}
