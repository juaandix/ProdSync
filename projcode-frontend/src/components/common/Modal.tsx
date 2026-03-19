"use client";
import React from 'react';

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
      <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none max-h-screen">
        <div className="relative w-full max-w-full mx-auto my-6">
          {/*content*/}
          <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none dark:bg-gray-800">
            {/*header*/}
            <div className="flex items-start justify-between p-5 border-b border-solid border-gray-300 rounded-t dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              <button
                className="p-1 ml-auto bg-transparent border-0 text-gray-900 float-right text-3xl leading-none font-semibold outline-none focus:outline-none dark:text-white"
                onClick={onClose}
              >
                <span className="bg-transparent text-gray-900 h-6 w-6 text-2xl block outline-none focus:outline-none dark:text-white">
                  ×
                </span>
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
