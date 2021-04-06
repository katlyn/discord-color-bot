// Much of this is taken from https://github.com/theGordHoard/hoardbot/blob/master/src/commands/util/color.ts
// Used with permission from myself because i'm the author

import difflib from 'difflib'
import namedColors from 'color-name-list'
import nearestColor, { ColorMatch } from 'nearest-color'
import { URL } from 'url'
import { Member, Role } from 'eris'

const colorMap = namedColors.reduce((o, { name, hex }) => Object.assign(o, { [name]: hex }), {})
const colorNames = Object.keys(colorMap)
const findNearest = nearestColor.from(colorMap)

const hexTest = /^#?((?:[0-9a-f]{6})|(?:[0-9a-f]{3}))$/i
const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i

// From https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
export const hexToRgb = (hex: string): ColorMatch['rgb'] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

export const rgbToHex = (color: ColorMatch['rgb']): string => {
  return `#${color.r.toString(16)}${color.g.toString(16)}${color.b.toString(16)}`
}

export const generateColorUrl = (text: string, color: string): string => {
  const url = new URL('https://math.katlyn.dev/render')
  url.searchParams.set('input', 'latex')
  url.searchParams.set('output', 'png')
  url.searchParams.set('width', '500')
  url.searchParams.set('foreground', color)
  url.searchParams.set('source', `\\text{${text}}`)

  return url.toString()
}

export interface ExtendedColor {
  hex: string
  name: string
  distance: number
  rgb: {
    r: number
    g: number
    b: number
  }
  image: string
  decimal: number
}

export const getColor = (query: string): ExtendedColor | null => {
  query = query.toLowerCase()

  const hexMatches = query.match(hexTest)
  if (hexMatches !== null) {
    let hex = hexMatches[1]
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    hex = '#' + hex.replace(shorthandRegex, (m, r: string, g: string, b: string) => {
      return r + r + g + g + b + b
    }).toUpperCase()
    const color = findNearest(hex)
    return {
      hex,
      name: color.name,
      distance: color.distance,
      rgb: color.rgb,
      image: generateColorUrl(hex, hex),
      decimal: parseInt(hex.substr(1), 16)
    }
  } else {
    let named = namedColors.find(c => c.name.toLowerCase() === query)
    if (named === undefined) {
      const closeMatch = difflib.getCloseMatches(query, colorNames)[0]
      named = namedColors.find(c => c.name.toLowerCase() === closeMatch)
    }
    if (named === undefined) {
      named = namedColors.find(c => c.name.toLowerCase().includes(query))
    }
    if (named === undefined) {
      return null
    }
    return {
      hex: named.hex.toUpperCase(),
      name: named.name,
      distance: 0,
      rgb: hexToRgb(named.hex),
      image: generateColorUrl(named.name, named.hex),
      decimal: parseInt(named.hex.substr(1), 16)
    }
  }
}

export const getHighestRole = (member: Member): Role => {
  const roles = member.roles.map(r => member.guild.roles.get(r))
  roles.sort((x, y) => {
    return y.position - x.position
  })
  return roles[0]
}
