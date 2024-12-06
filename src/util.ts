
export const loadEvent = new Promise<void>((res) => {
  window.addEventListener("load", () => res())
})
