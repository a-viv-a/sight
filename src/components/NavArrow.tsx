import { Component, createSignal } from "solid-js";
import styles from "./NavArrow.module.css"

type Direction = "up" | "down";

const NavArrow: Component<{ direction: Direction, goto: () => HTMLElement }> = (props) => {
  const [sliding, setSliding] = createSignal(false);

  return <svg classList={{
    [styles.navArrow]: true,
    [styles[props.direction]]: true,
    [styles.squish]: sliding()
  }} viewBox="0 0 10 10" onClick={() => {
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
    props.goto().scrollIntoView()
  }
  }>
    <path d="M2,2 L5,6 L8,2" />
  </svg>
}

export default NavArrow
