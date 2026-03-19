"use client";
/**
 * useModal
 *
 * Hook genérico para gestionar el estado abierto/cerrado de un modal.
 * Centraliza la lógica repetitiva de open/close/toggle en un solo lugar.
 *
 * @param initialState - Estado inicial del modal (false = cerrado por defecto).
 *
 * Retorna:
 *  - isOpen      → estado actual del modal
 *  - openModal   → función para abrir el modal
 *  - closeModal  → función para cerrar el modal
 *  - toggleModal → función para alternar el estado
 *
 * Los callbacks están memoizados con useCallback para evitar re-renders
 * innecesarios en los componentes hijos que los reciben como props.
 */
import { useState, useCallback } from "react";

export const useModal = (initialState: boolean = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  const toggleModal = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, openModal, closeModal, toggleModal };
};
