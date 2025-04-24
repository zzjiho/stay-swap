// OAuth 로그인만 사용하므로 특별한 JavaScript 로직이 필요하지 않습니다.
// 필요한 경우 여기에 추가 기능을 구현할 수 있습니다.

document.addEventListener("DOMContentLoaded", () => {
    // 리디렉션 URL 처리
    const urlParams = new URLSearchParams(window.location.search)
    const redirectUrl = urlParams.get("redirect")

    if (redirectUrl) {
        // 소셜 로그인 버튼에 리디렉션 URL 추가
        const socialButtons = document.querySelectorAll(".social-button")

        socialButtons.forEach((button) => {
            const currentHref = button.getAttribute("href")
            button.setAttribute("href", `${currentHref}?redirect_uri=${encodeURIComponent(redirectUrl)}`)
        })
    }
})
