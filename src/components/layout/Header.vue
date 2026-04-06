<script setup>
import { useAuthStore } from '@/stores/authStore';
import { useRouter, useRoute } from 'vue-router';
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

// 상태 관리
const isMobileNavActive = ref(false);
const mobileOpenKey = ref(null);
const pcOpenKey = ref(null);
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200);

const isMobile = computed(() => windowWidth.value < 1200);

// 핸들러 함수
const handleResize = () => {
  windowWidth.value = window.innerWidth;
  if (!isMobile.value) {
    isMobileNavActive.value = false;
    mobileOpenKey.value = null;
    document.body.classList.remove('mobile-nav-active');
  }
};

const toggleMobileNav = () => {
  isMobileNavActive.value = !isMobileNavActive.value;
  if (isMobileNavActive.value) {
    document.body.classList.add('mobile-nav-active');
  } else {
    document.body.classList.remove('mobile-nav-active');
    mobileOpenKey.value = null;
  }
};

const handleMouseEnter = (key) => { if (!isMobile.value) pcOpenKey.value = key; };
const handleMouseLeave = () => { if (!isMobile.value) pcOpenKey.value = null; };

const closeAll = () => {
  mobileOpenKey.value = null;
  pcOpenKey.value = null;
  isMobileNavActive.value = false;
  document.body.classList.remove('mobile-nav-active');
};

const toggleDropdown = (key) => {
  if (isMobile.value) {
    mobileOpenKey.value = mobileOpenKey.value === key ? null : key;
  }
};

const handleLogout = () => {
  authStore.logout();
  router.push('/');
  closeAll();
};

// 라이프사이클 및 감시
watch(() => route.path, closeAll);

onMounted(() => { window.addEventListener('resize', handleResize); });
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  document.body.classList.remove('mobile-nav-active');
});
</script>

<style scoped>
  :global(body.mobile-nav-active) { overflow: hidden; }
</style>