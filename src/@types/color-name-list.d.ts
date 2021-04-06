// https://github.com/theGordHoard/hoardbot/blob/master/src/%40types/color-name-list.d.ts
// Copyright Katlyn Lorimer, all rights reserved.

declare module 'color-name-list' {
  export interface Color {
    name: string
    hex: string
  }

  const colors: Color[]

  export default colors
}
