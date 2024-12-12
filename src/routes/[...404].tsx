import { HttpStatusCode } from "@solidjs/start";
import styles from "./index.module.css"
import Metadata from "~/components/Metadata";

const lyrics = `
And you may ask yourself, "How do I work this?"
And you may ask yourself, "Where is that large automobile?"
And you may tell yourself, "This is not my beautiful house"
And you may tell yourself, "This is not my beautiful wife"
`.trim()

export default function NotFound() {
  return (
    <main class={styles.card}>
      <Metadata
        title="Not Found"
        description={lyrics}  
      />
      <HttpStatusCode code={404} />
      <h1>Page Not Found</h1>
      <p>
        <a href="/">go home?</a>
      </p>
    </main>
  );
}
