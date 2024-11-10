import {
  createBrowserRouter,
} from "react-router-dom";
import Datas from "../pages/datas/Datas";
import AccountBook from "../pages/accountBook/AccountBook";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AccountBook />,
  },
  {
    path: "/datas",
    element: <Datas />,
  },
]);

export default router