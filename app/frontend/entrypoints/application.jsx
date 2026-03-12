import "../styles/globals.css";
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import AppLayout from "../layouts/AppLayout";

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob("../pages/**/*.jsx", { eager: true });
    const page = pages[`../pages/${name}.jsx`];
    page.default.layout =
      page.default.layout || ((p) => <AppLayout>{p}</AppLayout>);
    return page;
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
});
