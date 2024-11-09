import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
} from "react-router-dom";
import Datas from "../pages/datas/Datas";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Datas />,
  },
]);

export default router