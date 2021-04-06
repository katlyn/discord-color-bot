// https://github.com/theGordHoard/hoardbot/blob/master/src/%40types/nearest-color.d.ts
// Copyright Katlyn Lorimer, all rights reserved.

declare module 'nearest-color' {
  export interface ColorMap {
    [key: string]: string
  }

  export interface ColorMatch {
    name: string
    value: string
    rgb: { r: number, b: number, g: number }
    distance: number
  }

  function ColorMatcher (color: string): ColorMatch

  export default {
    from: (colors: ColorMap) => ColorMatcher
  }
}
