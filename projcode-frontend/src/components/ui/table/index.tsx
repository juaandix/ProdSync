import React, { ReactNode } from "react";

// Props para la Tabla
interface TableProps {
  children: ReactNode; // Contenido de la tabla (thead, tbody, etc.)
  className?: string; // className opcional para estilizar
}

// Props para el encabezado de la tabla
interface TableHeaderProps {
  children: ReactNode; // Fila(s) de encabezado
  className?: string; // className opcional para estilizar
}

// Props para el cuerpo de la tabla
interface TableBodyProps {
  children: ReactNode; // Fila(s) del cuerpo
  className?: string; // className opcional para estilizar
}

// Props para la fila de la tabla
interface TableRowProps {
  children: ReactNode; // Celdas (th o td)
  className?: string; // className opcional para estilizar
}

// Props para la celda de la tabla
interface TableCellProps {
  children: ReactNode; // Contenido de la celda
  isHeader?: boolean; // Si es verdadero, se renderiza como <th>, de lo contrario <td>
  className?: string; // className opcional para estilizar
}

// Componente de tabla
const Table: React.FC<TableProps> = ({ children, className }) => {
  return <table className={`min-w-full  ${className}`}>{children}</table>;
};

// Componente de encabezado de tabla
const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return <thead className={className}>{children}</thead>;
};

// Componente de cuerpo de tabla
const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return <tbody className={className}>{children}</tbody>;
};

// Componente de fila de tabla
const TableRow: React.FC<TableRowProps> = ({ children, className }) => {
  return <tr className={className}>{children}</tr>;
};

// Componente de celda de tabla
const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className,
}) => {
  const CellTag = isHeader ? "th" : "td";
  return <CellTag className={` ${className}`}>{children}</CellTag>;
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
