import { Accessor, batch, Component, createDeferred, createEffect, createSignal, Index, onCleanup, Setter, untrack } from "solid-js"
import styles from "./Pixel.module.css"
import { makeEventListener } from "@solid-primitives/event-listener";
import { isServer } from "solid-js/web";
import { createAsync } from "@solidjs/router";
import { getPaintings } from "~/api";
import { DEPTH, PALETTE, WIDTH } from "~/pixelConfig";

const rgbaString = (rgba: readonly [number, number, number, number]) =>
  `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`


const fclamp = (min: number, v: number, max: number) =>
  Math.floor(Math.max(min, Math.min(max, v)))

type LinkElementWithStorage = HTMLLinkElement & { hrefStorage?: string }

// TODO: refactor into multiple componenets?
export const Render: Component<{
  data: Uint8Array,
  defaultBackground?: number,
  handleTouch?: (points: number[]) => void,
  disabled?: boolean,
  defer?: boolean,
  asFavicon?: boolean
}> = props => {
  let canvas!: HTMLCanvasElement;

  const readData = !props.defer ? () => props.data : createDeferred(() => props.data, {
    timeoutMs: 1_000
  })

  const faviconLink = () => !isServer && props.asFavicon
    ? document.querySelector<LinkElementWithStorage>("link[rel*=icon]")
    : null

  createEffect(() => {
    const ctx = canvas.getContext("2d")
    if (ctx === null) {
      console.error("ctx is null!")
      return
    }

    const imageData = ctx.createImageData(8, 8,)
    const data = readData()

    // Iterate through every pixel
    for (let src = 0, dest = 0; src < data.length && dest < imageData.data.length; src += 1, dest += 4) {
      const [r, g, b, a] = PALETTE[Math.min(DEPTH, data[src])]
      // console.log({r, g, b, a})
      imageData.data[dest + 0] = r; // R value
      imageData.data[dest + 1] = g; // G value
      imageData.data[dest + 2] = b; // B value
      imageData.data[dest + 3] = a; // A value
    }

    ctx.putImageData(imageData, 0, 0)

    const link = faviconLink()
    if (link) {
      // keep old favicon state
      if (!link.hrefStorage) {
        link.hrefStorage = link.href
      }
      link.href = canvas.toDataURL()
    }
  })

  // restore old favicon state
  onCleanup(() => {
    const link = faviconLink()
    if (link && link.hrefStorage !== undefined) {
      link.href = link.hrefStorage
      delete link.hrefStorage
    }
  })

  const [pointerDown, setPointerDown] = createSignal(false)

  const eventToIndex = (e: { offsetX: number, offsetY: number }): number => {
    const rect = canvas.getBoundingClientRect()
    const x = e.offsetX / rect.width * WIDTH,
      y = e.offsetY / rect.height * WIDTH

    return fclamp(0, y, WIDTH - 1) * WIDTH + fclamp(0, x, WIDTH - 1)
  }

  if (!isServer && props.handleTouch !== undefined) makeEventListener(window.document, "mouseup", (e) => {
    setPointerDown(false)
  })

  return <canvas ref={canvas} width={WIDTH} height={WIDTH} aria-disabled={props.disabled} class={styles.canvas}
    style={{
      // make SSR work better for paint!
      "background-color": rgbaString(PALETTE[props.defaultBackground ?? 0]),
      // TODO: put in style?
      "touch-action": props.handleTouch === undefined ? undefined : 'none'
    }}
    {...(
      props.handleTouch === undefined ? {} : {
        onpointerdown: (e) => {
          if (props.disabled) return
          batch(() => {
            setPointerDown(true)
            props.handleTouch!([eventToIndex(e)])
          })
        },
        onpointermove: (e: MouseEvent) => {
          if (props.disabled) return
          if (pointerDown()) {
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
        <Render data={data()} defer />
      }</Index>
    </div>
  </>
}

export const Paint: Component<{
  data: Accessor<Uint8Array<ArrayBuffer>>,
  setData: Setter<Uint8Array<ArrayBuffer>>,
  default: {
    color: number,
    backgroundColor: number
  }
  disabled?: boolean
}> = props => {
  const [color, setColor] = createSignal(props.default.color)

  return <div class={styles.paint}>
    <Render data={props.data()} handleTouch={(points) => {
      const data = props.data();
      const newData = new Uint8Array(data)
      for (const point of points) {
        newData[point] = color()
      }
      props.setData(newData)
    }} disabled={props.disabled} asFavicon defaultBackground={props.default.backgroundColor} />
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
