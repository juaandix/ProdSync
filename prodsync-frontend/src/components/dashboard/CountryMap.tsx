import React from "react";
import DynamicVectorMap from "./DynamicVectorMap";
import { esMill } from "@react-jvectormap/spain";

// Definir las propiedades del componente
interface CountryMapProps {
  mapColor?: string;
}

const CountryMap: React.FC<CountryMapProps> = ({ mapColor }) => {
  return (
    <DynamicVectorMap
      map={esMill}
      backgroundColor="transparent"
      markerStyle={{
        initial: {
          fill: mapColor || "#4F46E5",
        },
        hover: {
          fill: mapColor || "#4F46E5",
          fillOpacity: 0.8,
        },
      }}
      markersSelectable={true}
      markers={[]}
      regionStyle={{
        initial: {
          fill: "#d1d5db",
        },
        hover: {
          fillOpacity: 1,
          fill: mapColor || "#4F46E5",
        },
      }}
      regionLabelStyle={{
        initial: {
          fill: "#35373e",
          fontWeight: 500,
          fontSize: "13px",
          stroke: "none",
        },
        hover: {},
        selected: {},
        selectedHover: {},
      }}
    />
  );
};

export default CountryMap;
