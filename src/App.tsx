import "./styles.css";
import { createBrowserRouter, Outlet, redirect } from "react-router";
import { RouterProvider } from "react-router/dom";
import Home from "@/pages/home/Home";
import { redirectPath } from "@/util/url";

/** app entrypoint */
const App = () => <RouterProvider router={router} />;

export default App;

/** route definitions */
const routes = [
  {
    path: "/",
    element: <Outlet />,
    children: [
      {
        index: true,
        element: <Home />,
        loader: async () => {
          /** handle 404 redirect */
          if (redirectPath) {
            console.debug("Redirecting to:", redirectPath);
            return redirect(redirectPath);
          } else return null;
        },
      },
    ],
  },
];

/** router */
const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL,
});
