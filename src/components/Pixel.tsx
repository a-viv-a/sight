import { Accessor, batch, Component, createEffect, createSignal, Index, Setter } from "solid-js"
import styles from "./Pixel.module.css"
import { makeEventListener } from "@solid-primitives/event-listener";
import { getPaintings } from "~/paintingServer";
import { isServer } from "solid-js/web";
import { createAsync } from "@solidjs/router";

const hexToRGBA = (hex: string) => {
  const
    a = parseInt(hex.slice(0, 2), 16),
    r = parseInt(hex.slice(2, 4), 16),
    g = parseInt(hex.slice(4, 6), 16),
    b = parseInt(hex.slice(6, 8), 16);

  return [r, g, b, a] as const
}

export const WIDTH = 8

// https://lospec.com/palette-list/curiosities
// paint.net txt format
export const PALETTE = `
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

export const DEPTH = PALETTE.length - 1

const fclamp = (min: number, v: number, max: number) =>
  Math.floor(Math.max(min, Math.min(max, v)))

export const Render: Component<{ data: Uint8Array, handleTouch?: (points: number[]) => void, disabled?: boolean }> = props => {
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
      const [r, g, b, a] = PALETTE[Math.min(DEPTH, props.data[src])]
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
    const x = e.offsetX / rect.width * WIDTH,
      y = e.offsetY / rect.height * WIDTH

    return fclamp(0, y, WIDTH - 1) * WIDTH + fclamp(0, x, WIDTH - 1)
  }

  if (!isServer && props.handleTouch !== undefined) makeEventListener(window.document, "mouseup", (e) => {
    setMouseDown(false)
  })

  return <canvas ref={canvas} width={WIDTH} height={WIDTH} aria-disabled={props.disabled} class={styles.canvas}
    style={{
      // make SSR work better for paint!
      "background-color": rgbaString(PALETTE[0])
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

const PaintButton: Component<{ col: number, goto?: string }> = props =>
  <a href={props.goto !== undefined ? `/paint?goto=${props.goto}` : "/paint"} title="create new pixel art painting" class={styles.create} style={{ "grid-column-start": props.col }}>
    <svg viewBox="0 0 10 10">
      <path d="M5,2 L5,8" />
      <path d="M2,5 L8,5" />
    </svg>
  </a>

export const Gallery: Component<{ goto?: string }> = props => {
  const paintings = createAsync(() => getPaintings())

  return <>
    <p>
      User generated content. Leave your mark!
    </p>
    <div class={styles.gallery}>
      <PaintButton col={WIDTH - ((paintings()?.length ?? 0) % WIDTH)} goto={props.goto} />
      <Index each={paintings()}>{(data, i) =>
        <Render data={data()} />
      }</Index>
    </div>
  </>
}

export const Paint: Component<{ data: Accessor<Uint8Array<ArrayBuffer>>, setData: Setter<Uint8Array<ArrayBuffer>>, disabled?: boolean }> = props => {
  const [color, setColor] = createSignal(PALETTE.length - 1)

  return <div class={styles.paint}>
    <Render data={props.data()} handleTouch={(points) => {
      const data = props.data();
      const newData = new Uint8Array(data)
      for (const point of points) {
        newData[point] = color()
      }
      props.setData(newData)
    }} disabled={props.disabled} />
    <div class={styles.palette}>
      <Index each={PALETTE}>{(rgba, i) =>
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
