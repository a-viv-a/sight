import { Title } from "@solidjs/meta";
import { Component, createSignal, Index } from "solid-js";
import styles from "./index.module.css"
import NavArrow from "~/components/NavArrow";
import Toml from "~/components/Toml";
import Pixel, { Render } from "~/components/Pixel";

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

export default function Home() {
  let landing!: HTMLDivElement;
  let details!: HTMLDivElement;

  const data = new Uint8Array(64)
  for (let i = 0; i < 64; i++) {
    data[i] = i % 6
  }

  return (
    <main>
      <Pixel.Render data={data}/>
      <div class={styles.card} ref={landing}>
        <Title>Aviva Ruben</Title>
        <h1>Aviva Ruben</h1>
        <Email address="aviva@rubenfamily.com" />
        <NavArrow goto={() => details} direction="down" />
      </div>
      <div class={styles.page} ref={details}>
        <NavArrow goto={() => landing} direction="up" />
        <p>
          Studying CS at UW Madison. <Pronoun /> I love backpacking, ttrpgs, programming.
          <br />
          We should get in touch!
        </p>
        <Toml.File>
          <Toml.Group head="contact-info">
            <Toml.KV key="bluesky" val="aviva.gay" link="https://bsky.app/profile/aviva.gay" />
            <Toml.KV key="discord" val="a.viv.a" />
            <Toml.KV key="github" val="a-viv-a" link="https://github.com/a-viv-a" />
            <Toml.Comment>ask for phone/signal!</Toml.Comment>
            <Toml.KV key="email" val="aviva@rubenfamily.com" link="mailto:aviva@rubenfamily.com" />
          </Toml.Group>
        </Toml.File>
      </div>
    </main>
  );
}
