/**
 * Element reordering method for dnd lists. Supports multi-element "drag" sorting.
 * @template T Type of list element
 * @param list The list to reorder
 * @param sourceIndex Starting element index
 * @param destIndex Target element index
 * @param len Number of elements to move, default is 1
 * @returns T[] The reordered list
 */
export function droppableReorder<T>(list: T[], sourceIndex: number, destIndex: number, len = 1) {
  const result = Array.from(list)
  const removed = result.splice(sourceIndex, len)

  if (sourceIndex < destIndex) {
    result.splice(destIndex - len + 1, 0, ...removed)
  } else {
    result.splice(destIndex, 0, ...removed)
  }
  return result
}

/**
 * Strings starting with English letters are sorted first.
 * @param a String
 * @param b String
 * @returns Sorted string
 */
export function sortByEnglishFirst(a: string, b: string) {
  const isAEnglish = /^[a-zA-Z]/.test(a)
  const isBEnglish = /^[a-zA-Z]/.test(b)
  if (isAEnglish && !isBEnglish) return -1
  if (!isAEnglish && isBEnglish) return 1
  return a.localeCompare(b)
}
