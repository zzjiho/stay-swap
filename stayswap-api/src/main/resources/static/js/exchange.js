document.addEventListener("DOMContentLoaded", () => {
    // 예약 유형 탭 기능
    const bookingTypeTabs = document.querySelectorAll(".booking-type-tab")
    const exchangeItems = document.querySelectorAll(".exchange-item")

    bookingTypeTabs.forEach((tab) => {
        tab.addEventListener("click", function () {
            // 탭 활성화 상태 변경
            bookingTypeTabs.forEach((t) => t.classList.remove("active"))
            this.classList.add("active")

            // 선택된 유형에 따라 교환 항목 필터링
            const selectedType = this.getAttribute("data-type")

            exchangeItems.forEach((item) => {
                const itemType = item.getAttribute("data-type")

                if (selectedType === itemType) {
                    item.style.display = "block"
                } else {
                    item.style.display = "none"
                }
            })
        })
    })

    // 상태 필터 기능
    const statusFilters = document.querySelectorAll(".status-filter")

    statusFilters.forEach((filter) => {
        filter.addEventListener("click", function () {
            // 필터 활성화 상태 변경
            statusFilters.forEach((f) => f.classList.remove("active"))
            this.classList.add("active")

            // 선택된 상태에 따라 교환 항목 필터링
            const selectedStatus = this.getAttribute("data-status")
            const activeTab = document.querySelector(".booking-type-tab.active")
            const activeType = activeTab.getAttribute("data-type")

            exchangeItems.forEach((item) => {
                const itemType = item.getAttribute("data-type")
                const itemStatus = item.getAttribute("data-status")

                if (itemType === activeType && (selectedStatus === "all" || selectedStatus === itemStatus)) {
                    item.style.display = "block"
                } else {
                    item.style.display = "none"
                }
            })
        })
    })

    // 페이지네이션 기능
    const paginationPages = document.querySelectorAll(".pagination-page")

    paginationPages.forEach((page) => {
        page.addEventListener("click", function () {
            // 페이지 활성화 상태 변경
            paginationPages.forEach((p) => p.classList.remove("active"))
            this.classList.add("active")

            // 실제 구현 시 페이지 데이터 로드 로직 추가
        })
    })

    // 이전/다음 페이지 버튼
    const prevButton = document.querySelector(".pagination-prev")
    const nextButton = document.querySelector(".pagination-next")

    prevButton.addEventListener("click", function () {
        const activePage = document.querySelector(".pagination-page.active")
        const prevPage = activePage.previousElementSibling

        if (prevPage) {
            activePage.classList.remove("active")
            prevPage.classList.add("active")

            // 첫 페이지인 경우 이전 버튼 비활성화
            if (!prevPage.previousElementSibling) {
                this.disabled = true
            }

            // 다음 버튼 활성화
            nextButton.disabled = false

            // 실제 구현 시 페이지 데이터 로드 로직 추가
        }
    })

    nextButton.addEventListener("click", function () {
        const activePage = document.querySelector(".pagination-page.active")
        const nextPage = activePage.nextElementSibling

        if (nextPage) {
            activePage.classList.remove("active")
            nextPage.classList.add("active")

            // 마지막 페이지인 경우 다음 버튼 비활성화
            if (!nextPage.nextElementSibling) {
                this.disabled = true
            }

            // 이전 버튼 활성화
            prevButton.disabled = false

            // 실제 구현 시 페이지 데이터 로드 로직 추가
        }
    })
})
