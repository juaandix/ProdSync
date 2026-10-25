import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear cuenta · ProdSync",
  description: "Crea tu cuenta de ProdSync",
  // otros metadatos
};

export default function SignUp() {
  return <SignUpForm />;
}
