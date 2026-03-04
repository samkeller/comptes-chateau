import {
  createBrowserRouter,
} from "react-router-dom";
import Datas from "../pages/datas/Datas";
import AccountBook from "../pages/accountBook/AccountBook";
import AuthPage from "../pages/AuthPage";
import NotFoundPage from "../pages/NotFoundPage";
import Budget from "../pages/budget/Budget";
import Index from "../pages/index/Index";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/comptes",
    element: <AccountBook />,
  },
  {
    path: "/budget",
    element: <Budget />,
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