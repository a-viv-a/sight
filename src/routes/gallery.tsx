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
    paint[i] = i % 2 + i % 3 + i % 4
  }
}
for (let p = 1; p <= 24; p++) {
  let paint = paintings[paintings.length] = new Uint8Array(64)
  for (let i = 0; i < 64; i++) {
    paint[i] = i % p / 4
  }
}

export default function GalleryRoute() {
  return (
    <main classList={{ [styles.page]: true, [styles.padtop]: true }}>
      <Title>Gallery</Title>
      <p>
        User generated content. Leave your mark!
      </p>
      <Gallery paintings={paintings} />
    </main>
  );
}
