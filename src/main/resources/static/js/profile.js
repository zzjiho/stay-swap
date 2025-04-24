document.addEventListener("DOMContentLoaded", () => {
    // 프로필 탭 기능
    const profileTabs = document.querySelectorAll(".profile-tab")
    const profileContents = document.querySelectorAll(".profile-tab-content")

    profileTabs.forEach((tab) => {
        tab.addEventListener("click", function () {
            const tabName = this.getAttribute("data-tab")

            // 탭 활성화 상태 변경
            profileTabs.forEach((t) => t.classList.remove("active"))
            this.classList.add("active")

            // 콘텐츠 활성화 상태 변경
            profileContents.forEach((content) => {
                content.classList.remove("active")
            })

            document.getElementById(`${tabName}-content`).classList.add("active")
        })
    })

    // 후기 탭 기능
    const reviewsTabs = document.querySelectorAll(".reviews-tab")
    const reviewsContents = document.querySelectorAll(".reviews-content")

    reviewsTabs.forEach((tab) => {
        tab.addEventListener("click", function () {
            const reviewsType = this.getAttribute("data-reviews")

            // 탭 활성화 상태 변경
            reviewsTabs.forEach((t) => t.classList.remove("active"))
            this.classList.add("active")

            // 콘텐츠 활성화 상태 변경
            reviewsContents.forEach((content) => {
                content.classList.remove("active")
            })

            document.getElementById(`${reviewsType}-reviews`).classList.add("active")
        })
    })

    // 소개 수정 버튼
    const editIntroBtn = document.querySelector(".edit-intro-btn")
    if (editIntroBtn) {
        editIntroBtn.addEventListener("click", () => {
            // 실제 구현 시 소개 수정 모달 또는 페이지로 이동
            alert("소개 수정 기능은 아직 구현되지 않았습니다.")
        })
    }

    // 정보 수정 버튼
    const editInfoBtn = document.querySelector(".edit-info-btn")
    if (editInfoBtn) {
        editInfoBtn.addEventListener("click", () => {
            // 실제 구현 시 정보 수정 모달 또는 페이지로 이동
            alert("정보 수정 기능은 아직 구현되지 않았습니다.")
        })
    }
})
