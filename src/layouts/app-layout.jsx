import { Outlet } from "react-router-dom";
import Header from "@/components/layouts/header";

const AppLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30 dark:bg-background">
      <Header />
      <main className="container flex-1 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
