import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import MainPage from "./pages/MainPage";
import Login from "./pages/Login";
import Signin from "./pages/Signin";
import Findpass from "./pages/Findpass";
import Ranking from "./pages/Ranking";
import Result from "./pages/mypage/Result";
import Create from "./pages/Create";
import VotePage from "./pages/VotePage";
import MyPage from "./pages/mypage/MyPage";
import Profile from "./pages/mypage/Profile";
import Profileedit from "./pages/mypage/Default";
import Like from "./pages/mypage/Like";
import MyCreate from "./pages/mypage/MyCreate";
import Admin from "./pages/Admin";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Faq from "./pages/Faq";
import Terms from "./pages/Terms";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <MainPage /> },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/signin",
        element: <Signin />,
      },
      {
        path: "/findpass",
        element: <Findpass />,
      },
      {
        path: "/ranking",
        element: <Ranking />,
      },
      {
        path: "/result",
        element: <Result />,
      },
      {
        path: "/create",
        element: <Create />,
      },
      {
        path: "/vote",
        element: <VotePage />,
      },
      {
        path: "/vote/:postId",
        element: <VotePage />,
      },
      {
        path: "/post/:postId",
        element: <VotePage />,
      },
      {
        path: "/admin",
        element: <Admin />,
      },
      {
        path: "/about",
        element: <About />,
      },
      {
        path: "/privacy",
        element: <Privacy />,
      },
      {
        path: "/terms",
        element: <Terms />,
      },
      {
        path: "/faq",
        element: <Faq />,
      },
      {
        path: "/mypage",
        element: <MyPage />,
        children: [
          { index: true, element: <Profile /> },
          {
            path: "history",
            element: <Result />,
          },
          {
            path: "like",
            element: <Like />,
          },
          {
            path: "profileedit",
            element: <Profileedit />,
          },
          {
            path: "mypoll",
            element: <MyCreate />,
          },
          {
            path: "faq",
            element: <Faq />,
          },
        ],
      },
    ],
  },
]);

export default router;
