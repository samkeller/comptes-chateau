import {
  createBrowserRouter,
} from "react-router-dom";
import Datas from "../pages/datas/Datas";
import AccountBook from "../pages/accountBook/AccountBook";
import AuthPage from "../pages/AuthPage";
import NotFoundPage from "../pages/NotFoundPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AccountBook />,
  },
  {
    path: "/datas",
    element: <Datas />,
  },
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  }
]);

export default router