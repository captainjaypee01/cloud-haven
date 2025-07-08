// src/components/common/SeaWaveBg.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * SeaWaveBg: Animated SVG always pinned at the true bottom, not just the visible window, even on scroll.
 * Use in any page, just place as the very last child inside your page wrapper.
 */
const SeaWaveBg = () => {
    const [tick, setTick] = useState(0);
    const animRef = useRef();

    useEffect(() => {
        let running = true;
        const animate = () => {
            setTick(t => t + 0.018);
            if (running) animRef.current = requestAnimationFrame(animate);
        };
        animate();
        return () => { running = false; cancelAnimationFrame(animRef.current); };
    }, []);

    // Responsive width (for hydration: SSR-safe)
    const [screenW, setScreenW] = useState(typeof window !== "undefined" ? window.innerWidth : 800);
    useEffect(() => {
        const update = () => setScreenW(window.innerWidth);
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);
    const width = Math.max(400, Math.min(1600, screenW));
    const height = 200;  // TALLER for mobile
    const baseY = 115;
    const amplitude = 38;
    const frequency = 2 * Math.PI / width * 1.15;
    const speed = tick * 2.1;

    // Main wave
    const points = [];
    for (let x = 0; x <= width; x += 18) {
        const y = baseY + Math.sin(frequency * x + speed) * amplitude;
        points.push({ x, y });
    }
    let d = `M0 ${height} L`;
    d += points.map(pt => `${pt.x} ${pt.y.toFixed(1)}`).join(" ");
    d += ` L${width} ${height} Z`;

    // Second layer
    const points2 = [];
    for (let x = 0; x <= width; x += 18) {
        const y = baseY + 22 + Math.cos(frequency * x + speed * 1.4) * (amplitude - 9);
        points2.push({ x, y });
    }
    let d2 = `M0 ${height} L`;
    d2 += points2.map(pt => `${pt.x} ${pt.y.toFixed(1)}`).join(" ");
    d2 += ` L${width} ${height} Z`;

    return (
        <div
            style={{
                position: "absolute",
                left: 0,
                width: "100%",
                height: `${height}px`,
                bottom: 0,
                pointerEvents: "none",
                zIndex: 0,
            }}
        >
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block">
                <path d={d2} fill="#0ea5e9" opacity="0.22" />
                <path d={d} fill="#06b6d4" opacity="0.35" />
            </svg>
        </div>
    );
};
export default SeaWaveBg;
