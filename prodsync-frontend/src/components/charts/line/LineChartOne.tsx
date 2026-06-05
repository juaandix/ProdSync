"use client";
import React from "react";

import { ApexOptions } from "apexcharts";

import dynamic from "next/dynamic";
// Importar dinámicamente el componente ReactApexChart
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function LineChartOne() {
  const options: ApexOptions = {
    legend: {
      show: false, // Ocultar leyenda
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF", "#9CB9FF"], // Definir colores de línea
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line", // Establecer el tipo de gráfico en 'línea'
      toolbar: {
        show: false, // Ocultar barra de herramientas del gráfico
      },
    },
    stroke: {
      curve: "straight", // Definir el estilo de línea (recta, suave o escalonada)
      width: [2, 2], // Ancho de línea para cada conjunto de datos
    },

    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0, // Tamaño de los puntos del marcador
      strokeColors: "#fff", // Color del borde del marcador
      strokeWidth: 2,
      hover: {
        size: 6, // Tamaño del marcador al pasar el ratón
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false, // Ocultar líneas de cuadrícula en el eje x
        },
      },
      yaxis: {
        lines: {
          show: true, // Mostrar líneas de cuadrícula en el eje y
        },
      },
    },
    dataLabels: {
      enabled: false, // Deshabilitar etiquetas de datos
    },
    tooltip: {
      enabled: true, // Habilitar información sobre herramientas
      x: {
        format: "dd MMM yyyy", // Formato para la información sobre herramientas del eje x
      },
    },
    xaxis: {
      type: "category", // Eje x basado en categorías
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      axisBorder: {
        show: false, // Ocultar borde del eje x
      },
      axisTicks: {
        show: false, // Ocultar marcas del eje x
      },
      tooltip: {
        enabled: false, // Deshabilitar información sobre herramientas para los puntos del eje x
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px", // Ajustar tamaño de fuente para las etiquetas del eje y
          colors: ["#6B7280"], // Color de las etiquetas
        },
      },
      title: {
        text: "", // Eliminar título del eje y
        style: {
          fontSize: "0px",
        },
      },
    },
  };

  const series = [
    {
      name: "Sales",
      data: [180, 190, 170, 160, 175, 165, 170, 205, 230, 210, 240, 235],
    },
    {
      name: "Revenue",
      data: [40, 30, 50, 40, 55, 40, 70, 100, 110, 120, 150, 140],
    },
  ];
  return (
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <div id="chartEight" className="min-w-[1000px]">
        <ReactApexChart
          options={options}
          series={series}
          type="area"
          height={310}
        />
      </div>
    </div>
  );
}
