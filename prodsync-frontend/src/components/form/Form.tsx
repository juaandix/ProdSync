import React, { FC, ReactNode, FormEvent } from "react";

interface FormProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  className?: string;
}

const Form: FC<FormProps> = ({ onSubmit, children, className }) => {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault(); // Prevenir el envío predeterminado del formulario
        onSubmit(event);
      }}
      className={` ${className}`} // Espaciado predeterminado entre los campos del formulario
    >
      {children}
    </form>
  );
};

export default Form;
