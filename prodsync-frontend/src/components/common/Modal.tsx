"use client";
import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade" onClick={onClose}></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none max-h-screen">
        <div className="relative w-full max-w-full mx-auto my-6 animate-dialog">
          {/*content*/}
          <div className="relative flex flex-col w-full rounded-2xl border border-white/[0.08] bg-[#24242d] shadow-2xl outline-none focus:outline-none">
            {/*header*/}
            <div className="flex items-start justify-between p-5 border-b border-white/[0.06] rounded-t">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              <button
                className="press ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-white/[0.06] hover:text-white"
                onClick={onClose}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            {/*body*/}
            <div className="relative p-6 flex-auto">
              {children}
            </div>
            {/*footer - can be added if needed */}
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
