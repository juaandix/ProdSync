// Opcional: configurar o establecer un framework de pruebas antes de cada prueba.
// Si eliminas este archivo, elimina `setupFilesAfterEnv` de `jest.config.js`

// Usado para __tests__/testing-library.js
// Aprende más: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Habilitar simulaciones de fetch
require('jest-fetch-mock').enableMocks();

// Polyfill de TextDecoder para el entorno de Jest
const { TextDecoder } = require('util');
global.TextDecoder = TextDecoder;