import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { COGNATE_SETS, LANGUAGE_FAMILIES, buildGraph } from '../mock/data'
export { LANGUAGE_FAMILIES, COGNATE_SETS }

// 同源词表检索条件的统一形态：关键词 + 语系
export interface CognateQuery {
  keyword: string
  family: string
}

const EMPTY_QUERY: CognateQuery = { keyword: '', family: 'all' }

export const useEtymologyStore = defineStore('etymology', () => {
  const graph = ref(buildGraph())
  const selectedNode = ref<any>(null)
  const searchQuery = ref(EMPTY_QUERY.keyword)
  const selectedFamily = ref(EMPTY_QUERY.family)
  const lastQuery = ref<CognateQuery>({ ...EMPTY_QUERY })

  // ---- 同源词表检索的统一流程：解析 → 应用；清除 / 恢复也走同一套写法 ----
  // 后续调整条件（增删字段、改组合顺序）只改 parseQuery / runQuery 这两处。

  // 解析：把当前控件输入收拢为一份条件对象
  function parseQuery(): CognateQuery {
    return { keyword: searchQuery.value, family: selectedFamily.value }
  }

  // 应用：按固定顺序组合条件（先关键词、后语系），所有入口共用这一份判断
  function runQuery(query: CognateQuery) {
    const q = query.keyword.toLowerCase()
    return COGNATE_SETS.filter(cs => {
      const matchSearch = !q || cs.root.toLowerCase().includes(q) || cs.meaning.includes(q) || Object.values(cs.languages).some((w: string) => w.toLowerCase().includes(q))
      const matchFamily = query.family === 'all' || cs.family === query.family
      return matchSearch && matchFamily
    })
  }

  // 空结果、恢复上次查询、滚动定位等场景都经由同一个 computed 取结果
  const filteredCognates = computed(() => runQuery(parseQuery()))

  // 清除：先记住当前条件（供恢复），再回到空条件
  function clearQuery() {
    lastQuery.value = parseQuery()
    searchQuery.value = EMPTY_QUERY.keyword
    selectedFamily.value = EMPTY_QUERY.family
  }

  // 恢复：回到上次清除前的条件
  function restoreQuery() {
    searchQuery.value = lastQuery.value.keyword
    selectedFamily.value = lastQuery.value.family
  }

  const hasLastQuery = computed(() => {
    const q = lastQuery.value
    return q.keyword !== EMPTY_QUERY.keyword || q.family !== EMPTY_QUERY.family
  })

  return { graph, selectedNode, searchQuery, selectedFamily, filteredCognates, lastQuery, hasLastQuery, clearQuery, restoreQuery }
})
