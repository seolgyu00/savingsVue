<script setup>
import { ref, reactive, computed } from 'vue'
import { savingsApi } from '@/util/api/savingsApi'

const props = defineProps({
    isLoggedIn: { type: Boolean, default: false }
})

const emit = defineEmits(['go-history', 'save-requested'])

/* ── 입력 폼 ── */
const form = reactive({
    productName:   '',
    monthlyAmount: '',
    periodMonths:  '',
    annualRate:    '',
    calcMethod:    '단리',
    taxType:       '일반과세',
    customTaxRate: '',
})

/* ── 결과 ── */
const result  = ref(null)
const saving  = ref(false)
const saveMsg = ref('')   // '' | 'success' | 'error'

/* ── 세율 계산 ── */
const taxInfo = computed(() => {
    switch (form.taxType) {
        case '비과세':   return { taxRate: 0,    incomeTaxRate: 0,   localTaxRate: 0 }
        case '세금우대': return { taxRate: 9.9,  incomeTaxRate: 9,   localTaxRate: 0.9 }
        case '일반과세': return { taxRate: 15.4, incomeTaxRate: 14,  localTaxRate: 1.4 }
        case '직접입력': {
            const v = parseFloat(form.customTaxRate) || 0
            const income = Math.round((v / 1.1) * 100) / 100
            const local  = Math.round((v - income) * 100) / 100
            return { taxRate: v, incomeTaxRate: income, localTaxRate: local }
        }
        default: return { taxRate: 0, incomeTaxRate: 0, localTaxRate: 0 }
    }
})

const fmt    = (n) => Number(n).toLocaleString('ko-KR') + '원'
const fmtPct = (n) => n + '%'

/* ── 월별 이자 미리보기 (상위 3행 + 마지막 행) ── */
const monthlyRows = computed(() => {
    if (!result.value) return []
    const { periodMonths, monthlyAmount, calcMethod, annualRate } = result.value
    const monthlyRate = annualRate / 100 / 12
    const rows = []
    let cumul = 0
    for (let i = 1; i <= periodMonths; i++) {
        let interest = calcMethod === '단리'
            ? Math.floor(monthlyAmount * (periodMonths - i + 1) * monthlyRate)
            : Math.floor(monthlyAmount * (Math.pow(1 + monthlyRate, periodMonths - i + 1) - 1))
        cumul += interest
        rows.push({ round: i, principal: monthlyAmount * i, interest, cumul })
    }
    return rows
})

/* ── 계산 ── */
const calculate = () => {
    saveMsg.value = ''
    const monthly = parseInt(String(form.monthlyAmount).replace(/,/g, ''), 10)
    const period  = parseInt(form.periodMonths, 10)
    const rate    = parseFloat(form.annualRate)

    if (!form.productName.trim())                               { alert('상품명을 입력해주세요.'); return }
    if (!monthly || monthly <= 0)                               { alert('월 납입금액을 입력해주세요.'); return }
    if (!period  || period  <= 0)                               { alert('계약 기간을 입력해주세요.'); return }
    if (!rate    || rate    <= 0)                               { alert('연 이자율을 입력해주세요.'); return }
    if (form.taxType === '직접입력' && !parseFloat(form.customTaxRate)) { alert('세율을 입력해주세요.'); return }

    const monthlyRate = rate / 100 / 12
    const { taxRate, incomeTaxRate, localTaxRate } = taxInfo.value

    let interestBefore = 0
    for (let i = 1; i <= period; i++) {
        interestBefore += form.calcMethod === '단리'
            ? Math.floor(monthly * (period - i + 1) * monthlyRate)
            : Math.floor(monthly * (Math.pow(1 + monthlyRate, period - i + 1) - 1))
    }

    const principal    = monthly * period
    const preTaxAmount = principal + interestBefore
    const incomeTax    = Math.floor(interestBefore * incomeTaxRate / 100)
    const localTax     = Math.floor(interestBefore * localTaxRate  / 100)
    const taxTotal     = incomeTax + localTax
    const finalAmount  = preTaxAmount - taxTotal

    result.value = {
        productName: form.productName, monthlyAmount: monthly,
        periodMonths: period, annualRate: rate,
        calcMethod: form.calcMethod, taxType: form.taxType,
        taxRate, incomeTaxRate, localTaxRate,
        principal, interestBefore, preTaxAmount,
        incomeTax, localTax, taxTotal, finalAmount,
    }
}

/* ── 저장 실제 로직 (부모에서 로그인 확인 후 호출) ── */
const executeSave = async () => {
    if (!result.value) return
    saving.value  = true
    saveMsg.value = ''
    try {
        await savingsApi.saveCalc(result.value)
        saveMsg.value = 'success'
    } catch (e) {
        saveMsg.value = 'error'
    } finally {
        saving.value = false
    }
}

/* ── 저장 버튼 클릭: 부모에게 위임 ── */
const handleSave = () => {
    if (!result.value) return
    // 부모(SavingsView)가 로그인 여부 확인 후 executeSave 호출
    emit('save-requested', executeSave)
}

/* ── 천단위 자동 포맷 ── */
const onMonthlyInput = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    form.monthlyAmount = raw ? Number(raw).toLocaleString('ko-KR') : ''
}
</script>

<template>
    <div class="sc-page">
        <div class="sc-layout">

            <!-- 왼쪽: 입력 패널 -->
            <div class="sc-panel">
                <div class="sc-panel-title">상품 정보 입력</div>

                <div class="sc-field">
                    <label>상품명</label>
                    <input type="text" v-model="form.productName"
                           placeholder="예) KB 국민 첫 적금" maxlength="100" />
                </div>

                <div class="sc-field">
                    <label>월 납입금액</label>
                    <div class="sc-input-wrap">
                        <input type="text" :value="form.monthlyAmount"
                               @input="onMonthlyInput"
                               placeholder="300,000" style="padding-right:28px;" />
                        <span class="sc-suffix">원</span>
                    </div>
                </div>

                <div class="sc-field">
                    <label>계약 기간</label>
                    <div class="sc-input-wrap">
                        <input type="number" v-model="form.periodMonths"
                               placeholder="12" min="1" max="120" style="padding-right:40px;" />
                        <span class="sc-suffix">개월</span>
                    </div>
                </div>

                <div class="sc-field">
                    <label>연 이자율</label>
                    <div class="sc-input-wrap">
                        <input type="number" v-model="form.annualRate"
                               placeholder="3.5" min="0" step="0.01" style="padding-right:22px;" />
                        <span class="sc-suffix">%</span>
                    </div>
                </div>

                <div class="sc-field">
                    <label>이자 계산 방식</label>
                    <div class="sc-radio-group">
                        <label class="sc-radio-btn" :class="{ selected: form.calcMethod === '단리' }">
                            <input type="radio" v-model="form.calcMethod" value="단리" hidden /> 단리
                        </label>
                        <label class="sc-radio-btn" :class="{ selected: form.calcMethod === '복리' }">
                            <input type="radio" v-model="form.calcMethod" value="복리" hidden /> 복리
                        </label>
                    </div>
                </div>

                <div class="sc-field">
                    <label>과세 방식</label>
                    <div class="sc-radio-group">
                        <label v-for="t in ['비과세','세금우대','일반과세','직접입력']" :key="t"
                               class="sc-radio-btn" :class="{ selected: form.taxType === t }">
                            <input type="radio" v-model="form.taxType" :value="t" hidden />
                            {{ t }}<template v-if="t==='세금우대'"> (9.9%)</template>
                                  <template v-if="t==='일반과세'"> (15.4%)</template>
                        </label>
                    </div>

                    <div v-if="form.taxType === '일반과세'" class="sc-tax-info">
                        <div class="sc-tax-pills">
                            <span class="sc-pill">이자소득세 14%</span>
                            <span class="sc-pill">지방소득세 1.4%</span>
                            <span class="sc-pill">합산 15.4%</span>
                        </div>
                        <div class="sc-tax-auto">이자소득세 14% + 지방소득세 1.4% = <strong>15.4% 자동 적용</strong></div>
                    </div>
                    <div v-else-if="form.taxType === '세금우대'" class="sc-tax-info">
                        <div class="sc-tax-pills">
                            <span class="sc-pill">이자소득세 9%</span>
                            <span class="sc-pill">농특세 0.9%</span>
                            <span class="sc-pill">합산 9.9%</span>
                        </div>
                        <div class="sc-tax-auto"><strong>9.9% 자동 적용</strong></div>
                    </div>
                    <div v-else-if="form.taxType === '직접입력'" class="sc-tax-info">
                        <div class="sc-input-wrap">
                            <input type="number" v-model="form.customTaxRate"
                                   placeholder="세율 직접 입력 (예: 5.5)" min="0" max="100" step="0.1"
                                   style="padding-right:22px;" />
                            <span class="sc-suffix">%</span>
                        </div>
                        <div v-if="parseFloat(form.customTaxRate) > 0" class="sc-tax-pills" style="margin-top:8px;">
                            <span class="sc-pill">이자소득세 {{ (parseFloat(form.customTaxRate)/1.1).toFixed(2) }}%</span>
                            <span class="sc-pill">지방소득세 {{ (parseFloat(form.customTaxRate) - parseFloat(form.customTaxRate)/1.1).toFixed(2) }}%</span>
                            <span class="sc-pill">합산 {{ parseFloat(form.customTaxRate).toFixed(2) }}%</span>
                        </div>
                    </div>
                </div>

                <button class="sc-calc-btn" @click="calculate">계산하기</button>
            </div>

            <!-- 오른쪽: 결과 패널 -->
            <div class="sc-panel">
                <div class="sc-panel-title">계산 결과</div>

                <div v-if="!result" class="sc-empty">
                    <svg viewBox="0 0 24 24"><path d="M9 7H7a2 2 0 00-2 2v9a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-2M9 7a2 2 0 012-2h2a2 2 0 012 2M9 7h6"/></svg>
                    <p>왼쪽 입력 후 계산하기를 눌러주세요</p>
                </div>

                <template v-else>
                    <div class="sc-result-wrap">
                        <div class="sc-metric-row">
                            <div class="sc-metric">
                                <div class="sc-metric-label">납입 원금 합계</div>
                                <div class="sc-metric-value">{{ fmt(result.principal) }}</div>
                            </div>
                            <div class="sc-metric">
                                <div class="sc-metric-label">총 이자 (세전)</div>
                                <div class="sc-metric-value">+{{ fmt(result.interestBefore) }}</div>
                            </div>
                        </div>

                        <div class="sc-metric">
                            <div class="sc-metric-label">세전 만기 수령액</div>
                            <div class="sc-metric-value lg">{{ fmt(result.preTaxAmount) }}</div>
                        </div>

                        <div class="sc-metric">
                            <div class="sc-metric-label">
                                세금 차감 내역 ({{ result.taxType }}{{ result.taxRate > 0 ? ' ' + result.taxRate + '%' : '' }})
                            </div>
                            <div style="margin-top:8px;">
                                <template v-if="result.taxType === '비과세'">
                                    <div class="sc-tax-row"><span>비과세 적용</span><span>해당 없음</span></div>
                                </template>
                                <template v-else>
                                    <div class="sc-tax-row">
                                        <span>이자소득세 ({{ fmtPct(result.incomeTaxRate) }})</span>
                                        <span>-{{ fmt(result.incomeTax) }}</span>
                                    </div>
                                    <div class="sc-tax-row">
                                        <span>지방소득세 ({{ fmtPct(result.localTaxRate) }})</span>
                                        <span>-{{ fmt(result.localTax) }}</span>
                                    </div>
                                    <div class="sc-tax-row">
                                        <span>세금 합계</span><span>-{{ fmt(result.taxTotal) }}</span>
                                    </div>
                                </template>
                            </div>
                        </div>

                        <div class="sc-metric green-card">
                            <div class="sc-metric-label">세후 최종 수령액</div>
                            <div class="sc-metric-value lg green">{{ fmt(result.finalAmount) }}</div>
                            <div class="sc-metric-sub">원 미만 절사 적용</div>
                        </div>

                        <!-- 회차별 이자 미리보기 -->
                        <div class="sc-metric">
                            <div class="sc-metric-label">회차별 발생 이자</div>
                            <table class="sc-monthly-table">
                                <thead>
                                    <tr><th>회차</th><th class="right">납입 원금 누계</th><th class="right">발생 이자</th></tr>
                                </thead>
                                <tbody>
                                    <template v-for="(row, idx) in monthlyRows" :key="row.round">
                                        <tr v-if="idx < 3 || idx === monthlyRows.length - 1">
                                            <td>
                                                {{ row.round }}개월
                                                <span v-if="idx === monthlyRows.length - 1" class="sc-last-badge">만기</span>
                                            </td>
                                            <td class="right">{{ row.principal.toLocaleString() }}원</td>
                                            <td class="right">{{ row.interest.toLocaleString() }}원</td>
                                        </tr>
                                        <tr v-else-if="idx === 3 && monthlyRows.length > 4">
                                            <td colspan="3" style="color:#5c5c6e;text-align:center;padding:4px 0;">···</td>
                                        </tr>
                                    </template>
                                </tbody>
                            </table>
                        </div>

                        <!-- 저장 버튼 -->
                        <button class="sc-save-btn" :disabled="saving" @click="handleSave">
                            <template v-if="saving">저장 중...</template>
                            <template v-else-if="!isLoggedIn">
                                <svg viewBox="0 0 24 24" class="sc-lock-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                                로그인 후 저장하기
                            </template>
                            <template v-else>이 내역 저장하기</template>
                        </button>

                        <div v-if="saveMsg === 'success'" class="sc-msg success">
                            저장되었습니다.
                            <span class="sc-msg-link" @click="$emit('go-history')">내역 보기 →</span>
                        </div>
                        <div v-else-if="saveMsg === 'error'" class="sc-msg error">
                            저장에 실패했습니다. 다시 시도해주세요.
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<style scoped>
.sc-page   { padding: 2rem; }
.sc-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 980px; margin: 0 auto; }

.sc-panel {
    background: #141416; border: 1px solid rgba(255,255,255,0.10);
    border-radius: 14px; padding: 1.5rem;
}
.sc-panel-title {
    font-size: 11px; font-weight: 600; color: #5c5c6e;
    letter-spacing: 0.8px; text-transform: uppercase;
    margin-bottom: 1.25rem; padding-bottom: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
}

.sc-field { margin-bottom: 1rem; }
.sc-field label { display: block; font-size: 13px; color: #9a9aaa; margin-bottom: 5px; }
.sc-field input[type="text"],
.sc-field input[type="number"] {
    width: 100%; padding: 9px 12px; font-size: 14px;
    border: 1px solid rgba(255,255,255,0.10); border-radius: 8px;
    background: #18181c; color: #f0f0f2; font-family: inherit;
    outline: none; transition: border-color 0.15s, box-shadow 0.15s;
}
.sc-field input:focus { border-color: #1da876; box-shadow: 0 0 0 3px rgba(46,204,142,0.10); }

.sc-input-wrap { position: relative; }
.sc-suffix {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    font-size: 13px; color: #5c5c6e; pointer-events: none;
}

.sc-radio-group { display: flex; gap: 8px; flex-wrap: wrap; }
.sc-radio-btn {
    padding: 6px 14px; border: 1px solid rgba(255,255,255,0.10);
    border-radius: 20px; cursor: pointer; font-size: 13px; color: #9a9aaa;
    transition: all 0.15s; user-select: none;
}
.sc-radio-btn:hover { border-color: #1da876; color: #2ecc8e; }
.sc-radio-btn.selected { border-color: #1da876; background: rgba(46,204,142,0.12); color: #2ecc8e; font-weight: 500; }

.sc-tax-info { margin-top: 10px; }
.sc-tax-pills { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
.sc-pill { font-size: 11px; background: #1c1c20; color: #9a9aaa; padding: 3px 9px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06); }
.sc-tax-auto { font-size: 13px; color: #9a9aaa; padding: 8px 12px; background: #1c1c20; border-radius: 8px; }
.sc-tax-auto strong { color: #f0f0f2; }

.sc-calc-btn {
    width: 100%; margin-top: 1.25rem; padding: 12px;
    background: #2ecc8e; color: #0a1a12; border: none; border-radius: 8px;
    font-size: 15px; font-weight: 600; font-family: inherit;
    cursor: pointer; transition: background 0.15s, transform 0.1s;
}
.sc-calc-btn:hover  { background: #38dfa0; }
.sc-calc-btn:active { transform: scale(0.99); }

/* 결과 */
.sc-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; height: 300px; gap: 12px; color: #5c5c6e;
}
.sc-empty svg { width: 40px; height: 40px; stroke: #5c5c6e; fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.sc-empty p   { font-size: 14px; }

.sc-result-wrap { display: flex; flex-direction: column; gap: 12px; }
.sc-metric-row  { display: flex; gap: 10px; }
.sc-metric-row .sc-metric { flex: 1; }

.sc-metric {
    background: #1c1c20; border-radius: 8px;
    padding: 13px 15px; border: 1px solid rgba(255,255,255,0.06);
}
.sc-metric-label { font-size: 12px; color: #5c5c6e; margin-bottom: 5px; }
.sc-metric-value { font-size: 19px; font-weight: 600; color: #f0f0f2; }
.sc-metric-value.lg    { font-size: 24px; }
.sc-metric-value.green { color: #2ecc8e; }
.sc-metric-sub  { font-size: 11px; color: #5c5c6e; margin-top: 3px; }
.green-card { background: rgba(46,204,142,0.12); border: 1px solid rgba(46,204,142,0.22); }
.green-card .sc-metric-label { color: #2ecc8e; opacity: 0.8; }

.sc-tax-row {
    display: flex; justify-content: space-between; font-size: 13px;
    padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.06); color: #9a9aaa;
}
.sc-tax-row:last-child { border: none; }
.sc-tax-row span:last-child { color: #f0f0f2; font-weight: 500; }

.sc-monthly-table { width: 100%; font-size: 12px; border-collapse: collapse; margin-top: 6px; }
.sc-monthly-table th { text-align: left; color: #5c5c6e; font-weight: 500; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 11px; }
.sc-monthly-table td { padding: 5px 0; color: #f0f0f2; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 12px; }
.sc-monthly-table tr:last-child td { border: none; }
.sc-monthly-table .right { text-align: right; }
.sc-last-badge { font-size: 10px; color: #2ecc8e; margin-left: 4px; }

/* 저장 버튼 */
.sc-save-btn {
    width: 100%; padding: 11px;
    border: 1px solid #1da876; color: #2ecc8e; background: transparent;
    border-radius: 8px; font-size: 14px; font-family: inherit; font-weight: 500;
    cursor: pointer; transition: background 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
}
.sc-save-btn:hover    { background: rgba(46,204,142,0.12); }
.sc-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.sc-lock-icon {
    width: 14px; height: 14px; stroke: #2ecc8e;
    fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
}

.sc-msg { font-size: 13px; text-align: center; padding: 8px; border-radius: 6px; }
.sc-msg.success { color: #2ecc8e; background: rgba(46,204,142,0.10); }
.sc-msg.error   { color: #f87171; background: rgba(239,68,68,0.10); }
.sc-msg-link { cursor: pointer; text-decoration: underline; margin-left: 6px; }

@media (max-width: 760px) { .sc-layout { grid-template-columns: 1fr; } }
@media (max-width: 500px) { .sc-page { padding: 1rem; } }
</style>