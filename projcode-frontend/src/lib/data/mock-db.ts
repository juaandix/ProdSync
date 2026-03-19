import { Client, Project, Task, TimeEntry, User } from '@/types/models';

export const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Tech Solutions Inc.',
    identification: 'A12345678',
    contactPerson: 'John Doe',
    email: 'contact@techsolutions.com',
    location: 'Madrid',
    province: 'Madrid',
    avatar: '/images/user/user-01.png',
  },
  {
    id: '2',
    name: 'Innovatech',
    identification: 'B87654321',
    contactPerson: 'Jane Smith',
    email: 'info@innovatech.es',
    location: 'Barcelona',
    province: 'Barcelona',
    avatar: '/images/user/user-02.png',
  },
  {
    id: '3',
    name: 'Creative Minds',
    identification: 'C11223344',
    contactPerson: 'Peter Jones',
    email: 'creative@minds.com',
    location: 'Valencia',
    province: 'Valencia',
    avatar: '/images/user/user-03.png',
  },
  {
    id: '4',
    name: 'Data Systems',
    identification: 'D55667788',
    contactPerson: 'Maria Garcia',
    email: 'support@datasystems.net',
    location: 'Sevilla',
    province: 'Sevilla',
    avatar: '/images/user/user-04.png',
  },
  {
    id: '5',
    name: 'Future Forward',
    identification: 'E99887766',
    contactPerson: 'Sam Wilson',
    email: 'hello@futureforward.io',
    location: 'Bilbao',
    province: 'Biscay',
    avatar: '/images/user/user-05.png',
  },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj_1',
    name: 'E-commerce Platform Development',
    description: 'Building a new online store from scratch.',
    status: 'In Progress',
    startDate: '2024-01-15',
    endDate: '2024-09-30',
  },
  {
    id: 'proj_2',
    name: 'Mobile App for Task Management',
    description: 'A cross-platform app to help users organize their daily tasks.',
    status: 'Completed',
    startDate: '2023-09-01',
    endDate: '2024-03-01',
  },
  {
    id: 'proj_3',
    name: 'Cloud Migration Strategy',
    description: 'Planning and executing the migration of on-premise servers to AWS.',
    status: 'Not Started',
    startDate: '2024-08-01',
    endDate: '2024-12-20',
  },
  {
    id: 'proj_4',
    name: 'UI/UX Redesign for Dashboard',
    description: 'Improving the user experience of the main analytics dashboard.',
    status: 'In Progress',
    startDate: '2024-04-10',
    endDate: '2024-07-25',
  },
  {
    id: 'proj_5',
    name: 'Internal CRM System',
    description: 'Developing a customer relationship management tool for the sales team.',
    status: 'On Hold',
    startDate: '2024-02-01',
    endDate: '2024-10-01',
  },
];

export const MOCK_TASKS: Task[] = [
  {
    id: 'task_1',
    projectId: 'proj_1',
    descripcion: 'Create the initial database schema for the e-commerce platform, including tables for products, users, orders, etc.',
    estado: 'In Progress',
  },
  {
    id: 'task_2',
    projectId: 'proj_1',
    descripcion: 'Implement user registration, login, and session management.',
    estado: 'To Do',
  },
  {
    id: 'task_3',
    projectId: 'proj_2',
    descripcion: 'Create wireframes and high-fidelity mockups for the task management mobile application.',
    estado: 'Done',
  },
  {
    id: 'task_4',
    projectId: 'proj_2',
    descripcion: 'Develop the functionality to create new tasks within the mobile app.',
    estado: 'In Progress',
  },
  {
    id: 'task_5',
    projectId: 'proj_1',
    descripcion: 'Integrate with Stripe for credit card processing.',
    estado: 'To Do',
  },
  {
    id: 'task_6',
    projectId: 'proj_3',
    descripcion: 'Evaluate existing on-premise servers and applications for cloud compatibility.',
    estado: 'Not Started',
  },
];

export const MOCK_TIME_ENTRIES: TimeEntry[] = [
  {
    id: 'time_1',
    taskId: 'task_1',
    date: '2024-01-16',
    hours: 4,
    description: 'Initial schema draft and review.',
  },
  {
    id: 'time_2',
    taskId: 'task_1',
    date: '2024-01-17',
    hours: 3.5,
    description: 'Refined product and user tables based on feedback.',
  },
  {
    id: 'time_3',
    taskId: 'task_3',
    date: '2023-09-10',
    hours: 6,
    description: 'Completed initial wireframes for main screens.',
  },
  {
    id: 'time_4',
    taskId: 'task_4',
    date: '2024-03-05',
    hours: 5,
    description: 'Started implementing task form UI.',
  },
  {
    id: 'time_5',
    taskId: 'task_1',
    date: '2024-01-18',
    hours: 2,
    description: 'Added order and payment related tables.',
  },
];

export const MOCK_USERS: User[] = [
  { id: 'usr_001', name: 'Alicia Fernández', username: 'Alicia Fernández', email: 'alicia.fernandez@example.com', role: 'admin', status: 'active' },
  { id: 'usr_002', name: 'Roberto Gómez', username: 'Roberto Gómez', email: 'roberto.gomez@example.com', role: 'operator', status: 'active' },
  { id: 'usr_003', name: 'Carmen Ruiz', username: 'Carmen Ruiz', email: 'carmen.ruiz@example.com', role: 'operator', status: 'inactive' },
  { id: 'usr_004', name: 'David Morales', username: 'David Morales', email: 'david.morales@example.com', role: 'operator', status: 'active' },
  { id: 'usr_005', name: 'Elena Torres', username: 'Elena Torres', email: 'elena.torres@example.com', role: 'admin', status: 'active' },
  { id: 'usr_006', name: 'Fernando Díaz', username: 'Fernando Díaz', email: 'fernando.diaz@example.com', role: 'operator', status: 'inactive' },
  { id: 'usr_007', name: 'Gabriela Soler', username: 'Gabriela Soler', email: 'gabriela.soler@example.com', role: 'operator', status: 'active' },
  { id: 'usr_008', name: 'Héctor Vidal', username: 'Héctor Vidal', email: 'hector.vidal@example.com', role: 'operator', status: 'active' },
];
