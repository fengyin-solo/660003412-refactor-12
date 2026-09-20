import type { CognateSet } from '../types'

/**
 * 同源词表检索条件的唯一流程入口。
 *
 * 解析（parse）、清除/恢复（restore → 同一 applyCognateQuery）、
 * 以及过滤结果（filterCognates，空结果判断与滚动定位共用）全部经过这里，
 * 后续调整条件时只需改动本文件。
 */

/** 条件输入：词表搜索框 + 语系下拉框绑定的原始值。 */
export interface CognateQueryInput {
  query: string
  family: string
}

/** 解析后的检索条件，只在本流程内产生，不允许外部自行拼造。 */
export interface CognateCondition {
  keyword: string
  family: string
}

/** 空条件：清除与恢复无快照时统一回落到它。 */
export const EMPTY_COGNATE_QUERY: CognateQueryInput = { query: '', family: 'all' }

export function isCognateQueryEmpty(input: CognateQueryInput): boolean {
  return !input.query && input.family === 'all'
}

/** 解析原始输入为检索条件；任何无效输入都按空条件处理，保证三个场景结果一致。 */
export function parseCognateCondition(input: Partial<CognateQueryInput> | null | undefined): CognateCondition {
  const query = typeof input?.query === 'string' ? input.query : ''
  const family = typeof input?.family === 'string' ? input.family : 'all'
  return { keyword: query.toLowerCase(), family }
}

function matchesKeyword(cs: CognateSet, keyword: string): boolean {
  return (
    !keyword ||
    cs.root.toLowerCase().includes(keyword) ||
    cs.meaning.includes(keyword) ||
    Object.values(cs.languages).some(w => w.toLowerCase().includes(keyword))
  )
}

function matchesFamily(cs: CognateSet, family: string): boolean {
  return family === 'all' || cs.family === family
}

/** 条件判定的唯一实现：空结果提示、恢复后过滤、滚动定位都调用它。 */
export function matchesCognateQuery(cs: CognateSet, condition: CognateCondition): boolean {
  return matchesKeyword(cs, condition.keyword) && matchesFamily(cs, condition.family)
}

/** 按条件过滤同源词数据，数据本身不做任何改动。 */
export function filterCognates(sets: CognateSet[], input: Partial<CognateQueryInput> | null | undefined): CognateSet[] {
  const condition = parseCognateCondition(input)
  return sets.filter(cs => matchesCognateQuery(cs, condition))
}
