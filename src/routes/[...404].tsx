import { Meta, Title } from "@solidjs/meta";
import { HttpStatusCode } from "@solidjs/start";
import styles from "./index.module.css"

export default function NotFound() {
  return (
    <main class={styles.card}>
      <Title>Not Found</Title>
      <Meta property="og:title" content="Not Found" />
      <Meta property="og:description" content='And you may tell yourself, "This is not my beautiful wife"' />
      <HttpStatusCode code={404} />
      <h1>Page Not Found</h1>
      <p>
        <a href="/">go home?</a>
      </p>
    </main>
  );
}
