<script setup>
import { reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import http from '@/util/http'

const props = defineProps({
    show: { type: Boolean, default: false },
    // 로그인 후 이동할 화면 힌트 (history | save)
    redirectHint: { type: String, default: '' }
})

const emit = defineEmits(['close', 'login-success'])

const authStore = useAuthStore()

const form = reactive({ login_id: '', password: '' })
const errorMsg = ref('')
const loading  = ref(false)

const handleLogin = async () => {
    errorMsg.value = ''
    loading.value  = true
    try {
        const response = await http.post('/auth/login', form)
        authStore.login(response)
        form.login_id = ''
        form.password = ''
        emit('login-success')   // 부모에서 화면 전환 처리
    } catch (e) {
        errorMsg.value = '아이디 또는 비밀번호를 확인하세요.'
    } finally {
        loading.value = false
    }
}

const handleClose = () => {
    form.login_id = ''
    form.password = ''
    errorMsg.value = ''
    emit('close')
}
</script>

<template>
    <Teleport to="body">
        <Transition name="slm-fade">
            <div v-if="show" class="slm-backdrop" @click.self="handleClose">
                <div class="slm-modal">

                    <!-- 닫기 -->
                    <button class="slm-close" @click="handleClose">
                        <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>

                    <!-- 헤더 -->
                    <div class="slm-header">
                        <div class="slm-icon">
                            <svg viewBox="0 0 24 24"><path d="M12 2a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5m0 12c5.33 0 8 2.67 8 4v2H4v-2c0-1.33 2.67-4 8-4z"/></svg>
                        </div>
                        <h2>로그인</h2>
                        <p v-if="redirectHint === 'save'">계산 결과를 저장하려면 로그인이 필요합니다.</p>
                        <p v-else-if="redirectHint === 'history'">적금 내역을 조회하려면 로그인이 필요합니다.</p>
                        <p v-else>서비스 이용을 위해 로그인해 주세요.</p>
                    </div>

                    <!-- 폼 -->
                    <form @submit.prevent="handleLogin" class="slm-form">
                        <div class="slm-field">
                            <label>아이디</label>
                            <input type="text" v-model="form.login_id"
                                   placeholder="아이디를 입력하세요" required
                                   autocomplete="username" />
                        </div>
                        <div class="slm-field">
                            <label>비밀번호</label>
                            <input type="password" v-model="form.password"
                                   placeholder="비밀번호를 입력하세요" required
                                   autocomplete="current-password" />
                        </div>

                        <p v-if="errorMsg" class="slm-error">{{ errorMsg }}</p>

                        <button type="submit" class="slm-submit" :disabled="loading">
                            {{ loading ? '로그인 중...' : '로그인' }}
                        </button>
                    </form>

                    <div class="slm-footer">
                        <span>계정이 없으신가요?</span>
                        <a href="/signup" class="slm-link">회원가입</a>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
/* 오버레이 */
.slm-backdrop {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
}

/* 모달 박스 */
.slm-modal {
    position: relative;
    background: #141416;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 20px;
    padding: 2.5rem 2rem 2rem;
    width: 100%; max-width: 400px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6);
    font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
}

/* 닫기 버튼 */
.slm-close {
    position: absolute; top: 16px; right: 16px;
    width: 32px; height: 32px; border-radius: 8px;
    background: transparent; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #5c5c6e; transition: background 0.15s, color 0.15s;
}
.slm-close:hover { background: #1c1c20; color: #f0f0f2; }
.slm-close svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2.2; stroke-linecap: round; }

/* 헤더 */
.slm-header { text-align: center; margin-bottom: 1.75rem; }
.slm-icon {
    width: 48px; height: 48px; border-radius: 14px;
    background: rgba(46,204,142,0.12);
    border: 1px solid rgba(46,204,142,0.2);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1rem;
}
.slm-icon svg {
    width: 22px; height: 22px; stroke: #2ecc8e;
    fill: none; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round;
}
.slm-header h2 { font-size: 20px; font-weight: 600; color: #f0f0f2; margin-bottom: 6px; }
.slm-header p  { font-size: 13px; color: #9a9aaa; line-height: 1.6; }

/* 폼 */
.slm-form  { display: flex; flex-direction: column; gap: 14px; }
.slm-field { display: flex; flex-direction: column; gap: 6px; }
.slm-field label { font-size: 13px; color: #9a9aaa; }
.slm-field input {
    padding: 10px 14px; font-size: 14px;
    border: 1px solid rgba(255,255,255,0.10); border-radius: 10px;
    background: #18181c; color: #f0f0f2;
    font-family: inherit; outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
}
.slm-field input:focus {
    border-color: #1da876;
    box-shadow: 0 0 0 3px rgba(46,204,142,0.10);
}
.slm-field input::placeholder { color: #5c5c6e; }

.slm-error {
    font-size: 13px; color: #f87171;
    background: rgba(239,68,68,0.10); border-radius: 8px;
    padding: 8px 12px; margin: 0;
}

.slm-submit {
    margin-top: 4px; padding: 12px;
    background: #2ecc8e; color: #0a1a12;
    border: none; border-radius: 10px;
    font-size: 15px; font-weight: 600; font-family: inherit;
    cursor: pointer; transition: background 0.15s, transform 0.1s;
}
.slm-submit:hover    { background: #38dfa0; }
.slm-submit:active   { transform: scale(0.99); }
.slm-submit:disabled { opacity: 0.5; cursor: not-allowed; }

/* 하단 */
.slm-footer { margin-top: 1.25rem; text-align: center; font-size: 13px; color: #5c5c6e; }
.slm-link   { margin-left: 6px; color: #2ecc8e; text-decoration: none; font-weight: 500; }
.slm-link:hover { text-decoration: underline; }

/* 트랜지션 */
.slm-fade-enter-active,
.slm-fade-leave-active { transition: opacity 0.2s ease; }
.slm-fade-enter-from,
.slm-fade-leave-to    { opacity: 0; }
.slm-fade-enter-active .slm-modal,
.slm-fade-leave-active .slm-modal { transition: transform 0.2s ease, opacity 0.2s ease; }
.slm-fade-enter-from .slm-modal   { transform: translateY(12px) scale(0.97); opacity: 0; }
.slm-fade-leave-to .slm-modal     { transform: translateY(8px) scale(0.98); opacity: 0; }
</style>
