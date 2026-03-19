# Flujo de trabajo repositorios

## RAMAS
**production**: cualquier commit que pongamos en esta rama debe estar preparado para subir a producción.
**develop**: rama en la que está el código que conformará la siguiente versión planificada del proyecto.
Cada vez que se incorpora código a production, tendremos una nueva versión de nuestra aplicación.
Adicionalmente a estas ramas principales, en el ciclo de vida del proyecto jugaremos con las siguientes ramas auxiliares y no otras:
*   **feature**: Desarrollos de nuevas funcionalidades y bugfixes planificados
*   **release**: Nueva versión de la app a ser publicada
*   **hotfix**: Corrección de errores detectados en production

## RAMA FEATURE
Desarrollo de nueva funcionalidad y corrección de fallos planificados
Las reglas para estas ramas son:
*   Normalmente, estas ramas existen únicamente en los repositorios locales de cada desarrollador aunque, si la funcionalidad se desarrolla entre varias personas, la rama puede existir en el repositorio remoto. También puede existir en el repositorio remoto como copia de seguridad si el desarrollo se prolonga por varios días.
*   Siempre se originan a partir de la rama `develop`
*   Se incorporan siempre a la rama `develop` y solo cuando se dan por terminadas (probadas y sin fallos).
*   Las nombraremos como `feature-<petición_id>[-descripción_corta]`, donde `petición_id` es el identificador de la petición del gestor de proyectos `pm.softcode.es`. Ejemplo: `feature-22-rental_date_change`

Los comandos para gestionar todo el ciclo son:
```bash
# Crear la rama a partir de develop
git checkout -b feature-<petición_id>[-descripción_corta] develop
```
```bash
# Compartir la rama (en caso necesario) - OPCIONAL
git checkout feature-<petición_id>[-descripción_corta]
git push origin feature-<petición_id>[-descripción_corta]
```
```bash
# Finalizar una rama Feature
git checkout develop
git pull origin develop
git merge --no-ff feature-<petición_id>[-descripción_corta]
git branch -d feature-<petición_id>[-descripción_corta]
git push origin develop
```
```bash
# Si se compartió la rama en el servidor
git push origin :feature-<petición_id>[-descripción_corta]
```
Es importante la opción `--no-ff` para que quede constancia en la rama `develop` de todos los commits que se hicieron en la rama `feature`.
También es importante recordar *eliminar la rama* una vez que ha sido incorporada a `develop`, tanto en local como en `origin`.

## RAMA RELEASE
Cuando ha llegado la hora de lanzar una nueva release, se crea una rama `release`.
El código de esta rama se debe desplegar en un entorno de test adecuado (STAGING), se prueba y cualquier problema se soluciona directamente en dicha rama. Este proceso de prueba > bugfix > prueba >... se repite hasta que el código sea lo suficientemente bueno como para lanzarlo a los clientes.
Cuando finaliza la versión, la rama `release` se fusiona con `production` y `develop`, para asegurarnos de que cualquier cambio realizado no se pierda accidentalmente por un nuevo desarrollo.

Las normas de estas ramas son:
*   Se originan a partir de la rama `develop`.
*   Se incorporan a `production` y `develop` una vez que el código está probado y listo para la siguiente versión.
*   Las nombraremos `release-x.y.z`
*   Se etiqueta la rama `production` con la nueva versión.

Los comandos para gestionar todo el ciclo son:
```bash
# Crear la rama a partir de develop
git checkout -b release-x.y.z develop
```
```bash
# Compartir la rama
git checkout release-x.y.z
git push origin release-x.y.z
```
```bash
# Finalizar una rama Release
git checkout production
git pull origin production
git merge --no-ff release-x.y.z
git tag -a x.y.z
git checkout develop
git pull origin develop
git merge --no-ff release-x.y.z
git branch -d release-x.y.z
git push origin develop
git checkout production
git push origin production
git push origin --tags
```
```bash
# Si se compartió la rama
git push origin :release-x.y.z
```
Es importante recordar eliminar la rama una vez que ha sido incorporada a `develop` y `production`, tanto en local como en `origin`.

## RAMA HOTFIX
Las ramas `hotfix` se utilizan para corregir fallos urgentes e imprevistos directamente del código de producción. Una vez corregido el código, los cambios son incorporados a las ramas `production` y `develop`:

Las normas para estas ramas son:
*   La creación de estas ramas no está planificada.
*   Se originan a partir de la rama `production`.
*   Se incorporan a las ramas `production` y `develop`.
*   Las nombraremos `hotfix-<peticion_id>[-descripcion]`, donde `peticion_id` es el identificador de la incidencia del gestor de proyectos que usemos.

Los comandos para gestionar todo el ciclo son:
```bash
# Crear la rama a partir de una versión de production
git checkout -b hotfix-x.y.z
```
```bash
# Finalizar una rama Hotfix
git checkout production
git pull origin production
git merge --no-ff hotfix-x.y.z
git tag -a x.y.z
git checkout develop
git pull origin develop
git merge --no-ff hotfix-x.y.z
git branch -d hotfix-x.y.z
git push origin develop
git checkout production
git push origin production
git push origin --tags
```
Es importante recordar eliminar la rama una vez que ha sido incorporada a `production` y `develop`, tanto en local como en `origin`.