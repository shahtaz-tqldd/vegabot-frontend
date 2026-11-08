import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

import { apiSlice } from "./features/api/apiSlice";
import authReducer from "./features/auth/authSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
  },
  devTools: import.meta.env.VITE_ENV !== "PRODUCTION",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([apiSlice.middleware]),
});

setupListeners(store.dispatch);
