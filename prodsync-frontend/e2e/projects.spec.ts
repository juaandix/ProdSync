import { test, expect } from '@playwright/test';
import { ProjectsPage } from './pages/ProjectsPage';
import { CreateProjectPage } from './pages/CreateProjectPage';
import { EditProjectPage } from './pages/EditProjectPage';
import * as fs from 'fs'; // Importar fs para leer el archivo

const runId = new Date().getTime();
const mockClientId = '999';
const mockProjectId = 'proj-123';

const mockClientBackend = {
    id: mockClientId,
    nombre: 'Mocked Client for Project Test',
};

const newProjectBackend = {
    id: mockProjectId,
    nombre: `Test Project ${runId}`,
    descripcion: 'This is a test project description.',
    fechaInicio: '2024-01-01',
    fechaFin: '2024-12-31',
    estado: 'Activo',
    cliente: mockClientBackend,
};

const updatedProjectBackend = {
    ...newProjectBackend,
    nombre: `Updated Project ${runId}`,
    estado: 'Completado',
};

test.describe('Project CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Cargar el token de autenticación del archivo
    const token = fs.readFileSync('e2e/token.txt', 'utf-8');
    // Inyectar el token como una cookie 'authToken'
    await page.context().addCookies([
      {
        name: 'authToken',
        value: token,
        url: 'http://localhost:3000',
      },
    ]);
    // Navegar a la página de proyectos después de la inyección del token
    await page.goto('/projects');
    await expect(page).toHaveURL(/.*\/projects/);
    await expect(page.locator('aside')).toBeVisible();
  });

    test('should create, edit, and delete a project', async ({ page }) => {
        const projectsPage = new ProjectsPage(page);
        const createProjectPage = new CreateProjectPage(page);
        const editProjectPage = new EditProjectPage(page);

        // Mock para clientes
        await page.route('**/api/clientes', route => route.fulfill({ json: [mockClientBackend] }));

        // 1. Carga inicial (lista vacía)
        await page.route('**/api/proyectos', route => route.fulfill({ json: [] }), { times: 1 });
        await projectsPage.goto();
        await projectsPage.expectToBeOnPage(0); // Espera 0 filas inicialmente

        // 2. Crear
        await page.route('**/api/proyectos', route => route.fulfill({ status: 201, json: newProjectBackend }));
        await projectsPage.clickCreateProject();
    await page.waitForURL('**/projects/create');
        await createProjectPage.expectToBeOnPage();
        await createProjectPage.fillForm({ name: newProjectBackend.nombre, description: newProjectBackend.descripcion, startDate: newProjectBackend.fechaInicio, endDate: newProjectBackend.fechaFin, status: newProjectBackend.estado, clientId: mockClientId });

        // Re-mock GET para después de la creación
        await page.unroute('**/api/proyectos');
        await page.route('**/api/proyectos', route => route.fulfill({ json: [newProjectBackend] }));
        await createProjectPage.submitForm();

        // 3. Verificar Creación
        await expect(page).toHaveURL(/.*\/projects/); // Redirige a la lista de proyectos
        await projectsPage.expectToBeOnPage(1); // Espera 1 fila después de la creación
        await projectsPage.expectProjectToBeVisible(newProjectBackend.nombre);

        // 4. Editar: Navegar a la página de edición del proyecto creado
        await page.route(`**/api/proyectos/${mockProjectId}`, route => route.fulfill({ json: updatedProjectBackend }));
        await projectsPage.editProject(newProjectBackend.nombre); // Esto ya navega a la URL de edición
        await editProjectPage.expectToBeOnPage(mockProjectId);
        await editProjectPage.updateForm({ name: updatedProjectBackend.nombre, status: updatedProjectBackend.estado });

        // Re-mock GET para después de la edición
        await page.unroute('**/api/proyectos');
        await page.route('**/api/proyectos', route => route.fulfill({ json: [updatedProjectBackend] }));
        await editProjectPage.submitForm();
        
        // 5. Verificar Edición
        await expect(page).toHaveURL(/.*\/projects/);
        await projectsPage.expectProjectToBeVisible(updatedProjectBackend.nombre);
        await projectsPage.expectProjectToNotExist(newProjectBackend.nombre);

        // 6. Eliminar
        await page.route(`**/api/proyectos/${mockProjectId}`, route => route.fulfill({ status: 204 }));
        
        // Re-mock GET para después de la eliminación
        await page.unroute('**/api/proyectos');
        await page.route('**/api/proyectos', route => route.fulfill({ json: [] }));
        // 6. Eliminar
        await page.route(`**/api/proyectos/${mockProjectId}`, route => route.fulfill({ status: 204 }));
        
        // Re-mock GET para después de la eliminación
        await page.unroute('**/api/proyectos');
        await page.route('**/api/proyectos', route => route.fulfill({ json: [] }));
    await projectsPage.deleteProject(updatedProjectBackend.nombre); // Usar el nombre actualizado para eliminar
    await page.screenshot({ path: 'debug-projects-delete-dialog.png' });
    await projectsPage.confirmDeletion();
    
    // 6. Verificar Eliminación
    await page.waitForLoadState('networkidle');
    await projectsPage.expectProjectToNotExist(updatedProjectBackend.nombre);
    });
});