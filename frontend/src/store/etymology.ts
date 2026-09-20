import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { COGNATE_SETS, LANGUAGE_FAMILIES, buildGraph } from '../mock/data'
import {
  EMPTY_COGNATE_QUERY,
  filterCognates,
  isCognateQueryEmpty,
  type CognateQueryInput,
} from './cognateQuery'
export { LANGUAGE_FAMILIES, COGNATE_SETS }

export const useEtymologyStore = defineStore('etymology', () => {
  const graph = ref(buildGraph())
  const selectedNode = ref<any>(null)

  // 同源词表检索条件的原始输入（搜索框 / 语系下拉框直接绑定）。
  const searchQuery = ref(EMPTY_COGNATE_QUERY.query)
  const selectedFamily = ref(EMPTY_COGNATE_QUERY.family)

  // 上一次查询快照：清除前 / 进入详情前保存，供“恢复上次查询”使用。
  const lastCognateQuery = ref<CognateQueryInput | null>(null)
  const cognateScrollTop = ref(0)
  const selectedCognateRoot = ref<string | null>(null)

  // 当前输入与滚动定位使用同一份条件解析结果，过滤只有 filterCognates 一条路径。
  const cognateConditionInput = computed<CognateQueryInput>(() => ({
    query: searchQuery.value,
    family: selectedFamily.value,
  }))
  const filteredCognates = computed(() => filterCognates(COGNATE_SETS, cognateConditionInput.value))
  const isCognateEmpty = computed(() => isCognateQueryEmpty(cognateConditionInput.value))
  const hasNoCognateMatch = computed(() => filteredCognates.value.length === 0)
  const canRestoreCognateQuery = computed(() => lastCognateQuery.value !== null)

  /** 条件写入的唯一入口：清除、恢复、返回详情都经过它，再统一交由解析流程过滤。 */
  function applyCognateQuery(input: Partial<CognateQueryInput>) {
    const condition = { ...EMPTY_COGNATE_QUERY, ...input }
    searchQuery.value = condition.query
    selectedFamily.value = condition.family
  }

  /** 清除条件：当前条件非空时先存为“上次查询”，再走统一写入入口回落到空条件。 */
  function clearCognateQuery() {
    if (!isCognateEmpty.value) lastCognateQuery.value = { ...cognateConditionInput.value }
    applyCognateQuery(EMPTY_COGNATE_QUERY)
  }

  /** 恢复上次查询：快照同样经过统一写入入口，过滤结果与当初完全一致。 */
  function restoreCognateQuery() {
    if (lastCognateQuery.value) applyCognateQuery(lastCognateQuery.value)
  }

  /** 进入同源词详情：保存当前条件与浏览位置，详情期间清空列表条件。 */
  function openCognate(root: string) {
    selectedCognateRoot.value = root
    if (!isCognateEmpty.value) lastCognateQuery.value = { ...cognateConditionInput.value }
    applyCognateQuery(EMPTY_COGNATE_QUERY)
  }

  /** 从详情返回：恢复条件、选择与滚动位置（条件走统一写入入口）。 */
  function closeCognate(root?: string) {
    if (root) selectedCognateRoot.value = root
    if (lastCognateQuery.value) applyCognateQuery(lastCognateQuery.value)
  }

  function setCognateScrollTop(scrollTop: number) {
    cognateScrollTop.value = scrollTop
  }

  return {
    graph,
    selectedNode,
    searchQuery,
    selectedFamily,
    lastCognateQuery,
    cognateScrollTop,
    selectedCognateRoot,
    filteredCognates,
    isCognateEmpty,
    hasNoCognateMatch,
    canRestoreCognateQuery,
    applyCognateQuery,
    clearCognateQuery,
    restoreCognateQuery,
    openCognate,
    closeCognate,
    setCognateScrollTop,
  }
})
