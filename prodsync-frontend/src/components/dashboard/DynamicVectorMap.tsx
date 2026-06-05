import dynamic from "next/dynamic";

const DynamicVectorMap = dynamic(
    () => import("@react-jvectormap/core").then((mod) => mod.VectorMap),
  { ssr: false }
);

export default DynamicVectorMap;
