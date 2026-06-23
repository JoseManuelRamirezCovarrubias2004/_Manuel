// src/pages/Inventario/useECharts.js
import { useEffect, useRef } from "react";
import * as echarts from "echarts";

/**
 * Hook genérico para montar una instancia de ECharts en un <div>.
 * Se encarga de inicializar, actualizar con setOption cuando cambia `option`,
 * resize en cambios de tamaño de ventana, y dispose al desmontar.
 */
export function useECharts(option, { loading = false } = {}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current);
    }

    const handleResize = () => chartRef.current?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

    if (loading) {
      chartRef.current.showLoading("default", {
        text: "Cargando...",
        color: "#131E5C",
        textColor: "#475569",
        maskColor: "rgba(255, 255, 255, 0.8)",
      });
    } else {
      chartRef.current.hideLoading();
      if (option) {
        chartRef.current.setOption(option, true);
      }
    }
  }, [option, loading]);

  useEffect(() => {
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  return containerRef;
}