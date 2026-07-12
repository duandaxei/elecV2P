<template>
  <div class="codeditor" :class="{ 'codeditor--collapsed': collapse, 'codeditor--full': fullscreen, 'codeditor--dragging': dragging }" v-show="bShow" @keydown.122.prevent.stop.exact="fullscreen=!fullscreen"
    :style="'transform: translate(' + tranposi[0] + 'px, ' + tranposi[1] + 'px);'"
  >
    <h3 class="title title--editview">
      <span class="title_close" @click.prevent="bShow=false" title="alt+w">X</span>
      <span class="title_main" :title="$t('rename_prompt')" @dblclick.prevent="nameChange()" @mousedown.prevent="dragStart($event)">{{ curtfile.path }}/{{ curtfile.name }}</span>
      <span class="title_collapse" :class="{ 'title_collapse--collapsed': collapse }" @click.prevent="tranposi=[0, 0];collapse=!collapse;"></span>
    </h3>
    <div class="codeditor_toolbar">
      <ul class="codeditor_menu eflex">
        <li class="toolbar_item">
          <label>{{ $t('auto_wrap') }}</label>
          <input class="echeckbox" checked type="checkbox" name="autoWrap" @change="autoWrap($event)">
        </li>
        <li class="toolbar_item">
          <label>{{ $t('line_number') }}</label>
          <input class="echeckbox" checked type="checkbox" name="offUnder" @change="offUnder($event)">
        </li>
        <li class="toolbar_separate"></li>
        <li class="toolbar_item">
          <label>{{ $t('show_invisibles') }}</label>
          <input class="echeckbox" checked type="checkbox" name="showInvi" @change="showInvi($event)">
        </li>
        <li class="toolbar_item">
          <label>{{ $t('tab_width') }}</label>
          <select class="elecTable_select toolbar_select" @change="tabResize($event)">
            <option value="4">4 {{ $t('spaces') }}</option>
            <option value="2">2 {{ $t('spaces') }}</option>
          </select>
        </li>
        <li class="toolbar_item">
          <label>{{ $t('soft_tabs') }}</label>
          <input class="echeckbox" checked type="checkbox" name="softTabs" @change="softTabs($event)">
        </li>
        <li class="toolbar_separate"></li>
        <li class="toolbar_item">
          <label>{{ $t('read_only') }}</label>
          <input class="echeckbox" type="checkbox" name="readOnly" @change="readOnly($event)">
        </li>
        <li v-if="curtfile.mode==='hex'" :title="$t('convert_done')">
          <button class="elecBtn elecBtn--h32 emargin bk_main_cl" @click="hexstrToggle()">{{ $t('text_mode') }}</button>
        </li>
        <li class="toolbar_item" :title="$t('view_source')">
          <button class="elecBtn elecBtn--h32 emargin bk_main_cl" @click="fileView()">{{ $t('view_source') }}</button>
        </li>
        <li class="toolbar_item">
          <button class="elecBtn elecBtn--h32 emargin bk_main_cl" @click="moreSet()">{{ $t('more_settings') }}</button>
        </li>
        <li class="toolbar_item toolbar_item--mergebtn" :title="$t('clipboard_https_only')">
          <span class="toolbar_mergebtn" @click="editor.selectAll()">{{ $t('select_all') }}</span>
          <span class="toolbar_copy" @click="copySelection()">{{ $t('copy') }}</span>
          <span class="toolbar_mergebtn" @click="pasteSelection()">{{ $t('paste') }}</span>
        </li>
      </ul>
    </div>
    <div id="aceditor" @keydown.ctrl.83.prevent.stop.exact="save()" @keyup.113.prevent.stop.exact="nameChange()" @keydown.alt.enter.prevent.stop.exact="fileView()" @keydown.alt.87.prevent.stop.exact="bShow=false">elecV2P editor</div>
    <div class="codeditor_button center">
      <button class="elecBtn" @click.prevent="save()">{{ $t('save_ctrl_s') }}</button>
      <ul class="codeditor_tip" v-show="tipshow" @click.prevent="tipshow=!tipshow">
        <li>f2: 重命名文件 f11: 全屏</li>
        <li>alt+enter: 新标签页中查看该文件</li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'editor',
  props: ['file'],
  data() {
    return {
      curtfile: {
        burl: '',
        name: '',
        path: '',
        mode: 'string'
      },
      bShow: false,
      editor: null,
      modelist: null,
      collapse: false,
      tipshow: true,
      fullscreen: false,
      tranposi: [0, 0],
      dragging: false,
      dragposi: [0, 0],
    }
  },
  mounted(){
    window.onload = () =>{
    if (ace) {
      this.editor = ace.edit("aceditor", {
        wrap: true,
        fontSize: 20,
        showInvisibles: true,
        indentedSoftWrap: false,
      })
      this.modelist = ace.require("ace/ext/modelist")
      // 最小/大化时，line 重新计算（待优化
      document.querySelector('.codeditor').addEventListener('transitionend', ()=>{
        this.editor.resize()
      })
      // window.test = this.editor
      // this.editor.setTheme('ace/theme/monokai')
      // this.editor.getSession().setMode("ace/mode/javascript")
    } else {
      this.$message.error('ace editor not ready yet')
    }
    }
  },
  watch: {
    'file.start': function(val) {
      if (val) {
        this.fileOpen().catch(e=>{
          this.$message.error('编辑文件', this.file.name, `失败 ${e.message}\n文件已在新标签页打开`)
          this.$uApi.open(this.file.burl + this.file.name)
          console.error('编辑文件', this.file.name, '失败', e)
        })
        this.file.start = false
      }
    }
  },
  methods: {
    nameChange(){
      let newname = prompt(this.$t('rename_prompt'), this.curtfile.name)
      if (newname) {
        if (/\\|\/|\?|\||<|>|:|\*/.test(newname)) {
          this.$message.error(this.$t('save_fail'))
          return
        }
        this.curtfile.name = newname
        this.$message.success(this.$t('save_success'))
        this.editor.focus()
      }
    },
    async fileOpen() {
      if (!this.editor) {
        this.$message.error('编辑器暂时不可用，请稍等...，或尝试刷新页面')
        return
      }
      if (!this.file.name || !this.file.path) {
        this.$message.error('没有获取到可编辑的文件信息')
        return
      }
      let name = this.file.name, burl = this.file.burl, content = ''
      let mobj = this.modelist.getModeForPath(name), ext = mobj.name, mode = mobj.mode
      let badext = ext === 'text' && !/\.txt$/.test(name)
      if (badext) {
        if (!confirm(name + ' ' + this.$t('file_maybe_not_text'))) {
          this.$uApi.open(this.file.burl + this.file.name)
          return
        }
      }
      if (this.file.start === 'url') {
        if (!/^https?:\/\/\S{4}/.test(burl)) {
          this.$message.error(this.$t('save_fail'), burl + name)
          return
        }
        let loading = this.$message.loading(this.$t('loading'), name + '...', 0)
        try {
          content = await this.$axios.get(burl + name, {
            responseType: 'arraybuffer',
          }).then(res=>{
            if (badext) {
              this.curtfile.mode = 'hex'
              return this.$uStr.bufferToHex(res.data)
            } else {
              this.curtfile.mode = 'string'
              return new TextDecoder().decode(res.data)
            }
          })
          loading()
          this.curtfile.burl = burl
          this.$message.success(name, this.$t('file_loaded'))
        } catch(e) {
          loading()
          this.$message.error(this.$t('save_fail'), name, e.message)
          console.error('无法加载', name, '文件内容', e)
          return
        }
      } else if (this.file.start === 'new') {
        this.$message.success(this.$t('create'), name)
        this.curtfile.burl = this.file.burl
        content = this.file.content || `欢迎使用 elecV2P 文本文件编辑器\n\nctrl+a 全选\nctrl+s保存`
      } else {
        this.$message.error(this.$t('unknown'), this.file.start)
        return
      }
      this.editor.session.setMode(mode)
      console.debug('elecV2P editor current mode', ext)
      if (this.$sType(content) !== 'string') {
        this.$message.error(this.$t('already_text'))
        content = this.$sString(content)
      }
      this.bShow = true
      this.tranposi = [0, 0]
      this.collapse = false
      this.curtfile.path = this.file.path
      this.curtfile.name = name
      this.editor.session.setValue(content)
      this.editor.focus()
    },
    fileView(){
      if (/^https?:\/\/\S{4}/.test(this.curtfile.burl)) {
        this.$uApi.open(this.curtfile.burl + this.curtfile.name)
      } else {
        this.$message.error(this.$t('preview_unavailable'))
      }
    },
    autoWrap(event){
      this.editor.session.setUseWrapMode(event.target.checked)
      this.editor.focus()
    },
    offUnder(event){
      if (event.target.checked) {
        document.querySelector('.ace_content').classList.remove('underoff')
      } else {
        document.querySelector('.ace_content').classList.add('underoff')
      }
      this.editor.focus()
    },
    readOnly(event){
      this.editor.setReadOnly(event.target.checked)
      this.editor.focus()
    },
    tabResize(event){
      this.editor.session.setTabSize(Number(event.target.value))
      this.editor.focus()
    },
    softTabs(event){
      this.editor.session.setUseSoftTabs(event.target.checked)
      this.editor.focus()
    },
    showInvi(event){
      this.editor.setShowInvisibles(event.target.checked)
      this.editor.focus()
    },
    hexstrToggle(){
      if (this.curtfile.mode === 'hex') {
        const hideloading = this.$message.loading(this.$t('loading') + '...', 0)
        let fcont = this.editor.getValue()
        fcont = new TextDecoder().decode(this.$uStr.hexToBuffer(fcont))
        this.editor.session.setValue(fcont)
        hideloading()
        this.$message.success(this.$t('convert_done'))
        this.curtfile.mode = 'string'
      } else {
        console.log(this.$t('already_text'))
      }
    },
    moreSet(){
      this.editor.execCommand('showSettingsMenu')
      this.tipshow = !this.tipshow
    },
    dragStart(e){
      if (!this.collapse) return
      this.dragging = true
      this.dragposi = [e.clientX, e.clientY]
      const onMove = (e) => {
        this.tranposi = [this.tranposi[0] + e.clientX - this.dragposi[0], this.tranposi[1] + e.clientY - this.dragposi[1]]
        this.dragposi = [e.clientX, e.clientY]
      }
      const onUp = () => {
        this.dragging = false
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    copySelection(){
      if (!navigator.clipboard) {
        this.$message.error(this.$t('clipboard_https_only'))
        return
      }
      let copyText = this.editor.getCopyText()
      if (copyText === '') {
        this.$message.error(this.$t('select_text_first'))
        return
      }
      navigator.clipboard.writeText(copyText).then(()=>{
        this.$message.success(this.$t('copied'))
      }).catch(e=>{
        this.$message.error(this.$t('copy'), this.$t('fail'))
        console.error('复制选择文字失败', e)
      })
    },
    pasteSelection(){
      if (!navigator.clipboard) {
        this.$message.error(this.$t('clipboard_https_only'))
        return
      }
      navigator.clipboard.readText().then(data=>{
        if (data) {
          this.editor.insert('')  // 替换选择内容
          this.editor.session.insert(this.editor.getCursorPosition(), data)
          this.$message.success(this.$t('paste_success'))
        } else {
          this.$message.error(this.$t('no_text'))
        }
      }).catch(e=>{
        this.$message.error(this.$t('paste'), this.$t('fail'))
        console.error('粘贴失败', e)
      })
    },
    save(){
      const hideloading = this.$message.loading(this.curtfile.name + ' ' + this.$t('saving') + '...', 0)
      let fcont = this.editor.getValue()
      if (this.curtfile.mode === 'hex') {
        fcont = Array.from(this.$uStr.hexToBuffer(fcont))
      }
      this.$axios.post('/rpc', {
        v: 103,
        method: 'save',
        params: [this.curtfile.path + '/' + this.curtfile.name, fcont, this.curtfile.mode]
      }).then(res=>{
        if (res.data.rescode === 0) {
          this.$message.success(this.curtfile.name, this.$t('save_success'))
        } else {
          this.$message.error(this.curtfile.name, this.$t('save_fail'), res.data.message)
          console.error(this.curtfile.name, this.$t('save_fail'), res.data.message)
        }
      }).catch(e=>{
        this.$message.error(this.curtfile.name, this.$t('save_fail'), e.message)
        console.error(this.curtfile.name, this.$t('save_fail'), e)
      }).finally(hideloading)
    }
  }
}
</script>

<style type="text/css">
/* ace editor 通用样式 */
#aceditor {
  width: 100%;
  height: 100%;
  line-height: 26px;
  border: 6px solid var(--main-bk);
  border-top: none;
  border-radius: 0 0 8px 8px;
  font-size: 20px;
  box-sizing: border-box;
}

.ace_content {
  background-image: -webkit-linear-gradient(left, white 8px, transparent 8px), -webkit-linear-gradient(right, white 8px, transparent 8px), -webkit-linear-gradient(white 25px, #ccc 25px, #ccc 26px, white 26px);
  background-size: 100% 100%, 100% 100%, 100% 26px;
}

.ace_content.underoff {
  background-image: none;
}

@media screen and (max-width: 720px) {
  .ace_editor > .ace_gutter, .ace_gutter > .ace_gutter-layer {
    max-width: 36px;
  }

  .ace_gutter-layer > .ace_gutter-cell {
    padding-left: 0px;
    padding-right: 2px;
  }
}
</style>

<style scoped>
.codeditor {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  z-index: 9;
  background: var(--main-fc);
  transition-property: width,height;
  transition-duration: .2s;
}

.codeditor--collapsed {
  height: 36px;
  width: 360px;
  overflow: hidden;
  border-radius: 8px;
}
.codeditor--dragging {
  user-select: none;
}
.codeditor--collapsed .title_main {
  white-space: pre;
  text-overflow: ellipsis;
  overflow: hidden;
  direction: rtl;
  cursor: move;
  user-select: none;
}
.codeditor--collapsed .codeditor_button, .codeditor--collapsed #aceditor, .codeditor--collapsed .codeditor_toolbar,
.codeditor--full .codeditor_toolbar, .codeditor--full .codeditor_button {
  display: none;
}

.codeditor_toolbar {
  border: 6px solid var(--main-bk);
  border-bottom: 1px solid var(--tras-bk);
  border-top: none;
  background: var(--main-fc);
  color: var(--main-bk);
}

.codeditor_menu {
  width: 100%;
  flex-wrap: wrap;
  justify-content: center;
}

.toolbar_item {
  display: inline-flex;
  align-content: center;
  justify-content: space-around;
  align-items: center;
  box-sizing: border-box;
  margin: 0 12px;
  font-weight: 600;
}

.toolbar_item--mergebtn {
  display: none;
  height: 32px;
  margin: 3px 12px;
  padding: .5em .6em;
  border-radius: 8px;
  font-size: 18px;
  background: var(--main-bk);
  color: var(--main-fc);
  cursor: pointer;
}

.toolbar_copy {
  border-right: 1px solid;
  border-left: 1px solid;
  margin: 0 0.6em;
  padding: 0 0.6em;
}

.toolbar_separate {
  display: inline-block;
  width: 1px;
  height: 40px;
  margin: 0 10px;
  background: var(--main-bk);
}

.toolbar_select {
  width: 80px;
  height: 32px;
  border: 1px solid var(--tras-bk);
  font-size: 18px;
  margin-left: 8px;
}

.codeditor_tip {
  position: fixed;
  right: 1em;
  bottom: 3px;
  display: inline-block;
  width: 280px;
  text-align: right;
  cursor: pointer;
}

.codeditor_button {
  position: fixed;
  bottom: 1em;
  z-index: 8;
  width: 100%;
  max-width: 100%;
}

@media screen and (max-width: 720px) {
  .codeditor_toolbar {
    height: 48px;
    overflow-y: auto;
  }
}

@media screen and (max-width: 1220px) {
  .toolbar_item--mergebtn {
    display: inline-flex;
  }
  .toolbar_separate, .codeditor_tip {
    display: none;
  }
}
</style>