import { Title } from "@solidjs/meta";
import { Component, createSignal } from "solid-js";
import styles from "./index.module.css"
import DownArrow from "~/components/DownArrow";
import Toml from "~/components/Toml";

const Email: Component<{ address: string }> = props =>
  <a class={styles.email} href={`mailto:${props.address}`} title={props.address}>{props.address}</a>

export default function Home() {
  const [sliding, setSliding] = createSignal(false);
  let details!: HTMLDivElement;

  return (
    <main>
      <div class={styles.card}>
        <Title>Aviva Ruben</Title>
        <h1>Aviva Ruben</h1>
        <Email address="aviva@rubenfamily.com" />
        <DownArrow squish={sliding()} onClick={
          () => {
            const whenDone = () => {
              setSliding(false)
            }

            if (window.onscrollend !== undefined) {
              addEventListener("scrollend", whenDone, { once: true });
            }
            else {
              // safari fallback... :3
              // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollend_event#browser_compatibility
              setTimeout(whenDone, 250)
            }

            setSliding(true)
            details.scrollIntoView()
          }
        } />
      </div>
      <div class={styles.card} ref={details}>
        Studying CS at UW Madison. I love backpacking, ttrpgs, programming.
        <br />
        We should get in touch!
        <Toml.File>
          <Toml.Group head="contact-info">
            <Toml.KV key="bluesky" val="aviva.gay" link="https://bsky.app/profile/aviva.gay" />
            <Toml.KV key="discord" val="a.viv.a" />
            <Toml.KV key="github" val="a-viv-a" link="https://github.com/a-viv-a" />
            <Toml.Comment>ask for phone/signal!</Toml.Comment>
            <Toml.KV key="email" val="aviva@rubenfamily.com" link="mailto:aviva@rubenfamily.com"/>
          </Toml.Group>
        </Toml.File>
      </div>
    </main>
  );
}
