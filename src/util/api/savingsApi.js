import http from "@/util/http";

export const savingsApi = {

    // 계산 결과 저장
    saveCalc(data) {
        return http.post('/savings', data);
    },

    // 나의 적금 내역 목록 조회
    getList(params = {}) {
        return http.get('/savings', { params });
    },

    // 단건 상세 조회
    getDetail(calcId) {
        return http.get(`/savings/${calcId}`);
    },

    // 삭제
    deleteCalc(calcId) {
        return http.delete(`/savings/${calcId}`);
    },
};
