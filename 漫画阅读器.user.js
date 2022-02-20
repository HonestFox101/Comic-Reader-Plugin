// ==UserScript==
// @name         漫画阅读器
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  客制化双页阅读器
// @author       Sedna
// @match        http*://manhua.dmzj.com/*/*.shtml*
// @match        https://copymanga.com/comic/*/chapter/*
// @match        https://copymanga.org/comic/*/chapter/*
// @icon         http://manhua.dmzj.com/favicon.ico
// @grant        none
// @downloadURL  https://github.com/HonestFox101/Comic-Reader-Plugin/raw/master/%E6%BC%AB%E7%94%BB%E9%98%85%E8%AF%BB%E5%99%A8.user.js
// ==/UserScript==

(function () {
    'use strict';

    class ComicReaderBase {

        constructor() {
            this.img_src_list = []
            this.page_index = 0
            this.fit_width = 0
            this.fit_height = 0
            this.active = true
            
            this.initial_style()
            this.initial_element_tree()
            this.fetch_img_src_list()

            this.menu = document.querySelector('#menu')
            this.comic_reader = document.querySelector('#comic-reader')

            this.fit_width = window.screen.availWidth / 2 - 25
            this.fit_height = window.screen.availHeight - 45

            this.on_page_change(0)
        }

        fetch_img_src_list() { }

        async next_episode() { }

        async previous_episode() { }

        async on_page_change(sign) { }

        async on_state_change() {
            document.querySelector('#comic-reader').style.display = this.active ? '' : 'none'
            document.querySelectorAll('#main-button ~ div').forEach((button) => {
                button.style.display = this.active ? '' : 'none'
            })
            this.active = !this.active
        }

        initial_style() {
            let style_sheet = document.createElement('style')
            style_sheet.innerHTML = `
            #comic-reader {
                position: fixed;
                display: flex;
                background-color: black;
                align-items: center;
                justify-content: center;
                flex-flow: row-reverse nowrap;
                width: 100%;
                height: 100%;
                top: 0px;
                image-rendering: pixelated;
              }

              #menu {
                position: fixed;
                top: 10px;
                right: 10px;
                display: flex;
                flex-flow: column nowrap;
                align-items: center;
                justify-content: center;
                max-width: 30px;
                opacity: 75%;
              }

              #menu > div {
                border: 2px solid white;
                background-color: black;
                width: 20px;
                height: 20px;
                font-size: 15px;
                text-align: center;
                vertical-align: middle;
                color: white;
                margin: 3px;
                border-radius: 5px;
              }

              #main-button ~ div {
                display: none;
              }

              #menu:hover > div {
                display: unset
              }

              #menu > div:hover {
                background-color: white;
                color: black;
                cursor: pointer;
              }
            `
            document.head.appendChild(style_sheet)
            return style_sheet
        }

        initial_element_tree() {
            let comic_reader = document.createElement('div')
            comic_reader.id = 'comic-reader'
            comic_reader.style.display = 'flex'

            document.body.appendChild(comic_reader)

            let menu = document.createElement('div')
            menu.id = 'menu'
            document.body.appendChild(menu)

            let main_button = document.createElement('div')
            main_button.id = 'main-button'
            main_button.innerHTML = 'M'
            main_button.onclick = this.on_state_change
            menu.appendChild(main_button)

            let left_arrow_button = document.createElement('div')
            left_arrow_button.id = 'left-arrow-button'
            left_arrow_button.innerHTML = '←'
            left_arrow_button.onclick = this.next_episode
            menu.appendChild(left_arrow_button)

            let right_arrow_button = document.createElement('div')
            right_arrow_button.id = 'right-arrow-button'
            right_arrow_button.innerHTML = '→'
            right_arrow_button.onclick = this.previous_episode
            menu.appendChild(right_arrow_button)

            let fix_button = document.createElement('div')
            fix_button.id = 'fix-button'
            fix_button.innerHTML = 'F'
            fix_button.onclick = () => {
                this.on_page_change(-1)
            }
            menu.appendChild(fix_button)
        }

        render_page(index) {
            document.querySelectorAll('#comic-reader > img').forEach((img) => img.remove())
            let right_img = this.create_img(this.img_src_list[index])
            let left_img = this.create_img(this.img_src_list[index + 1])
            right_img.onclick = () => {
                this.on_page_change(-2)
            }
            if (!left_img) {
                return [right_img]
            }
            left_img.onclick = () => {
                this.on_page_change(2)
            }
            return [left_img, right_img]
        }

        create_img(img_src) {
            if (!img_src) return null
            let img = new Image()
            img.onload = () => {
                let wbh = img.naturalWidth / img.naturalHeight
                let img_width = this.fit_width
                let img_height = this.fit_width / wbh
                if (img_height > this.fit_height) {
                    img_height = this.fit_height
                    img_width = this.fit_height * wbh
                }
                img.style.width = `${img_width}px`
                img.style.height = `${img_height}px`
            }
            img.style.objectFit = 'cover'
            img.style.maxWidth = '50%'
            img.style.maxHeight = `100%`
            img.src = img_src
            document.querySelector('#comic-reader').appendChild(img)
            return img
        }


    }

    class DMZJComicReader extends ComicReaderBase {
        constructor() {
            super()
            document.querySelector("#center_box > a.img_land_prev").style.display = this.active ? 'none' : ''
            document.querySelector('#center_box > a.img_land_next').style.display = this.active ? 'none' : ''
        }

        async on_state_change() {
            document.querySelector('#comic-reader').style.display = this.active ? '' : 'none'
            document.querySelectorAll('#main-button ~ div').forEach((button) => {
                button.style.display = this.active ? '' : 'none'
            })
            document.querySelector("#center_box > a.img_land_prev").style.display = this.active ? 'none' : ''
            document.querySelector('#center_box > a.img_land_next').style.display = this.active ? 'none' : ''
            this.active = !this.active
        }

        async on_page_change(sign) {
            if (!sign) {
                sign = 0
            }
            let index = this.page_index + sign
            if (index < 0) {
                this.page_index = 0
            } else if (index < this.img_src_list.length) {
                this.page_index = index
            } else {
                this.page_index = this.img_src_list.length - 1
            }
            document.location.hash = `@page=${this.page_index + 1}`
            this.render_page(this.page_index)
            return this.page_index
        }

        fetch_img_src_list() {
            for (const option of document.querySelector("#page_select").options) {
                this.img_src_list.push(option.value)
            }
        }

        async next_episode() {
            let href = document.querySelector("#next_chapter").href
            if (!href) {
                alert('没有上一话了！')
                return
            }
            document.location.href = href
        }

        async previous_episode() {
            let href = document.querySelector("#prev_chapter").href
            if (!href) {
                alert('没有下一话了！')
                return
            }
            document.location.href = href
        }
    }

    class CopyMangaComicReader extends ComicReaderBase {
        constructor() {
            super()
            this.page_count = Number(document.querySelector("body > div:nth-child(2) > span.comicCount").innerText)
            document.querySelector(".header").style.display = 'none'
        }

        async on_page_change(sign) {
            let index = this.page_index + sign
            if (this.img_src_list.length < this.page_count) {
                await this.scroll_to_target_page(index + 2)
                this.fetch_img_src_list()
            }
            if (index < 0)
                this.page_index = 0
            else if (index < this.img_src_list.length)
                this.page_index = index
            else
                this.page_index = this.img_src_list.length - 1

            this.render_page(this.page_index)
        }

        async scroll_to_target_page(target_page) {
            return new Promise((resolve, reject) => {
                setTimeout(async () => {
                    let page = Number(document.querySelector("body > div:nth-child(2) > span.comicIndex").innerText)
                    if (page < target_page) {
                        scrollBy(0, 500)
                        await this.scroll_to_target_page(target_page)
                    } else {
                        resolve()
                    }
                }, 50)
            })
        }

        fetch_img_src_list() {
            this.img_src_list.length = 0
            for (const element of document.querySelectorAll("body > div.container-fluid.comicContent > div > ul > li > img")) {
                this.img_src_list.push(element.getAttribute('data-src'))
            }
        }

        async next_episode() {
            let href = document.querySelector("body > div.footer > div.comicContent-next > a").href
            if (!href) {
                return
            }
            document.location.href = href
            return Promise.resolve()
        }

        async previous_episode() {
            let href = document.querySelector("body > div.footer > div.comicContent-prev > a").href
            if (!href) {
                return
            }
            document.location.href = href
            return Promise.resolve()
        }
    }

    setTimeout(() => {
        if (document.location.hostname == 'manhua.dmzj.com') {
            let app = new DMZJComicReader()
        } else if (document.location.hostname == 'copymanga.com' || document.location.hostname == 'copymanga.org') {
            let app = new CopyMangaComicReader()
        }
    }, 1000)
})();
