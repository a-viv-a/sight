import styles from "./index.module.css"
import { Gallery } from "~/components/Pixel";
import Metadata from "~/components/Metadata";

export default function GalleryRoute() {

  return (
    <main classList={{ [styles.page]: true, [styles.padtop]: true }}>
      <Metadata
        title="Gallery"
        description="Standalone page for viewing all the cool pixel art users uploaded"
      />
      <Gallery />
    </main>
  );
}
