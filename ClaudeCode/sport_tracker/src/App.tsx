// src/App.tsx
// Thin wrapper that renders the RouterProvider with the application router.
// Kept minimal — routing is defined in main.tsx.

import React from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./main.js";

export function App(): React.ReactElement {
  return <RouterProvider router={router} />;
}
