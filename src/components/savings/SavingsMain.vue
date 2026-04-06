<script setup>
defineProps({
    isLoggedIn: { type: Boolean, default: false }
})
defineEmits(['go-calc', 'go-history', 'open-login'])
</script>

<template>
    <div class="sm-page">
        <div class="sm-hero">
            <div class="sm-badge">세금까지 정확하게</div>

            <h1>내 적금, 실제로<br><em>얼마나 받을까?</em></h1>

            <p>월 납입금, 이자율, 세금 방식까지 반영해<br>만기 수령액을 정확히 계산해드립니다.</p>

            <!-- 히어로 카드 -->
            <div class="sm-cards">
                <div class="sm-card" @click="$emit('go-calc')">
                    <div class="sm-card-icon">
                        <svg viewBox="0 0 24 24">
                            <rect x="4" y="4" width="16" height="16" rx="2"/>
                            <path d="M8 12h8M12 8v8"/>
                        </svg>
                    </div>
                    <h3>적금 계산하기</h3>
                    <p>단리/복리, 과세 방식 선택 후 세후 수령액 계산</p>
                </div>

                <div class="sm-card" @click="$emit('go-history')">
                    <div class="sm-card-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        </svg>
                    </div>
                    <h3>나의 적금 내역</h3>
                    <p>저장한 계산 결과를 모아보고 비교</p>
                    <!-- 미로그인 안내 뱃지 -->
                    <span v-if="!isLoggedIn" class="sm-login-required">로그인 필요</span>
                </div>
            </div>

            <!-- 로그인 유도 배너 (미로그인 시) -->
            <div v-if="!isLoggedIn" class="sm-login-banner">
                <div class="sm-login-banner-text">
                    <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span>계산 결과 저장 및 내역 조회는 <strong>로그인</strong> 후 이용 가능합니다.</span>
                </div>
                <button class="sm-login-btn" @click="$emit('open-login')">로그인하기</button>
            </div>

            <!-- 스탯 -->
            <div class="sm-stats">
                <div class="sm-stat">
                    <div class="sm-stat-num">단리 / 복리</div>
                    <div class="sm-stat-label">이자 계산 방식</div>
                </div>
                <div class="sm-stat">
                    <div class="sm-stat-num">3가지</div>
                    <div class="sm-stat-label">과세 방식 지원</div>
                </div>
                <div class="sm-stat">
                    <div class="sm-stat-num">원 단위</div>
                    <div class="sm-stat-label">절사 계산</div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.sm-page { padding: 2rem; }

.sm-hero {
    max-width: 700px; margin: 5rem auto 0; text-align: center;
}

.sm-badge {
    display: inline-block; font-size: 12px; font-weight: 500;
    color: #2ecc8e; background: rgba(46,204,142,0.12);
    padding: 5px 14px; border-radius: 20px; margin-bottom: 1.75rem;
    border: 1px solid rgba(46,204,142,0.25); letter-spacing: 0.3px;
}

.sm-hero h1 {
    font-size: 40px; font-weight: 600; line-height: 1.2;
    color: #f0f0f2; letter-spacing: -1px; margin-bottom: 1rem;
}
.sm-hero h1 em { font-style: normal; color: #2ecc8e; }

.sm-hero > p {
    font-size: 15px; color: #9a9aaa; line-height: 1.8; margin-bottom: 2.75rem;
}

/* 카드 */
.sm-cards {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    max-width: 540px; margin: 0 auto 1.5rem;
}
.sm-card {
    position: relative;
    background: #141416; border: 1px solid rgba(255,255,255,0.10);
    border-radius: 14px; padding: 1.5rem; text-align: left; cursor: pointer;
    transition: border-color 0.2s, transform 0.2s, background 0.2s;
}
.sm-card:hover { border-color: #1da876; transform: translateY(-3px); background: #1c1c20; }

.sm-card-icon {
    width: 38px; height: 38px; border-radius: 8px;
    background: rgba(46,204,142,0.12);
    display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;
}
.sm-card-icon svg {
    width: 18px; height: 18px; stroke: #2ecc8e;
    fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
}
.sm-card h3 { font-size: 15px; font-weight: 500; color: #f0f0f2; margin-bottom: 5px; }
.sm-card p  { font-size: 13px; color: #9a9aaa; line-height: 1.55; }

/* 로그인 필요 뱃지 */
.sm-login-required {
    position: absolute; top: 12px; right: 12px;
    font-size: 10px; padding: 2px 8px; border-radius: 10px;
    background: rgba(245,158,11,0.15); color: #f59e0b;
    border: 1px solid rgba(245,158,11,0.25); font-weight: 500;
}

/* 로그인 유도 배너 */
.sm-login-banner {
    max-width: 540px; margin: 0 auto 0;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    background: rgba(46,204,142,0.07);
    border: 1px solid rgba(46,204,142,0.18);
    border-radius: 12px; padding: 12px 16px;
}
.sm-login-banner-text {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; color: #9a9aaa; text-align: left;
}
.sm-login-banner-text svg {
    width: 15px; height: 15px; stroke: #2ecc8e; fill: none;
    stroke-width: 1.8; stroke-linecap: round; flex-shrink: 0;
}
.sm-login-banner-text strong { color: #2ecc8e; }
.sm-login-btn {
    flex-shrink: 0; padding: 6px 16px; font-size: 13px; font-weight: 600;
    background: #2ecc8e; color: #0a1a12; border: none; border-radius: 8px;
    cursor: pointer; font-family: inherit; transition: background 0.15s;
}
.sm-login-btn:hover { background: #38dfa0; }

/* 스탯 */
.sm-stats {
    display: flex; justify-content: center; gap: 3rem;
    margin-top: 3rem; padding-top: 2rem;
    border-top: 1px solid rgba(255,255,255,0.06);
}
.sm-stat { text-align: center; }
.sm-stat-num   { font-size: 18px; font-weight: 600; color: #2ecc8e; }
.sm-stat-label { font-size: 12px; color: #5c5c6e; margin-top: 4px; }

@media (max-width: 560px) {
    .sm-hero h1  { font-size: 28px; }
    .sm-cards    { grid-template-columns: 1fr; }
    .sm-stats    { gap: 1.5rem; }
    .sm-login-banner { flex-direction: column; align-items: flex-start; }
}
</style>