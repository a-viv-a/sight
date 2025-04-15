import { Component, createSignal, lazy, ParentComponent, Suspense } from "solid-js";
import styles from "./index.module.css"
import NavArrow from "~/components/NavArrow";
import Toml from "~/components/Toml";
import { clientOnly } from "@solidjs/start";
import Metadata from "~/components/Metadata";

const Email: Component<{ address: string }> = props =>
  <a class={styles.email} href={`mailto:${props.address}`} title={props.address}>{props.address}</a>

const pronounsList = [
  "she",
  "her",
  "hers",
  "herself",

  "hereditary",
  "heretic",
  "hertz",
  "hermit",
  "hermetically sealed",
  "herb",

  "she",
  "sheaf",
  "shell",
  "sherbert",
  "sherlock",
  "shelldrake",
  "sheep herder",
  "shadow",
  "shamrock",
] as const

const punctuationMark = [
  ".", ".", ".", "…", "!", ".", "?", "‽"
]

const Pronoun: Component = props => {
  const [pronouns, setPronouns] = createSignal<Array<typeof pronounsList[number]>>([pronounsList[0]]);

  const inc = () => {
    setPronouns(p =>
      [...p, pronounsList[p.length % pronounsList.length]])
  }

  return <span onClick={inc} classList={{
    [styles.pronoun]: true,
    [styles.single]: pronouns().length <= 1
  }}>
    {`${pronouns().join(' / ')}${punctuationMark[
      pronouns().length % punctuationMark.length
    ]}`}
  </span>
}

const A: ParentComponent<{href: string}> = props => <a href={props.href} class={styles.subtle}>{props.children}</a>

// Gallery does enough main thread work inside an effect (canvas painting) to cause FOUC so load it client only
// this defers rendering to after hydration
const Gallery = clientOnly(async () => ({
  default: ((await import("~/components/Pixel")).Gallery)
}))

export default function Home() {
  let landing!: HTMLDivElement;
  let details!: HTMLDivElement;

  return (
    <main>
      <div class={styles.card} ref={landing}>
        <Metadata 
          description="CS student at UW Madison. We should get in touch!"
          canonical="https://aviva.gay"
        />
        <h1>Aviva Ruben</h1>
        <Email address="aviva@rubenfamily.com" />
        <NavArrow goto={() => details} direction="down" />
      </div>
      <div class={styles.page} ref={details}>
        <NavArrow goto={() => landing} direction="up" />
        <p>
          Studying CS at UW Madison. <Pronoun /> I love backpacking, ttrpgs, programming.
          We should get in touch!
        </p>
        <Toml.File>
          <Toml.Group head="contact-info">
            <Toml.KV key="bluesky" val="aviva.gay" link="https://deer.social/profile/did:plc:jx4g6baqkwdlonylsetvpu7c" />
            <Toml.KV key="discord" val="a.viv.a" />
            <Toml.KV key="github" val="a-viv-a" link="https://github.com/a-viv-a" />
            <Toml.Comment>ask for phone/signal!</Toml.Comment>
            <Toml.KV key="email" val="aviva@rubenfamily.com" link="mailto:aviva@rubenfamily.com" />
          </Toml.Group>
        </Toml.File>
        <p>
        You can see what I'm working on right now on my <A href="https://github.com/a-viv-a">github</A>,
        like the <A href="https://github.com/a-viv-a/nixfiles">nixfiles</A> for my laptop,
        the <A href="https://github.com/a-viv-a/sight">source for this website</A> or{" "}
        <A href="https://github.com/a-viv-a/deer-social">the source for deer.social</A>, my bluesky social app soft fork.
        I sometimes write <A href="https://whtwnd.com/aviva.gay">blog posts on whitewind</A> (atproto based blogging).
        </p>
        {/*
        suspense will trip when awaiting the import
        the suspense will resolve before the gallery is rendered so we need both fallbacks
        this ensures no flashes and that SSR includes the fallback
        */}
        <Suspense fallback={<code class={styles.center}>loading gallery...</code>}>
          <Gallery goto="/" fallback={<code class={styles.center}>loading gallery...</code>} />
        </Suspense>
      </div>
    </main>
  );
}
