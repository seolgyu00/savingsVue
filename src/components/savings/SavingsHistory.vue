<script setup>
import { ref, computed, onMounted } from 'vue'
import { savingsApi } from '@/util/api/savingsApi'

const emit = defineEmits(['go-detail', 'go-calc'])

const list       = ref([])
const totalCount = ref(0)
const loading    = ref(false)

// 검색 필터 (클라이언트 사이드 - 한 페이지 내)
const filter = ref({ name: '', period: '', amount: '', tax: '', method: '' })
const activeTags = ref([])

// 페이징
const pageSize    = 9
const currentPage = ref(1)
const totalPage   = ref(0)

const fetchList = async (page = 1) => {
    loading.value = true
    try {
        const res = await savingsApi.getList({ pageNo: page, pageSize })
        list.value       = res.list || []
        totalCount.value = res.totalCount || 0
        totalPage.value  = res.totalPage  || 0
        currentPage.value = res.pageNo    || 1
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

onMounted(() => fetchList())

// 클라이언트 필터 적용
const filteredList = computed(() => {
    return list.value.filter(item => {
        const f = filter.value
        return (
            (!f.name   || item.productName.toLowerCase().includes(f.name.toLowerCase())) &&
            (!f.period || String(item.periodMonths) === String(f.period)) &&
            (!f.amount || String(item.monthlyAmount) === String(f.amount)) &&
            (!f.tax    || item.taxType === f.tax) &&
            (!f.method || item.calcMethod === f.method)
        )
    })
})

const applyFilter = () => {
    const f = filter.value
    activeTags.value = [
        f.name   ? { key: 'name',   label: `상품명: ${f.name}` }          : null,
        f.period ? { key: 'period', label: `기간: ${f.period}개월` }       : null,
        f.amount ? { key: 'amount', label: `납입: ${Number(f.amount).toLocaleString()}원` } : null,
        f.tax    ? { key: 'tax',    label: `과세: ${f.tax}` }              : null,
        f.method ? { key: 'method', label: `방식: ${f.method}` }           : null,
    ].filter(Boolean)
}

const clearTag = (key) => {
    filter.value[key] = ''
    applyFilter()
}

const resetFilter = () => {
    filter.value = { name: '', period: '', amount: '', tax: '', method: '' }
    activeTags.value = []
}

const deleteCalc = async (calcId, e) => {
    e.stopPropagation()
    if (!confirm('이 내역을 삭제하시겠습니까?')) return
    try {
        await savingsApi.deleteCalc(calcId)
        await fetchList(currentPage.value)
    } catch (err) {
        alert('삭제에 실패했습니다.')
    }
}

const changePage = (p) => {
    if (p < 1 || p > totalPage.value) return
    fetchList(p)
}

const fmt = (n) => Number(n).toLocaleString('ko-KR') + '원'
</script>

<template>
    <div class="sh-page">
        <div class="sh-wrapper">

            <!-- 검색 & 필터 -->
            <div class="sh-search-bar">
                <div class="sh-search-title">
                    <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    검색 &amp; 필터
                </div>
                <div class="sh-search-fields">
                    <div class="sh-sf">
                        <label>상품명</label>
                        <input type="text" v-model="filter.name" placeholder="상품명 검색..." />
                    </div>
                    <div class="sh-sf">
                        <label>계약 기간 (개월)</label>
                        <input type="number" v-model="filter.period" placeholder="예) 12" min="1" />
                    </div>
                    <div class="sh-sf">
                        <label>월 납입 (원)</label>
                        <input type="number" v-model="filter.amount" placeholder="예) 300000" min="0" />
                    </div>
                    <div class="sh-sf">
                        <label>과세 방식</label>
                        <select v-model="filter.tax">
                            <option value="">전체</option>
                            <option value="비과세">비과세</option>
                            <option value="세금우대">세금우대</option>
                            <option value="일반과세">일반과세</option>
                            <option value="직접입력">직접입력</option>
                        </select>
                    </div>
                    <div class="sh-sf">
                        <label>이자 계산 방식</label>
                        <select v-model="filter.method">
                            <option value="">전체</option>
                            <option value="단리">단리</option>
                            <option value="복리">복리</option>
                        </select>
                    </div>
                    <div class="sh-search-actions">
                        <button class="sh-btn-search" @click="applyFilter">검색</button>
                        <button class="sh-btn-reset"  @click="resetFilter">초기화</button>
                    </div>
                </div>
            </div>

            <!-- 헤더 -->
            <div class="sh-header">
                <h2>나의 적금 내역</h2>
                <div class="sh-header-meta">
                    <span class="sh-count">총 <strong>{{ filteredList.length }}</strong>건</span>
                    <div class="sh-active-tags">
                        <span v-for="tag in activeTags" :key="tag.key" class="sh-tag">
                            {{ tag.label }}
                            <span class="sh-tag-x" @click="clearTag(tag.key)">×</span>
                        </span>
                    </div>
                </div>
            </div>

            <!-- 로딩 -->
            <div v-if="loading" class="sh-loading">불러오는 중...</div>

            <!-- 빈 상태 -->
            <div v-else-if="filteredList.length === 0" class="sh-empty">
                <p>{{ list.length === 0 ? '저장된 적금 내역이 없습니다.' : '검색 조건에 맞는 내역이 없습니다.' }}</p>
                <button v-if="list.length === 0" class="sh-btn-search" style="margin-top:1rem;" @click="$emit('go-calc')">
                    계산하러 가기
                </button>
            </div>

            <!-- 카드 그리드 -->
            <div v-else class="sh-grid">
                <div v-for="item in filteredList" :key="item.calcId"
                     class="sh-card" @click="$emit('go-detail', item.calcId)">
                    <div class="sh-card-top">
                        <div>
                            <div class="sh-card-name">{{ item.productName }}</div>
                            <div class="sh-card-date">{{ item.savedAt }} 저장</div>
                        </div>
                        <span class="sh-card-badge">{{ item.calcMethod }}</span>
                    </div>

                    <div class="sh-card-stats">
                        <div class="sh-stat"><div class="sh-stat-label">월 납입</div><div class="sh-stat-val">{{ item.monthlyAmount.toLocaleString() }}원</div></div>
                        <div class="sh-stat"><div class="sh-stat-label">계약 기간</div><div class="sh-stat-val">{{ item.periodMonths }}개월</div></div>
                        <div class="sh-stat"><div class="sh-stat-label">연 이자율</div><div class="sh-stat-val">{{ item.annualRate }}%</div></div>
                        <div class="sh-stat"><div class="sh-stat-label">과세 방식</div><div class="sh-stat-val">{{ item.taxType }}</div></div>
                    </div>

                    <div class="sh-card-final">
                        <span class="sh-final-label">세후 최종 수령액</span>
                        <span class="sh-final-val">{{ fmt(item.finalAmount) }}</span>
                    </div>

                    <div class="sh-card-actions">
                        <button class="sh-card-btn" @click.stop="$emit('go-detail', item.calcId)">상세보기</button>
                        <button class="sh-card-btn" @click.stop="$emit('go-calc')">다시 계산</button>
                        <button class="sh-card-btn del" @click="deleteCalc(item.calcId, $event)">삭제</button>
                    </div>
                </div>
            </div>

            <!-- 페이징 -->
            <div v-if="totalPage > 1" class="sh-pagination">
                <button @click="changePage(1)"              :disabled="currentPage === 1">≪</button>
                <button @click="changePage(currentPage-1)"  :disabled="currentPage === 1">&lt;</button>
                <button v-for="p in totalPage" :key="p"
                        :class="{ active: p === currentPage }"
                        @click="changePage(p)">{{ p }}</button>
                <button @click="changePage(currentPage+1)"  :disabled="currentPage === totalPage">&gt;</button>
                <button @click="changePage(totalPage)"      :disabled="currentPage === totalPage">≫</button>
            </div>

        </div>
    </div>
</template>

<style scoped>
.sh-page    { padding: 2rem; }
.sh-wrapper { max-width: 1020px; margin: 0 auto; }

.sh-search-bar {
    background: #141416; border: 1px solid rgba(255,255,255,0.10);
    border-radius: 14px; padding: 1.25rem 1.5rem; margin-bottom: 1.25rem;
}
.sh-search-title {
    display: flex; align-items: center; gap: 6px;
    font-size: 13px; font-weight: 500; color: #9a9aaa; margin-bottom: 12px;
}
.sh-search-title svg { width: 14px; height: 14px; stroke: #9a9aaa; fill: none; stroke-width: 2; stroke-linecap: round; }

.sh-search-fields {
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
    gap: 10px; align-items: end;
}
.sh-sf label { display: block; font-size: 12px; color: #5c5c6e; margin-bottom: 5px; }
.sh-sf input,
.sh-sf select {
    width: 100%; padding: 8px 10px; font-size: 13px;
    border: 1px solid rgba(255,255,255,0.10); border-radius: 8px;
    background: #18181c; color: #f0f0f2; font-family: inherit;
    outline: none; transition: border-color 0.15s;
    appearance: none; -webkit-appearance: none;
}
.sh-sf select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235c5c6e' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px; cursor: pointer;
}
.sh-sf select option { background: #1c1c20; }
.sh-sf input:focus, .sh-sf select:focus { border-color: #1da876; box-shadow: 0 0 0 3px rgba(46,204,142,0.10); }

.sh-search-actions { display: flex; gap: 6px; }
.sh-btn-search {
    padding: 8px 18px; background: #2ecc8e; color: #0a1a12;
    border: none; border-radius: 8px; font-size: 13px; font-weight: 600;
    font-family: inherit; cursor: pointer; white-space: nowrap; transition: background 0.15s;
}
.sh-btn-search:hover { background: #38dfa0; }
.sh-btn-reset {
    padding: 8px 14px; background: transparent; color: #9a9aaa;
    border: 1px solid rgba(255,255,255,0.16); border-radius: 8px;
    font-size: 13px; font-family: inherit; cursor: pointer; transition: background 0.15s;
}
.sh-btn-reset:hover { background: #1c1c20; }

.sh-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 8px; }
.sh-header h2 { font-size: 18px; font-weight: 600; color: #f0f0f2; }
.sh-header-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.sh-count { font-size: 13px; color: #9a9aaa; }
.sh-count strong { color: #2ecc8e; }

.sh-active-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.sh-tag {
    font-size: 11px; background: rgba(46,204,142,0.12); color: #2ecc8e;
    padding: 3px 10px; border-radius: 12px; border: 1px solid rgba(46,204,142,0.25);
    display: flex; align-items: center; gap: 5px;
}
.sh-tag-x { cursor: pointer; font-size: 14px; line-height: 1; color: #1da876; }
.sh-tag-x:hover { color: #2ecc8e; }

.sh-loading { text-align: center; padding: 4rem; color: #5c5c6e; font-size: 14px; }
.sh-empty   { text-align: center; padding: 4rem; color: #5c5c6e; font-size: 14px; }

.sh-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 16px;
}

.sh-card {
    background: #141416; border: 1px solid rgba(255,255,255,0.10);
    border-radius: 14px; padding: 1.25rem; cursor: pointer;
    transition: border-color 0.2s, transform 0.2s, background 0.2s;
}
.sh-card:hover { border-color: #1da876; transform: translateY(-2px); background: #1c1c20; }

.sh-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
.sh-card-name { font-size: 15px; font-weight: 500; color: #f0f0f2; }
.sh-card-date { font-size: 11px; color: #5c5c6e; margin-top: 3px; }
.sh-card-badge {
    font-size: 11px; padding: 3px 10px; border-radius: 12px;
    background: rgba(46,204,142,0.12); color: #2ecc8e; font-weight: 500;
    white-space: nowrap; border: 1px solid rgba(46,204,142,0.20);
}

.sh-card-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
.sh-stat { background: #1c1c20; border-radius: 8px; padding: 8px 10px; border: 1px solid rgba(255,255,255,0.06); }
.sh-stat-label { font-size: 11px; color: #5c5c6e; margin-bottom: 3px; }
.sh-stat-val   { font-size: 13px; font-weight: 500; color: #f0f0f2; }

.sh-card-final {
    background: rgba(46,204,142,0.12); border-radius: 8px; padding: 10px 12px;
    display: flex; justify-content: space-between; align-items: center;
    border: 1px solid rgba(46,204,142,0.18);
}
.sh-final-label { font-size: 12px; color: #2ecc8e; opacity: 0.8; }
.sh-final-val   { font-size: 16px; font-weight: 600; color: #2ecc8e; }

.sh-card-actions { display: flex; gap: 6px; margin-top: 10px; }
.sh-card-btn {
    flex: 1; padding: 7px; font-size: 12px;
    border: 1px solid rgba(255,255,255,0.16); border-radius: 8px;
    background: transparent; color: #9a9aaa; cursor: pointer;
    font-family: inherit; transition: background 0.15s;
}
.sh-card-btn:hover { background: #1c1c20; color: #f0f0f2; }
.sh-card-btn.del   { border-color: rgba(239,68,68,0.30); color: #f87171; }
.sh-card-btn.del:hover { background: rgba(239,68,68,0.12); }

.sh-pagination {
    display: flex; justify-content: center; gap: 4px;
    margin-top: 2rem; flex-wrap: wrap;
}
.sh-pagination button {
    width: 36px; height: 36px; border-radius: 8px; font-size: 13px;
    border: 1px solid rgba(255,255,255,0.10); background: transparent;
    color: #9a9aaa; cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.sh-pagination button:hover:not(:disabled) { background: #1c1c20; color: #f0f0f2; }
.sh-pagination button.active { background: rgba(46,204,142,0.12); border-color: #1da876; color: #2ecc8e; font-weight: 600; }
.sh-pagination button:disabled { opacity: 0.3; cursor: not-allowed; }

@media (max-width: 760px) { .sh-search-fields { grid-template-columns: 1fr 1fr; } }
@media (max-width: 500px) { .sh-page { padding: 1rem; } .sh-search-fields { grid-template-columns: 1fr; } }
</style>
