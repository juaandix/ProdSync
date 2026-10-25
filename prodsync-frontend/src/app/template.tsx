// Se vuelve a montar en cada navegación: el contenido entra con un fundido corto
// mientras la barra superior (en el layout) permanece estable.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-enter">{children}</div>;
}
