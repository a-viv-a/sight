import { Component, createEffect, Index } from "solid-js"
import styles from "./Pixel.module.css"

const hexToRGBA = (hex: string) => {
  const 
    a = parseInt(hex.slice(0, 2), 16),
    r = parseInt(hex.slice(2, 4), 16),
    g = parseInt(hex.slice(4, 6), 16),
    b = parseInt(hex.slice(6, 8), 16);

  return [r, g, b, a] as const
}

const width = 8

// https://lospec.com/palette-list/curiosities
// paint.net txt format
const palette = `
;paint.net Palette File
;Downloaded from Lospec.com/palette-list
;Palette Name: curiosities
;Description: A soft palette, small but with some variation across hues.
;Colors: 6
FF46425e
FF15788c
FF00b9be
FFffeecc
FFffb0a3
FFff6973
`
// primative parser
  .split("\n")
  .filter(l => !l.startsWith(";") && l.length === 8)
  .map(hexToRGBA)

const depth = palette.length - 1


export const Render: Component<{ data: Uint8Array }> = props => {
  let canvas!: HTMLCanvasElement;

  createEffect(() => {
    const ctx = canvas.getContext("2d")
    if (ctx === null) {
      console.error("ctx is null!")
      return
    }

    const imageData = ctx.createImageData(8, 8,)

    // Iterate through every pixel
    for (let src = 0, dest = 0; src < props.data.length && dest < imageData.data.length; src += 1, dest += 4) {
      const [r, g, b, a] = palette[Math.min(depth, props.data[src])]
      console.log({r, g, b, a})
      imageData.data[dest + 0] = r; // R value
      imageData.data[dest + 1] = g; // G value
      imageData.data[dest + 2] = b; // B value
      imageData.data[dest + 3] = a; // A value
    }

    ctx.putImageData(imageData, 0, 0)
  })

  return <canvas ref={canvas} width={width} height={width} class={styles.canvas} />
}

export const Gallery: Component<{ paintings: Uint8Array[] }> = props =>
  <div>
    <Index each={props.paintings}>{(data, i) =>
      <Render data={data()} />
    }</Index>
  </div>

export default {
  Render,
  Gallery
}
