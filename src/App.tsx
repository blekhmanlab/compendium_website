import "@fontsource-variable/mona-sans/wght.css";
import "./styles.css";
import {
  createBrowserRouter,
  Outlet,
  redirect,
  ScrollRestoration,
} from "react-router";
import { RouterProvider } from "react-router/dom";
import Home from "@/pages/home/Home";
import {
  getSelectedCompendium,
  setSelectedCompendium,
} from "@/pages/home/state";
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
  let compendium = url.searchParams.get("compendium");

  /** update selected compendium */
  if (compendium && compendium in meta)
    setSelectedCompendium(compendium as keyof typeof meta);
  else setSelectedCompendium("human-microbiome-compendium");
  compendium = getSelectedCompendium();

  /** update theme colors based on selected compendium */
  if (compendium === "human-microbiome-compendium") {
    document.documentElement.style.setProperty("--primary-hue", "340");
    document.documentElement.style.setProperty("--secondary-hue", "300");
    document.documentElement.style.setProperty("--gray-hue", "280");
  } else if (compendium === "meta-g-compendium") {
    document.documentElement.style.setProperty("--primary-hue", "220");
    document.documentElement.style.setProperty("--secondary-hue", "180");
    document.documentElement.style.setProperty("--gray-hue", "240");
  }
};

/** update on load */
window.addEventListener("load", updateCompendium);
/** update on route change */
router.subscribe(updateCompendium);
