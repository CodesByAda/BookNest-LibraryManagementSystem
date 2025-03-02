document.addEventListener("DOMContentLoaded", function () {
    var swiper = new Swiper(".swiper-container", {
        loop: true,  // Enables infinite scrolling
        centeredSlides: true,
        spaceBetween: 30,
        slideToClickedSlide: true,
        autoplay: {
            delay: 2500, // Autoplay delay (2.5s)
            disableOnInteraction: false, // Continue autoplay after interaction
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        navigation: {
            nextEl: ".swiper-button-next", // Right arrow button
            prevEl: ".swiper-button-prev", // Left arrow button
        },
        breakpoints: {
            1920: {
                slidesPerView: 4,
                spaceBetween: 30
            },
            1028: {
                slidesPerView: 2,
                spaceBetween: 10
            },
            990: {
                slidesPerView: 1,
                spaceBetween: 0
            }
        }
    });
});
