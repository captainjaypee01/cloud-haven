import React, { useEffect, useRef, useState } from "react";

/**
 * Ocean wave loader: The wave moves from left to right, and each point moves up/down with a phase shift.
 */
const Loader = ({ variant = "wave", container }) => {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let running = true;
        const animate = () => {
            setTick(t => t + 0.03);
            if (running) requestAnimationFrame(animate);
        };
        animate();
        return () => { running = false; };
    }, []);

    if (variant !== "wave") return null;

    // Parameters for the wave
    const width = 220;
    const height = 48;
    const baseY = 32;
    const amplitude = 7;
    const frequency = 2 * Math.PI / width * 1.3;
    const speed = tick * 2.2; // how fast wave moves left/right

    // Make wave points
    const points = [];
    for (let x = 0; x <= width; x += 8) {
        const y = baseY + Math.sin(frequency * x + speed) * amplitude;
        points.push({ x, y });
    }
    // Build SVG path
    let d = `M0 ${height} L`;
    d += points.map(pt => `${pt.x} ${pt.y.toFixed(1)}`).join(" ");
    d += ` L${width} ${height} Z`;

    // Add a second layer for depth
    const points2 = [];
    for (let x = 0; x <= width; x += 8) {
        const y = baseY + 6 + Math.cos(frequency * x + speed * 1.4) * (amplitude - 2);
        points2.push({ x, y });
    }
    let d2 = `M0 ${height} L`;
    d2 += points2.map(pt => `${pt.x} ${pt.y.toFixed(1)}`).join(" ");
    d2 += ` L${width} ${height} Z`;
    const classes = container === "dialog"
        ? "absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm bg-cyan-100/60"
        : "fixed inset-0 z-[1000] flex flex-col items-center justify-center backdrop-blur-sm bg-cyan-100/60";
    return (
        <div className={classes}>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="mb-2">
                <path d={d2} fill="#0ea5e9" opacity="0.7" />
                <path d={d} fill="#06b6d4" opacity="0.9" />
            </svg>
            <div className="text-cyan-900 text-lg font-bold tracking-wide drop-shadow">Just a moment... Catching a wave!</div>
        </div>
    )
};

export default Loader;
