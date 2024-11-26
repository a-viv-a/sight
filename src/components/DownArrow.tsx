import { Component } from "solid-js";
import styles from "./DownArrow.module.css"

const DownArrow: Component = (props) => <svg class={styles.downArrow} viewBox="0 0 10 10" >
  <path d="M2,2 L5,6 L8,2" />
</svg>
export default DownArrow
