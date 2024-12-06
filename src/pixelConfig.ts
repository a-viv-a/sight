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

export const DEPTH = PALETTE.length - 1
