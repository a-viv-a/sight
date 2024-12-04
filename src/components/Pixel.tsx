import { Accessor, batch, Component, createEffect, createSignal, For, Index, Setter } from "solid-js"
import styles from "./Pixel.module.css"
import { makeEventListener } from "@solid-primitives/event-listener";

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

const rgbaString = (rgba: readonly [number, number, number, number]) =>
  `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`

const depth = palette.length - 1

const fclamp = (min: number, v: number, max: number) =>
  Math.floor(Math.max(min, Math.min(max, v)))

export const Render: Component<{ data: Uint8Array, handleTouch?: (points: number[]) => void, disabled?: boolean}> = props => {
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
      // console.log({r, g, b, a})
      imageData.data[dest + 0] = r; // R value
      imageData.data[dest + 1] = g; // G value
      imageData.data[dest + 2] = b; // B value
      imageData.data[dest + 3] = a; // A value
    }

    ctx.putImageData(imageData, 0, 0)
  })

  const [mouseDown, setMouseDown] = createSignal(false)

  const eventToIndex = (e: { offsetX: number, offsetY: number }): number => {
    const rect = canvas.getBoundingClientRect()
    const x = e.offsetX / rect.width * width,
      y = e.offsetY / rect.height * width

    return fclamp(0, y, width - 1) * width + fclamp(0, x, width - 1)
  }

  if (props.handleTouch !== undefined && typeof window !== 'undefined') makeEventListener(window.document, "mouseup", (e) => {
    setMouseDown(false)
  })

  return <canvas ref={canvas} width={width} height={width} aria-disabled={props.disabled} class={styles.canvas}
    style={{
      // make SSR work better for paint!
      "background-color": rgbaString(palette[0])
    }}
    {...(
      props.handleTouch === undefined ? {} : {
        onmousedown: (e) => {
          if (props.disabled) return
          batch(() => {
            setMouseDown(true)
            props.handleTouch!([eventToIndex(e)])
          })
        },
        onmousemove: (e: MouseEvent) => {
          if (props.disabled) return
          if (mouseDown()) {
            props.handleTouch!([eventToIndex(e)])
          }
        }
      }
    )} />
}

const PaintButton: Component<{ col: number }> = props =>
  <a href="/paint" title="create new pixel art painting" class={styles.create} style={{ "grid-column-start": props.col }}>
    <svg viewBox="0 0 10 10">
      <path d="M5,2 L5,8" />
      <path d="M2,5 L8,5" />
    </svg>
  </a>

export const Gallery: Component<{ paintings: Uint8Array[] }> = props => <>
  <p>
    User generated content. Leave your mark!
  </p>
  <div class={styles.gallery}>
    <PaintButton col={width - ((props.paintings.length) % width)} />
    <Index each={props.paintings}>{(data, i) =>
      <Render data={data()} />
    }</Index>
  </div>
</>


export const Paint: Component<{ data: Accessor<Uint8Array>, setData: Setter<Uint8Array>, disabled?: boolean }> = props => {
  const [color, setColor] = createSignal(palette.length - 1)

  return <div class={styles.paint}>
    <Render data={props.data()} handleTouch={(points) => {
      const data = props.data();
      const newData = new Uint8Array(data)
      for (const point of points) {
        newData[point] = color()
      }
      props.setData(newData)
    }} />
    <div class={styles.palette}>
      <Index each={palette}>{(rgba, i) =>
        <button
          classList={{
            [styles.selectedColor]: i === color()
          }}
          disabled={props.disabled}
          style={{ "background-color": rgbaString(rgba()) }}
          onClick={() => {
            setColor(i)
          }}
        />
      }</Index>
    </div>
  </div>
}

export default {
  Render,
  Gallery
}
