const { app, BrowserWindow } = require('electron')
const assert = require('node:assert/strict')
const { mkdtempSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')
const { setTimeout: delay } = require('node:timers/promises')
const root = mkdtempSync(join(tmpdir(), 'herein-moodboard-ui-'))
process.env.MYDASHBOARD_USER_DATA = root
console.log('Moodboard UI artifacts:', root)
require('../out/main/index.js')
app.whenReady().then(async () => {
  let window
  const evaluate = async (source) => {
    try {
      return await window.webContents.executeJavaScript(source, true)
    } catch (error) {
      throw new Error(`Renderer evaluation failed for ${source}: ${error.message}`)
    }
  }
  const waitFor = async (source, label) => {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate(`Boolean(${source})`)) return
      await delay(100)
    }
    throw Error('Timed out: ' + label)
  }
  const click = async (text) => {
    assert.ok(
      await evaluate(
        `(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)}&&b.checkVisibility());if(!b)return false;b.click();return true})()`,
      ),
      'Missing button: ' + text,
    )
    await delay(120)
  }
  const setInput = async (selector, value) => {
    await evaluate(
      `(()=>{const input=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`,
    )
  }
  const call = async (action, ...args) => {
    const result = await evaluate(
      `window.electronAPI.invoke(${JSON.stringify(action)},...${JSON.stringify(args)})`,
    )
    assert.equal(result.success, true, result.error)
    return result.data
  }
  const key = async (keyCode, modifiers = []) => {
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode, modifiers })
    if (keyCode === 'Enter') window.webContents.sendInputEvent({ type: 'char', keyCode: '\r' })
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode, modifiers })
    await delay(120)
  }
  const openResource = async () => {
    await evaluate(
      `(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim().endsWith('Add')&&b.checkVisibility());b.click()})()`,
    )
    await waitFor('document.querySelector("input[type=url]")', 'resource form')
  }
  const title = 'input[placeholder="e.g. React, Figma, Tailwind CSS"]'
  try {
    for (let attempt = 0; attempt < 100; attempt++) {
      window = BrowserWindow.getAllWindows().find((w) => w.webContents.getURL().startsWith('file:'))
      if (window && !window.webContents.isLoadingMainFrame()) break
      await delay(100)
    }
    assert.ok(window)
    window.show()
    window.focus()
    app.focus({ steal: true })
    window.setSize(1440, 1100)
    await evaluate("location.hash='/writing'")
    await waitFor(
      '[...document.querySelectorAll("h4")].some(h=>h.textContent==="Moodboards")',
      'writing page',
    )
    await evaluate(
      '[...document.querySelectorAll("h4")].find(h=>h.textContent==="Moodboards").click()',
    )
    await openResource()
    await setInput(title, 'ohmygame draft')
    await setInput('input[type=url]', 'https://example.com/game')
    await click('新增类别')
    await waitFor(
      'document.activeElement.id==="moodboard-category-name"',
      'category receives focus',
    )
    await key('Tab')
    assert.equal(await evaluate('document.activeElement.getAttribute("aria-label")'), '图标：书签')
    await key('Tab', ['shift'])
    assert.equal(await evaluate('document.activeElement.id'), 'moodboard-category-name')
    await setInput('#moodboard-category-name', '游戏开发')
    await key('Escape')
    assert.equal(
      await evaluate(`document.querySelector(${JSON.stringify(title)}).value`),
      'ohmygame draft',
    )
    assert.equal(await evaluate('document.activeElement.textContent.trim()'), '新增类别')
    await click('新增类别')
    await click('保存类别')
    assert.ok(
      await evaluate(
        'document.querySelector("[data-moodboard-category-editor] [role=alert]").textContent.includes("类别名称")',
      ),
    )
    await setInput('#moodboard-category-name', 'Design')
    await click('保存类别')
    await waitFor(
      'document.querySelector("[data-moodboard-category-editor] [role=alert]").textContent.includes("已存在")',
      'duplicate category feedback',
    )
    assert.equal(
      await evaluate('document.querySelector("#moodboard-category-name").value'),
      'Design',
    )
    await setInput('#moodboard-category-name', '游戏开发')
    assert.equal(
      await evaluate('document.querySelector("[data-moodboard-category-editor] [role=alert]")'),
      null,
      'Changing the name clears the previous duplicate error',
    )
    await evaluate('document.querySelector("[aria-label=图标：游戏]").focus()')
    await key('Space')
    assert.equal(
      await evaluate(
        'document.querySelector("[aria-label=图标：游戏]").getAttribute("aria-pressed")',
      ),
      'true',
    )
    for (const theme of ['light', 'dark']) {
      await evaluate(`document.documentElement.classList.toggle('dark',${theme === 'dark'})`)
      for (const width of [1440, 1024]) {
        window.setSize(width, 1000)
        await evaluate(
          'document.querySelector("[data-moodboard-category-editor]").scrollIntoView({block:"center"})',
        )
        await delay(150)
        writeFileSync(
          join(root, `category-${theme}-${width}.png`),
          (await window.webContents.capturePage()).toPNG(),
        )
        assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'))
      }
    }
    window.webContents.setZoomFactor(2)
    await evaluate(
      'document.querySelector("[data-moodboard-category-editor]").scrollIntoView({block:"center"})',
    )
    await delay(150)
    writeFileSync(
      join(root, 'category-200percent.png'),
      (await window.webContents.capturePage()).toPNG(),
    )
    assert.ok(
      await evaluate(
        'document.querySelector("[data-moodboard-category-editor]").scrollWidth<=document.querySelector("[data-moodboard-category-editor]").clientWidth',
      ),
    )
    assert.ok(
      await evaluate(`(() => {
      const panel = document.querySelector('[data-moodboard-resource-form]')
      const save = [...document.querySelectorAll('[data-moodboard-category-editor] button')].find(button => button.textContent.trim() === '保存类别')
      save.scrollIntoView({block:'center'})
      const rect = save.getBoundingClientRect()
      return rect.top >= panel.firstElementChild.getBoundingClientRect().bottom && rect.bottom <= panel.lastElementChild.getBoundingClientRect().top
    })()`),
      'Category save stays reachable between the fixed header and footer at 200%',
    )
    window.webContents.setZoomFactor(1)
    window.setSize(1440, 1100)
    await click('保存类别')
    await waitFor('!document.querySelector("[data-moodboard-category-editor]")', 'category saved')
    assert.equal(
      await evaluate('document.activeElement.textContent.trim()'),
      '新增类别',
      'Successful category save restores focus to the enabled trigger',
    )
    assert.ok(
      await evaluate(
        '[...document.querySelectorAll("button")].some(b=>b.textContent.trim()==="游戏开发"&&b.getAttribute("aria-pressed")==="true")',
      ),
    )
    const categories = await call('moodboard:listCategoryDefinitions')
    const category = categories.find((c) => c.label === '游戏开发')
    assert.equal(category.icon, 'puzzle')
    await click('Add Resource')
    await waitFor('!document.querySelector("input[type=url]")', 'resource saved')
    const items = await call('moodboard:getAll')
    assert.equal(items[0].category, category.value)
    assert.equal(items[0].title, 'ohmygame draft')
    assert.ok(
      await evaluate(
        'document.querySelector("[data-moodboard-resource] svg[data-category-icon=puzzle]")',
      ),
    )
    await call('moodboard:create', {
      title: 'existing design',
      url: 'https://example.com/design',
      category: 'design',
    })
    await evaluate('document.querySelector(`[aria-label="关闭 Moodboards"]`).click()')
    await evaluate(
      '[...document.querySelectorAll("h4")].find(h=>h.textContent==="Moodboards").click()',
    )
    await waitFor(
      'document.querySelectorAll("[data-moodboard-resource]").length===2',
      'resources reload',
    )
    await click('游戏开发')
    assert.equal(await evaluate('document.querySelectorAll("[data-moodboard-resource]").length'), 1)
    await evaluate('document.querySelector("[data-moodboard-resource] button[title=Edit]").click()')
    assert.ok(
      await evaluate(
        '[...document.querySelectorAll("[data-moodboard-resource-form] button")].some(b=>b.textContent.trim()==="游戏开发"&&b.getAttribute("aria-pressed")==="true")',
      ),
    )
    await click('Cancel')
    await evaluate('document.querySelector(`[aria-label="关闭 Moodboards"]`).click()')
    await window.webContents.reload()
    await waitFor(
      '[...document.querySelectorAll("h4")].some(h=>h.textContent==="Moodboards")',
      'renderer reload',
    )
    assert.equal(
      (await call('moodboard:listCategoryDefinitions')).find((c) => c.value === category.value)
        .icon,
      'puzzle',
    )
    console.log(
      'Moodboard UI business, persistence, errors, keyboard, themes, viewports and zoom passed',
    )
    app.exit(0)
  } catch (error) {
    console.error(error)
    app.exit(1)
  }
})
