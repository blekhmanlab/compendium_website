import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    svgr({
      svgrOptions: {
        /** https://github.com/gregberge/svgr/discussions/770 */
        expandProps: "start",
        svgProps: {
          className: `{props.className ? props.className + " icon" : "icon"}`,
          "aria-hidden": "true",
        },
      },
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
