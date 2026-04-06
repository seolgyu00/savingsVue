<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import SavingsMain       from '@/components/savings/SavingsMain.vue'
import SavingsCalc       from '@/components/savings/SavingsCalc.vue'
import SavingsHistory    from '@/components/savings/SavingsHistory.vue'
import SavingsDetail     from '@/components/savings/SavingsDetail.vue'
import SavingsLoginModal from '@/components/savings/SavingsLoginModal.vue'

const authStore  = useAuthStore()
const isLoggedIn = computed(() => authStore.isAuthenticated)
const username   = computed(() => authStore.auth.username)

// ── 화면 상태 ──────────────────────────────────────
const screen         = ref('main')   // main | calc | history | detail
const selectedCalcId = ref(null)

// ── 로그인 모달 ────────────────────────────────────
const showModal     = ref(false)
const modalHint     = ref('')        // 'save' | 'history' | ''
const pendingAction = ref(null)      // 로그인 성공 후 실행할 함수

const openModal = (hint = '', afterLogin = null) => {
    modalHint.value     = hint
    pendingAction.value = afterLogin
    showModal.value     = true
}

const onLoginSuccess = () => {
    showModal.value = false
    if (pendingAction.value) {
        pendingAction.value()
        pendingAction.value = null
    }
}

const onModalClose = () => {
    showModal.value     = false
    pendingAction.value = null
}

// ── 로그아웃 ───────────────────────────────────────
const handleLogout = () => {
    authStore.logout()
    screen.value = 'main'
}

// ── 화면 전환 ──────────────────────────────────────
const goMain = () => {
    screen.value = 'main'
    window.scrollTo(0, 0)
}

const goCalc = () => {
    screen.value = 'calc'
    window.scrollTo(0, 0)
}

// 내역: 로그인 필수
const goHistory = () => {
    if (!isLoggedIn.value) {
        openModal('history', () => {
            screen.value = 'history'
            window.scrollTo(0, 0)
        })
        return
    }
    screen.value = 'history'
    window.scrollTo(0, 0)
}

const goDetail = (calcId) => {
    selectedCalcId.value = calcId
    screen.value = 'detail'
    window.scrollTo(0, 0)
}

// SavingsCalc에서 저장 시도 → 미로그인이면 모달 띄우고, 로그인 후 저장 콜백 실행
const onSaveRequested = (saveCallback) => {
    if (!isLoggedIn.value) {
        openModal('save', saveCallback)
    } else {
        saveCallback()
    }
}
</script>

<template>
    <!-- ── 전용 NAV (기존 글로벌 Header 대체) ── -->
    <nav class="sv-nav">
        <div class="sv-nav-logo" @click="goMain">
            적금<span>계산기</span>
        </div>

        <div class="sv-nav-center">
            <button class="sv-nav-link" :class="{ 'sv-active': screen === 'main' }"
                    @click="goMain">홈</button>
            <button class="sv-nav-link" :class="{ 'sv-active': screen === 'calc' }"
                    @click="goCalc">적금 계산하기</button>
            <button class="sv-nav-link"
                    :class="{ 'sv-active': screen === 'history' || screen === 'detail' }"
                    @click="goHistory">나의 적금 내역</button>
        </div>

        <div class="sv-nav-right">
            <!-- 미로그인 -->
            <template v-if="!isLoggedIn">
                <button class="sv-btn-login" @click="openModal('')">로그인</button>
            </template>
            <!-- 로그인 후 -->
            <template v-else>
                <span class="sv-username">{{ username }}님</span>
                <button class="sv-btn-logout" @click="handleLogout">로그아웃</button>
            </template>
        </div>
    </nav>

    <!-- ── 화면 본문 ── -->
    <div class="sv-body">
        <SavingsMain
            v-if="screen === 'main'"
            :is-logged-in="isLoggedIn"
            @go-calc="goCalc"
            @go-history="goHistory"
            @open-login="openModal('')"
        />

        <SavingsCalc
            v-if="screen === 'calc'"
            :is-logged-in="isLoggedIn"
            @go-history="goHistory"
            @save-requested="onSaveRequested"
        />

        <SavingsHistory
            v-if="screen === 'history'"
            @go-detail="goDetail"
            @go-calc="goCalc"
        />

        <SavingsDetail
            v-if="screen === 'detail'"
            :calc-id="selectedCalcId"
            @go-history="goHistory"
            @go-calc="goCalc"
        />
    </div>

    <!-- ── 로그인 모달 ── -->
    <SavingsLoginModal
        :show="showModal"
        :redirect-hint="modalHint"
        @close="onModalClose"
        @login-success="onLoginSuccess"
    />
</template>

<style scoped>
.sv-nav, .sv-body {
    --sv-bg-elevated:    #1c1c20;
    --sv-border-subtle:  rgba(255,255,255,0.06);
    --sv-border-default: rgba(255,255,255,0.10);
    --sv-border-medium:  rgba(255,255,255,0.16);
    --sv-border-strong:  rgba(255,255,255,0.24);
    --sv-green-bright:   #2ecc8e;
    --sv-green-dim:      rgba(46,204,142,0.12);
    --sv-font:           'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
}

/* NAV */
.sv-nav {
    position: sticky; top: 0; z-index: 500;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 2rem; height: 56px;
    background: rgba(13,13,15,0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--sv-border-subtle);
    font-family: var(--sv-font);
}

.sv-nav-logo {
    font-size: 17px; font-weight: 600;
    color: #f0f0f2; letter-spacing: -0.3px; cursor: pointer;
    flex-shrink: 0; user-select: none;
}
.sv-nav-logo span { color: #2ecc8e; }

.sv-nav-center { display: flex; align-items: center; gap: 2px; }

.sv-nav-link {
    font-size: 14px; color: #9a9aaa; cursor: pointer;
    padding: 6px 12px; border-radius: 8px;
    border: none; background: transparent;
    font-family: inherit; font-weight: 400; white-space: nowrap;
    transition: background 0.15s, color 0.15s;
}
.sv-nav-link:hover { background: #1c1c20; color: #f0f0f2; }
.sv-active {
    color: #2ecc8e !important;
    background: rgba(46,204,142,0.12) !important;
    font-weight: 500 !important;
}

.sv-nav-right {
    display: flex; align-items: center;
    gap: 10px; flex-shrink: 0;
}

/* 로그인 버튼 */
.sv-btn-login {
    font-size: 13px; padding: 7px 18px;
    border: 1px solid rgba(255,255,255,0.16); border-radius: 8px;
    background: transparent; color: #f0f0f2; cursor: pointer;
    font-family: inherit; font-weight: 500;
    transition: background 0.15s, border-color 0.15s;
}
.sv-btn-login:hover {
    background: #1c1c20;
    border-color: rgba(255,255,255,0.24);
}

/* 로그인 후 */
.sv-username {
    font-size: 13px; color: #2ecc8e; font-weight: 500;
}
.sv-btn-logout {
    font-size: 12px; padding: 5px 14px;
    border: 1px solid rgba(255,255,255,0.10); border-radius: 8px;
    background: transparent; color: #9a9aaa; cursor: pointer;
    font-family: inherit;
    transition: background 0.15s, color 0.15s;
}
.sv-btn-logout:hover { background: #1c1c20; color: #f0f0f2; }

/* BODY */
.sv-body {
    min-height: calc(100vh - 56px);
    background: #0d0d0f;
    font-family: var(--sv-font);
    color: #f0f0f2;
}

/* 반응형 */
@media (max-width: 640px) {
    .sv-nav { padding: 0 1rem; }
    .sv-nav-link { font-size: 13px; padding: 6px 8px; }
    .sv-username { display: none; }
}
</style>