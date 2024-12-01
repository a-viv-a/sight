import { Title } from "@solidjs/meta";
import { HttpStatusCode } from "@solidjs/start";
import styles from "./index.module.css"

export default function NotFound() {
  return (
    <main class={styles.card}>
      <Title>Not Found</Title>
      <HttpStatusCode code={404} />
      <h1>Page Not Found</h1>
      <p>
        <a href="/">go home</a>
      </p>
    </main>
  );
}
