import { useAtom } from "jotai";
import { isAuthenticatedAtom } from "@/store/auth";
import { LoginForm } from "@/components/LoginForm";
import { Dashboard } from "@/components/Dashboard";

export function App() {
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      {isAuthenticated ? <Dashboard /> : <LoginForm />}
    </div>
  );
}
