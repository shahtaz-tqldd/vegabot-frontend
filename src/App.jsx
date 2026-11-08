import { RouterProvider } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { routes } from "./routes";

// styles
import "@/assets/styles/index.css";
import "@/assets/styles/layout.css";
import "@/assets/styles/animation.css";

function App() {
  return (
    <>
      <RouterProvider router={routes} />
      <Toaster richColors position="top-right" />
    </>
  );
}

export default App;
