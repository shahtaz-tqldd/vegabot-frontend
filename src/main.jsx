import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { ThemeProvider } from "next-themes";
import { store } from "./store.js";

import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="argon-theme"
    >
      <Provider store={store}>
        <App />
      </Provider>
    </ThemeProvider>
  </StrictMode>
);
