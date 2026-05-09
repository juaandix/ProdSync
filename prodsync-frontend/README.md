# TailAdmin Next.js - Plantilla Gratuita de Panel de Administración con Next.js y Tailwind

TailAdmin es una plantilla de panel de administración gratuita y de código abierto construida con **Next.js y Tailwind CSS**, que proporciona a los desarrolladores todo lo que necesitan para crear una solución de back-end, panel de control o panel de administración rica en funciones y basada en datos para cualquier tipo de proyecto web.

![TailAdmin - Vista previa del panel de Next.js](./banner.png)

Con TailAdmin Next.js, obtienes acceso a todos los componentes de interfaz de usuario, elementos y páginas necesarios para construir un panel de control o panel de administración completo y de alta calidad. Ya sea que estés construyendo un panel para una aplicación web compleja o un sitio web simple.

TailAdmin utiliza las potentes características de **Next.js 15** y características comunes de Next.js como el renderizado del lado del servidor (SSR), la generación de sitios estáticos (SSG) y la integración perfecta de rutas de API. Combinado con los avances de **React 19** y la robustez de **TypeScript**, TailAdmin es la solución perfecta para ayudar a que tu proyecto se ponga en marcha rápidamente.

## Resumen

TailAdmin proporciona componentes de interfaz de usuario y diseños esenciales para construir paneles de administración y paneles de control ricos en funciones y basados en datos. Está construido sobre:

- Next.js 15.x
- React 19
- TypeScript
- Tailwind CSS V4

### Enlaces Rápidos
- [✨ Visitar Sitio Web](https://tailadmin.com)
- [📄 Documentación](https://tailadmin.com/docs)
- [⬇️ Descargar](https://tailadmin.com/download)
- [🖌️ Archivo de Diseño de Figma (Edición Comunitaria)](https://www.figma.com/community/file/1463141366275764364)
- [⚡ Obtener Versión PRO](https://tailadmin.com/pricing)

### Demostraciones
- [Versión Gratuita](https://nextjs-free-demo.tailadmin.com)
- [Versión Pro](https://nextjs-demo.tailadmin.com)

### Otras Versiones
- [Versión HTML](https://github.com/TailAdmin/tailadmin-free-tailwind-dashboard-template)
- [Versión React](https://github.com/TailAdmin/free-react-tailwind-admin-dashboard)
- [Versión Vue.js](https://github.com/TailAdmin/vue-tailwind-admin-dashboard)

## Instalación

### Prerrequisitos
Para empezar con TailAdmin, asegúrate de tener instalados y configurados los siguientes prerrequisitos:

- Node.js 18.x o posterior (se recomienda usar Node.js 20.x o posterior)

### Clonar el Repositorio
Clona el repositorio usando el siguiente comando:

```bash
git clone https://github.com/TailAdmin/free-nextjs-admin-dashboard.git
```

> Usuarios de Windows: coloquen el repositorio cerca de la raíz de su unidad si tienen problemas al clonar.

1. Instalar dependencias:
    ```bash
    npm install
    # o
    yarn install
    ```
    > Usa la bandera `--legacy-peer-deps` si tienes errores de dependencias pares durante la instalación.

2. Iniciar el servidor de desarrollo:
    ```bash
    npm run dev
    # o
    yarn dev
    ```

## Componentes

TailAdmin es un punto de partida prediseñado para construir un panel de control basado en la web usando Next.js y Tailwind CSS. La plantilla incluye:

- Una barra lateral sofisticada y accesible
- Componentes de visualización de datos
- Gestión de perfiles y página 404 personalizada
- Tablas y Gráficos (Línea y Barra)
- Formularios de autenticación y elementos de entrada
- Alertas, Desplegables, Modales, Botones y más
- No podemos olvidar el Modo Oscuro 🕶️

Todos los componentes están construidos con React y estilizados con Tailwind CSS para una fácil personalización.

## Comparación de Características

### Versión Gratuita
- 1 Panel de Control Único
- 30+ componentes de panel de control
- 50+ elementos de interfaz de usuario
- Archivos de diseño básicos de Figma
- Soporte comunitario

### Versión Pro
- 5 Paneles de Control Únicos: Analítica, Ecommerce, Marketing, CRM, Acciones (más próximamente)
- 400+ componentes de panel de control y elementos de interfaz de usuario
- Archivo de diseño completo de Figma
- Soporte por correo electrónico

Para obtener más información sobre las características y precios de la versión pro, visita nuestra [página de precios](https://tailadmin.com/pricing).

## Changelog

### Versión 2.0.2 - [25 de marzo de 2025]

- Actualizado a Next v15.2.3 por preocupaciones de [CVE-2025-29927](https://nextjs.org/blog/cve-2025-29927)
- Se incluyeron `overrides` para `jsvectormap` para evitar errores de dependencias pares durante la instalación.
- Migrado de `react-flatpickr` al paquete `flatpickr` para compatibilidad con React 19

### Versión 2.0.1 - [27 de febrero de 2025]

#### Resumen de la Actualización

- Actualizado a Tailwind CSS v4 para un mejor rendimiento y eficiencia.
- Se actualizó el uso de clases para que coincida con la última sintaxis y características.
- Se reemplazaron clases en desuso y se optimizaron los estilos.

#### Próximos Pasos

- Ejecuta `npm install` o `yarn install` para actualizar las dependencias.
- Verifica si hay cambios de estilo o problemas de compatibilidad.
- Consulta la [Guía de Migración](https://tailwindcss.com/docs/upgrade-guide) de Tailwind CSS v4 sobre esta versión si es necesario.
- Esta actualización mantiene el proyecto actualizado con las últimas mejoras de Tailwind. 🚀

### v2.0.0 (Febrero de 2025)
Una actualización importante centrada en la implementación de Next.js 15 y un rediseño completo.

#### Mejoras Importantes
- Rediseño completo utilizando el App Router de Next.js 15 y React Server Components
- Interfaz de usuario mejorada con componentes optimizados para Next.js
- Capacidad de respuesta y accesibilidad mejoradas
- Nuevas características que incluyen barra lateral plegable, pantallas de chat y calendario
- Autenticación rediseñada utilizando el App Router de Next.js y acciones del servidor
- Visualización de datos actualizada utilizando ApexCharts para React

#### Cambios Rompedores

- Migrado de Next.js 14 a Next.js 15
- Los componentes de gráficos ahora usan ApexCharts para React
- El flujo de autenticación se actualizó para usar Server Actions y middleware

[Leer más](https://tailadmin.com/docs/update-logs/nextjs) sobre esta versión.

#### Cambios Rompedores
- Migrado de Next.js 14 a Next.js 15
- Los componentes de gráficos ahora usan ApexCharts para React
- El flujo de autenticación se actualizó para usar Server Actions y middleware

### v1.3.4 (01 de julio de 2024)
- Se corrigieron problemas de renderizado de JSvectormap

### v1.3.3 (20 de junio de 2024)
- Se corrigió el error de compilación relacionado con el componente Loader

### v1.3.2 (19 de junio de 2024)
- Se agregó el componente ClickOutside para los menús desplegables
- Se refactorizaron los componentes de la barra lateral
- Se actualizó el paquete Jsvectormap

### v1.3.1 (12 de febrero de 2024)
- Se corrigió la consistencia en los nombres de los diseños
- Se actualizaron los estilos

### v1.3.0 (05 de febrero de 2024)
- Actualizado a Next.js 14
- Se agregó la integración de Flatpickr
- Se mejoraron los elementos de formulario
- Se mejoró la funcionalidad de multiselección
- Se agregó un componente de diseño predeterminado

## Licencia

La versión gratuita de TailAdmin Next.js se publica bajo la Licencia MIT.

## Soporte

Si encuentras útil este proyecto, por favor considera darle una estrella en GitHub. Tu apoyo nos ayuda a continuar desarrollando y manteniendo esta plantilla.