import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore';

const routes = [
  { path: '/', redirect: '/savings' },
  { path: '/login', name: 'Login', component: () => import('@/views/member/LoginView.vue') },
  { path: '/signup', name: 'Signup', component: () => import('@/views/member/SignupView.vue') },  
  { path: '/:catchAll(.*)', name: 'NotFound', component: () => import('@/views/error/NotFound.vue') },
  
  { path: '/savings', name: 'Savings', component: () => import('@/views/service/SavingsView.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 네비게이션 가드 설정
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();

    // 이동할 페이지가 인증을 필요하는 경우
    if (to.meta.requiresAuth) {
        // 로그인 상태(토큰 존재 여부) 확인
        if (!authStore.auth.token) {
            // 로그인 페이지로 이동 (가려던 주소를 query로 넘기면 로그인 후 복귀 가능)
            next({ name: 'Login', query: { redirect: to.fullPath } });
        } else {
            next(); // 로그인 되어 있으면 통과
        }
    } else {
        next(); // 인증이 필요 없는 페이지는 무조건 통과
    }
});

export default router