import { Component } from "solid-js";
import styles from "./DownArrow.module.css"

const DownArrow: Component<{ onClick: () => void, squish: boolean }> = (props) =>
  <svg classList={{
    [styles.downArrow]: true,
    [styles.squish]: props.squish
  }} viewBox="0 0 10 10" onClick={props.onClick}>
    <path d="M2,2 L5,6 L8,2" />
  </svg>
export default DownArrow
