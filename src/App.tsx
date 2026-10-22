import "@fontsource-variable/mona-sans/wght.css";
import "./styles.css";
import type { Compendium } from "@/site";
import {
  createBrowserRouter,
  Outlet,
  redirect,
  ScrollRestoration,
} from "react-router";
import { RouterProvider } from "react-router/dom";
import Home from "@/pages/home/Home";
import { setSelectedCompendium } from "@/pages/home/state";
import Projectionist from "@/pages/projectionist/Projectionist";
import meta from "@/site";

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
export const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL,
});

/** update selected compendium */
const updateCompendium = () => {
  /** get selected compendium in url */
  const url = new URL(window.location.href);
  const param = url.searchParams.get("compendium") || "";

  /** update selected compendium */
  const compendium: Compendium =
    param in meta ? (param as Compendium) : "human-microbiome-compendium";
  setSelectedCompendium(compendium as keyof typeof meta);

  /** update theme colors based on selected compendium */
  const theme = meta[compendium].colors;
  document.documentElement.style.setProperty(
    "--primary-hue",
    String(theme["primary-hue"]),
  );
  document.documentElement.style.setProperty(
    "--secondary-hue",
    String(theme["secondary-hue"]),
  );
  document.documentElement.style.setProperty(
    "--gray-hue",
    String(theme["gray-hue"]),
  );
};

/** update on load */
window.addEventListener("load", updateCompendium);
/** update on route change */
router.subscribe(updateCompendium);
