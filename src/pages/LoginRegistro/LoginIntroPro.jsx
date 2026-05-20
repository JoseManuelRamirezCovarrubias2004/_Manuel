import { useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import Particles from "@tsparticles/react";
import { loadFull } from "tsparticles";

const BRAND_BLUE = "#131E5C";

/**
 * Intro PRO:
 * - Canvas particles (HUD feel)
 * - Glitch sutil y scan sweep
 * - Sale con fade + blur
 */
export default function LoginIntroPro({ onFinish, logoSrc }) {
    const particlesInit = useCallback(async (engine) => {
        await loadFull(engine);
    }, []);

    // Duración total de intro (ms)
    useEffect(() => {
        const t = setTimeout(() => onFinish?.(), 2100);
        return () => clearTimeout(t);
    }, [onFinish]);

    return (
        <motion.div
            className="absolute inset-0 z-[60] overflow-hidden"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.45 }}
        >
            {/* Base */}
            <div className="absolute inset-0 bg-[#050714]" />

            {/* Partículas HUD */}
            <Particles
                id="tsparticles"
                init={particlesInit}
                options={{
                    fullScreen: { enable: false },
                    background: { color: { value: "transparent" } },
                    fpsLimit: 60,
                    detectRetina: true,
                    particles: {
                        number: { value: 55, density: { enable: true, area: 900 } },
                        color: { value: ["#ffffff", "#7aa7ff", BRAND_BLUE] },
                        opacity: { value: 0.22, random: true },
                        size: { value: { min: 1, max: 2 } },
                        move: { enable: true, speed: 0.6, direction: "none", outModes: "out" },
                        links: {
                            enable: true,
                            distance: 140,
                            color: "#7aa7ff",
                            opacity: 0.18,
                            width: 1,
                        },
                    },
                    interactivity: {
                        events: { onHover: { enable: true, mode: "repulse" } },
                        modes: { repulse: { distance: 120, duration: 0.3 } },
                    },
                }}
                className="absolute inset-0"
            />

            {/* Scanlines ultra sutil */}
            <div
                className="absolute inset-0 opacity-[0.06] pointer-events-none"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(to bottom, rgba(255,255,255,1) 0px, rgba(255,255,255,1) 1px, transparent 2px, transparent 7px)",
                }}
            />

            {/* Glow central */}
            <div
                className="absolute left-1/2 top-1/2 h-[680px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-40 pointer-events-none"
                style={{
                    background: `radial-gradient(circle, ${BRAND_BLUE} 0%, rgba(59,130,246,0.15) 35%, transparent 65%)`,
                }}
            />

            {/* Contenido */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative flex flex-col items-center">
                    {/* “Scanner sweep” */}
                    <motion.div
                        className="absolute left-1/2 top-0 h-[2px] w-[460px] -translate-x-1/2 rounded-full opacity-70"
                        style={{
                            background:
                                "linear-gradient(90deg, transparent, rgba(122,167,255,0.9), transparent)",
                            filter: "blur(0.2px)",
                        }}
                        initial={{ y: -60, opacity: 0 }}
                        animate={{ y: 140, opacity: 1 }}
                        transition={{ duration: 1.15, ease: "easeInOut" }}
                    />

                    {/* Logo reveal + glitch controlado */}
                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, scale: 0.96, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        {/* Glow detrás del logo */}
                        <div
                            className="absolute inset-0 -z-10 rounded-full blur-2xl opacity-55"
                            style={{
                                background: `radial-gradient(circle, rgba(122,167,255,0.45), transparent 60%)`,
                            }}
                        />

                        {/* Logo */}
                        <motion.img
                            src={logoSrc}
                            alt="Logo"
                            className="h-24 w-24 select-none drop-shadow-[0_0_18px_rgba(122,167,255,0.35)]"
                            // “micro-glitch”: dos movimientos rápidos con tiny blur
                            animate={{
                                x: [0, -2, 2, -1, 0],
                                filter: ["blur(0px)", "blur(0.8px)", "blur(0px)"],
                            }}
                            transition={{ duration: 0.38, delay: 0.45 }}
                            draggable={false}
                        />

                        {/* RGB split sutil (capas) */}
                        <motion.img
                            src={logoSrc}
                            alt=""
                            className="pointer-events-none absolute inset-0 h-24 w-24 opacity-[0.18]"
                            style={{ transform: "translateX(-2px)", filter: "hue-rotate(220deg)" }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.16, 0] }}
                            transition={{ duration: 0.45, delay: 0.55 }}
                            draggable={false}
                        />
                        <motion.img
                            src={logoSrc}
                            alt=""
                            className="pointer-events-none absolute inset-0 h-24 w-24 opacity-[0.16]"
                            style={{ transform: "translateX(2px)", filter: "hue-rotate(20deg)" }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.14, 0] }}
                            transition={{ duration: 0.45, delay: 0.55 }}
                            draggable={false}
                        />
                    </motion.div>

                    {/* Texto tipo HUD */}
                    <motion.div
                        className="mt-5 text-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, duration: 0.55 }}
                    >
                        <div className="text-[11px] tracking-[0.5em] text-white/70">
                            SECURE ACCESS
                        </div>
                        <div className="mt-2 text-white font-extrabold text-2xl">
                            Gestión R&amp;R
                        </div>
                        <div className="mt-2 text-xs text-white/55">
                            Verificando sesión • Sincronizando módulos
                        </div>
                    </motion.div>

                    {/* Progreso minimal */}
                    <motion.div
                        className="mt-6 h-[3px] w-[340px] overflow-hidden rounded-full bg-white/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35 }}
                    >
                        <motion.div
                            className="h-full rounded-full"
                            style={{
                                background:
                                    "linear-gradient(90deg, rgba(122,167,255,0.2), rgba(19,30,92,1), rgba(122,167,255,0.55))",
                            }}
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1.6, ease: "easeInOut", delay: 0.35 }}
                        />
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}