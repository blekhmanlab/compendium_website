import "./styles.css";
import {
  createBrowserRouter,
  Outlet,
  redirect,
  ScrollRestoration,
} from "react-router";
import { RouterProvider } from "react-router/dom";
import Home from "@/pages/home/Home";
import Projectionist from "@/pages/projectionist/Projectionist";

/** app entrypoint */
export default function App() {
  return <RouterProvider router={router} />;
}

function Layout() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}

/** route definitions */
const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
        loader: async () => {
          /** handle 404 redirect (see 404.html) */

          /** load redirect details */
          const redirectPath = window.sessionStorage.redirectPath || "";

          /** remove right after consuming */
          window.sessionStorage.removeItem("redirectPath");

          /** redirect */
          if (redirectPath) {
            console.debug("Redirecting to:", redirectPath);
            return redirect(redirectPath);
          } else return null;
        },
      },
      {
        path: "/projectionist",
        element: <Projectionist />,
      },
    ],
  },
];

/** router */
const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL,
});
