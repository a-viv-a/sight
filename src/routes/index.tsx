import { Title } from "@solidjs/meta";
import { Component } from "solid-js";

const Email: Component<{address: string}> = props => 
  <a href={`mailto:${props.address}`} title={props.address}>{props.address}</a>

export default function Home() {
  return (
    <main>
      <div class=".centered">
        <Title>Aviva Ruben</Title>
        <h1>Aviva Ruben</h1>
        <Email address="aviva@rubenfamily.com" />
      </div>
    </main>
  );
}
