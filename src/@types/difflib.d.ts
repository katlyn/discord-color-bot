// https://github.com/theGordHoard/hoardbot/blob/master/src/%40types/difflib.d.ts
// Copyright Katlyn Lorimer, all rights reserved.

declare module 'difflib' {
  // The best (no more than n) matches among the possibilities are returned in a
  // list, sorted by similarity score, most similar first.
  export function getCloseMatches <T> (
    // A sequence for which close matches are desired
    word: T,
    // A list of sequences against which to match word
    possibilities: T[],
    // The maximum number of close matches to return; Must be greater than 0.
    n?: number,
    // A float in the range [0, 1]. Possibilities that don’t score at least that
    // similar to word are ignored.
    cutoff?: number
  ): T[]
}
