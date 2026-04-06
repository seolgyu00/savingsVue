<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { savingsApi } from '@/util/api/savingsApi'

const props = defineProps({ calcId: Number })
const emit  = defineEmits(['go-history', 'go-calc'])

const detail  = ref(null)
const loading = ref(false)

const fetchDetail = async (id) => {
    if (!id) return
    loading.value = true
    try {
        detail.value = await savingsApi.getDetail(id)
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

onMounted(() => fetchDetail(props.calcId))
watch(() => props.calcId, fetchDetail)

/* ── 회차별 이자 전체 계산 ── */
const monthlyRows = computed(() => {
    if (!detail.value) return []
    const { periodMonths, monthlyAmount, calcMethod, annualRate } = detail.value
    const monthlyRate = annualRate / 100 / 12
    const rows = []
    let cumul = 0

    for (let i = 1; i <= periodMonths; i++) {
        let interest
        if (calcMethod === '단리') {
            interest = Math.floor(monthlyAmount * (periodMonths - i + 1) * monthlyRate)
        } else {
            interest = Math.floor(monthlyAmount * (Math.pow(1 + monthlyRate, periodMonths - i + 1) - 1))
        }
        cumul += interest
        rows.push({ round: i, principal: monthlyAmount * i, interest, cumul })
    }
    return rows
})

/* ── 삭제 ── */
const removeCalc = async () => {
    if (!confirm('이 내역을 삭제하시겠습니까?')) return
    try {
        await savingsApi.deleteCalc(props.calcId)
        emit('go-history')
    } catch (e) {
        alert('삭제에 실패했습니다.')
    }
}

const fmt    = (n) => Number(n).toLocaleString('ko-KR') + '원'
const fmtPct = (n) => n + '%'
</script>

<template>
    <div class="sd-page">
        <div class="sd-wrapper">

            <div v-if="loading" class="sd-loading">불러오는 중...</div>

            <template v-else-if="detail">
                <!-- 뒤로가기 -->
                <button class="sd-back" @click="$emit('go-history')">
                    <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    나의 적금 내역으로 돌아가기
                </button>

                <!-- 헤더 카드 -->
                <div class="sd-header-card">
                    <div class="sd-title-block">
                        <div class="sd-product-name">{{ detail.productName }}</div>
                        <div class="sd-meta">
                            <span class="sd-tag green">{{ detail.calcMethod }}</span>
                            <span class="sd-tag">
                                {{ detail.taxType }}{{ detail.taxRate > 0 ? ` (${fmtPct(detail.taxRate)})` : '' }}
                            </span>
                            <span class="sd-tag">{{ detail.periodMonths }}개월</span>
                        </div>
                        <div class="sd-saved-at">{{ detail.savedAt }} 저장</div>
                    </div>
                    <div class="sd-final-block">
                        <div class="sd-final-label">세후 최종 수령액</div>
                        <div class="sd-final-amount">{{ fmt(detail.finalAmount) }}</div>
                        <div class="sd-final-sub">원 미만 절사 적용</div>
                    </div>
                </div>

                <!-- 요약 4칸 -->
                <div class="sd-summary">
                    <div class="sd-metric"><div class="dm-label">월 납입금액</div><div class="dm-val">{{ fmt(detail.monthlyAmount) }}</div></div>
                    <div class="sd-metric"><div class="dm-label">총 납입 원금</div><div class="dm-val">{{ fmt(detail.principal) }}</div></div>
                    <div class="sd-metric">
                        <div class="dm-label">세전 이자 합계</div>
                        <div class="dm-val">{{ fmt(detail.interestBefore) }}</div>
                        <div class="dm-sub">연 {{ fmtPct(detail.annualRate) }}</div>
                    </div>
                    <div class="sd-metric">
                        <div class="dm-label">세금 차감 합계</div>
                        <div class="dm-val" :style="detail.taxTotal > 0 ? 'color:#f87171' : ''">
                            {{ detail.taxTotal > 0 ? '-' + fmt(detail.taxTotal) : '해당 없음 (비과세)' }}
                        </div>
                        <div class="dm-sub">{{ detail.taxRate > 0 ? fmtPct(detail.taxRate) + ' 적용' : '비과세 적용' }}</div>
                    </div>
                </div>

                <!-- 2단 패널 -->
                <div class="sd-grid">
                    <!-- 상품 기본 정보 -->
                    <div class="sd-panel">
                        <div class="sd-panel-title">상품 기본 정보</div>
                        <div class="sd-info-row"><span class="ir-label">상품명</span><span class="ir-val">{{ detail.productName }}</span></div>
                        <div class="sd-info-row"><span class="ir-label">계약 기간</span><span class="ir-val">{{ detail.periodMonths }}개월</span></div>
                        <div class="sd-info-row"><span class="ir-label">월 납입금액</span><span class="ir-val">{{ fmt(detail.monthlyAmount) }}</span></div>
                        <div class="sd-info-row"><span class="ir-label">연 이자율</span><span class="ir-val green">{{ fmtPct(detail.annualRate) }}</span></div>
                        <div class="sd-info-row"><span class="ir-label">이자 계산 방식</span><span class="ir-val">{{ detail.calcMethod }}</span></div>
                        <div class="sd-info-row">
                            <span class="ir-label">과세 방식</span>
                            <span class="ir-val">{{ detail.taxType }}{{ detail.taxRate > 0 ? ` (${fmtPct(detail.taxRate)})` : '' }}</span>
                        </div>
                    </div>

                    <!-- 수령액 구성 -->
                    <div class="sd-panel">
                        <div class="sd-panel-title">수령액 구성</div>
                        <div class="sd-br-row">
                            <div class="br-dot green"></div>
                            <span class="br-label">납입 원금 합계</span>
                            <span class="br-val">{{ fmt(detail.principal) }}</span>
                        </div>
                        <div class="sd-br-row">
                            <div class="br-dot amber"></div>
                            <span class="br-label">세전 이자 합계</span>
                            <span class="br-val">+{{ fmt(detail.interestBefore) }}</span>
                        </div>
                        <div class="sd-br-row">
                            <div class="br-dot gray"></div>
                            <span class="br-label">세전 만기 수령액</span>
                            <span class="br-val">{{ fmt(detail.preTaxAmount) }}</span>
                        </div>
                        <template v-if="detail.taxType !== '비과세'">
                            <div class="sd-br-row">
                                <div class="br-dot red"></div>
                                <span class="br-label">이자소득세 ({{ fmtPct(detail.incomeTaxRate) }})</span>
                                <span class="br-val red">-{{ fmt(detail.incomeTax) }}</span>
                            </div>
                            <div class="sd-br-row">
                                <div class="br-dot red"></div>
                                <span class="br-label">지방소득세 ({{ fmtPct(detail.localTaxRate) }})</span>
                                <span class="br-val red">-{{ fmt(detail.localTax) }}</span>
                            </div>
                        </template>
                        <div class="sd-br-row final">
                            <div class="br-dot green"></div>
                            <span class="br-label final-label">세후 최종 수령액</span>
                            <span class="br-val green large">{{ fmt(detail.finalAmount) }}</span>
                        </div>
                    </div>
                </div>

                <!-- 회차별 이자 전체 테이블 -->
                <div class="sd-table-panel">
                    <div class="sd-panel-title">회차별 발생 이자 상세</div>
                    <table class="sd-full-table">
                        <thead>
                            <tr>
                                <th>회차</th>
                                <th>납입 원금 누계</th>
                                <th>월 발생 이자</th>
                                <th>이자 누계</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(row, idx) in monthlyRows" :key="row.round"
                                :class="{ 'last-row': idx === monthlyRows.length - 1 }">
                                <td>
                                    <span class="round-num">{{ row.round }}</span>
                                    <span v-if="idx === monthlyRows.length - 1" class="mature-badge">만기</span>
                                </td>
                                <td>{{ row.principal.toLocaleString() }}원</td>
                                <td :style="idx === monthlyRows.length - 1 ? '' : 'color:#9a9aaa'">
                                    {{ row.interest.toLocaleString() }}원
                                </td>
                                <td style="color:#2ecc8e;">{{ row.cumul.toLocaleString() }}원</td>
                            </tr>
                            <!-- 합계 행 -->
                            <tr class="sum-row">
                                <td colspan="2" style="color:#9a9aaa;font-size:13px;">합계</td>
                                <td>{{ detail.interestBefore.toLocaleString() }}원</td>
                                <td style="color:#2ecc8e;">{{ detail.interestBefore.toLocaleString() }}원</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- 하단 액션 -->
                <div class="sd-actions">
                    <button class="sd-action primary" @click="$emit('go-calc')">이 조건으로 다시 계산</button>
                    <button class="sd-action ghost"   @click="$emit('go-history')">목록으로</button>
                    <button class="sd-action danger"  @click="removeCalc">이 내역 삭제</button>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.sd-page    { padding: 2rem; }
.sd-wrapper { max-width: 780px; margin: 0 auto; }
.sd-loading { text-align: center; padding: 4rem; color: #5c5c6e; font-size: 14px; }

.sd-back {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13px; color: #9a9aaa; cursor: pointer;
    padding: 6px 0; margin-bottom: 1.5rem;
    background: none; border: none; font-family: inherit;
    transition: color 0.15s;
}
.sd-back:hover { color: #2ecc8e; }
.sd-back svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

/* 헤더 카드 */
.sd-header-card {
    background: #141416; border: 1px solid rgba(255,255,255,0.10);
    border-radius: 14px; padding: 1.75rem 2rem; margin-bottom: 16px;
    display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem;
}
.sd-product-name { font-size: 22px; font-weight: 600; color: #f0f0f2; letter-spacing: -0.3px; margin-bottom: 6px; }
.sd-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.sd-tag {
    font-size: 12px; padding: 3px 12px; border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.10); color: #9a9aaa; background: #1c1c20;
}
.sd-tag.green { background: rgba(46,204,142,0.12); color: #2ecc8e; border-color: rgba(46,204,142,0.25); }
.sd-saved-at  { font-size: 12px; color: #5c5c6e; margin-top: 8px; }

.sd-final-block   { text-align: right; flex-shrink: 0; }
.sd-final-label   { font-size: 12px; color: #5c5c6e; margin-bottom: 4px; }
.sd-final-amount  { font-size: 28px; font-weight: 600; color: #2ecc8e; letter-spacing: -0.5px; }
.sd-final-sub     { font-size: 11px; color: #5c5c6e; margin-top: 4px; }

/* 요약 */
.sd-summary {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 12px; margin-bottom: 16px;
}
.sd-metric {
    background: #141416; border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px; padding: 14px 16px;
}
.dm-label { font-size: 12px; color: #5c5c6e; margin-bottom: 6px; }
.dm-val   { font-size: 17px; font-weight: 600; color: #f0f0f2; }
.dm-sub   { font-size: 11px; color: #5c5c6e; margin-top: 3px; }

/* 2단 패널 */
.sd-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.sd-panel { background: #141416; border: 1px solid rgba(255,255,255,0.10); border-radius: 14px; padding: 1.25rem 1.5rem; }
.sd-panel-title {
    font-size: 11px; font-weight: 600; color: #5c5c6e;
    letter-spacing: 0.8px; text-transform: uppercase;
    margin-bottom: 1rem; padding-bottom: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
}

.sd-info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
.sd-info-row:last-child { border: none; }
.ir-label { font-size: 13px; color: #9a9aaa; }
.ir-val   { font-size: 13px; font-weight: 500; color: #f0f0f2; }
.ir-val.green { color: #2ecc8e; }

.sd-br-row {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
}
.sd-br-row:last-child { border: none; }
.sd-br-row.final { border-top: 1px solid rgba(255,255,255,0.16); margin-top: 4px; padding-top: 14px; }
.br-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.br-dot.green { background: #2ecc8e; }
.br-dot.amber { background: #f59e0b; }
.br-dot.gray  { background: rgba(255,255,255,0.24); }
.br-dot.red   { background: #f87171; }
.br-label { font-size: 13px; color: #9a9aaa; flex: 1; }
.br-label.final-label { font-weight: 600; color: #f0f0f2; }
.br-val { font-size: 14px; font-weight: 600; color: #f0f0f2; }
.br-val.green { color: #2ecc8e; }
.br-val.red   { color: #f87171; }
.br-val.large { font-size: 16px; }

/* 회차 테이블 */
.sd-table-panel {
    background: #141416; border: 1px solid rgba(255,255,255,0.10);
    border-radius: 14px; padding: 1.25rem 1.5rem; margin-bottom: 16px;
    max-height: 460px; overflow-y: auto;
}
.sd-table-panel::-webkit-scrollbar { width: 4px; }
.sd-table-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 2px; }

.sd-full-table { width: 100%; font-size: 13px; border-collapse: collapse; }
.sd-full-table thead th {
    text-align: left; font-size: 11px; font-weight: 600; color: #5c5c6e;
    letter-spacing: 0.5px; text-transform: uppercase;
    padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.06);
}
.sd-full-table thead th:not(:first-child) { text-align: right; }
.sd-full-table tbody td { padding: 9px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #f0f0f2; }
.sd-full-table tbody td:not(:first-child) { text-align: right; }
.sd-full-table tbody tr:hover td { background: #222228; }
.sd-full-table tbody tr.last-row td { font-weight: 600; }
.sd-full-table tbody tr.sum-row td  { border-top: 1px solid rgba(255,255,255,0.06); font-weight: 600; background: #1c1c20; }

.round-num {
    display: inline-flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border-radius: 50%;
    background: #1c1c20; font-size: 11px; font-weight: 600;
    color: #9a9aaa; border: 1px solid rgba(255,255,255,0.06);
}
.mature-badge { font-size: 10px; color: #2ecc8e; margin-left: 4px; }

/* 하단 액션 */
.sd-actions { display: flex; gap: 10px; }
.sd-action {
    flex: 1; padding: 13px; border-radius: 8px;
    font-size: 14px; font-weight: 500; font-family: inherit; cursor: pointer; transition: all 0.15s;
}
.sd-action.primary { background: #2ecc8e; color: #0a1a12; border: none; font-weight: 600; }
.sd-action.primary:hover { background: #38dfa0; }
.sd-action.ghost { background: transparent; border: 1px solid rgba(255,255,255,0.16); color: #9a9aaa; }
.sd-action.ghost:hover { background: #1c1c20; color: #f0f0f2; }
.sd-action.danger { background: transparent; border: 1px solid rgba(239,68,68,0.30); color: #f87171; }
.sd-action.danger:hover { background: rgba(239,68,68,0.12); }

@media (max-width: 760px) {
    .sd-grid { grid-template-columns: 1fr; }
    .sd-summary { grid-template-columns: 1fr 1fr; }
    .sd-header-card { flex-direction: column; }
    .sd-final-block { text-align: left; }
}
@media (max-width: 500px) {
    .sd-page { padding: 1rem; }
    .sd-actions { flex-direction: column; }
}
</style>
