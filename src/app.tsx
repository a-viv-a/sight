import { Meta, MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <Title>Aviva Ruben</Title>
          <Meta
            property="og:image"
            content="/pfp.png"
          />
          <Meta
            property="og:title"
            content="Aviva Ruben"
          />
          <Meta
            property="og:first_name"
            content="Aviva"
            />
          <Meta
            property="og:last_name"
            content="Ruben"
            />
          <Meta
            property="og:type"
            content="website"
            />
          <Suspense>{props.children}</Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
