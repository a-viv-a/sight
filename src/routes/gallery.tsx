import { Title } from "@solidjs/meta";
import styles from "./index.module.css"
import { Gallery } from "~/components/Pixel";

const paintings: Uint8Array[] = []

let paint = paintings[paintings.length] = new Uint8Array(64)
for (let i = 0; i < 64; i++) {
  paint[i] = i % 6
}
for (let p = 0; p <= 3; p++) {
  let paint = paintings[paintings.length] = new Uint8Array(64)
  for (let i = 0; i < 64; i++) {
    paint[i] = i / 8 % 6
  }
}
for (let p = 0; p <= 2; p++) {
  let paint = paintings[paintings.length] = new Uint8Array(64)
  for (let i = 0; i < 64; i++) {
    paint[i] = i / 3 % 6
  }
}
for (let p = 0; p <= 2; p++) {
  let paint = paintings[paintings.length] = new Uint8Array(64)
  for (let i = 0; i < 64; i++) {
    paint[i] = i % 3
  }
}
for (let p = 0; p <= 8; p++) {
  let paint = paintings[paintings.length] = new Uint8Array(64)
  for (let i = 0; i < 64; i++) {
    paint[i] = i %2 + i % 3 + i % 4
  }
}

export default function NotFound() {
  return (
    <main class={styles.page}>
      <Title>Gallery</Title>
      <p>
        This is user generated content. If there is something really bad please reach out and let me know.
      </p>
      <Gallery paintings={paintings}/>
    </main>
  );
}
