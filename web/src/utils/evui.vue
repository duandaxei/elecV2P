<template>
  <div class="evui">
    <VueDragResize v-for="(ediv, drid) in displayList" :key="drid" className="ediv" dragHandle=".ediv_title--name" :parent="true" :prevent-deactivation="false" :active="ediv.active" :w="ediv.width" :h="ediv.height" :x="ediv.left" :y="ediv.top" :z="ediv.z" :resizable="ediv.resizable" :draggable="ediv.draggable" :handles="['tl','tr','bl','br']" :lock-aspect-ratio="false" :class="{ 'ediv--minimized': ediv.minimized, 'ediv--maximized': ediv.maximized }" @deactivated="ediv.z=1" @activated="ediv.z=2" @resizestop="(...args) => updateVal(args, drid)" @dragstop="(...args) => updateVal(args, drid)">
      <h3 class="ediv_title" :style="ediv.style.title" @click="ediv.maximized ? null : (ediv.z=2)">
        <span class="ediv_title--name" :title="drid">{{ ediv.title }}</span>
        <span class="ediv_title--minimize" @click="evMinimize(drid)" :title="$t('minimize')"><i class="ediv_btn_icon ediv_btn_icon--min"></i></span>
        <span v-if="ediv.maximized" class="ediv_title--maximize" @click="evRestoreMaximized(drid)" :title="$t('restore')"><i class="ediv_btn_icon ediv_btn_icon--restore"></i></span>
        <span v-else class="ediv_title--maximize" @click="evMaximize(drid)" :title="$t('maximize')"><i class="ediv_btn_icon ediv_btn_icon--max"></i></span>
        <span class="ediv_title--close" @click="evRemove(drid)">x</span>
      </h3>
      <div class="ediv_content" :style="ediv.style.content" v-html="ediv.content" @click="evDelegate($event, drid)" @keydown.ctrl.83.prevent.stop="evSave(drid)"></div>
      <div v-if="ediv.cbable" class="ediv_btncontainer">
        <textarea class="elecTable_input ediv_cbdata" :style="ediv.style.cbdata" :placeholder="ediv.cbhint" v-model="ediv.cbdata" @keyup.ctrl.enter="cbsubmit(drid)"></textarea>
        <button class="elecBtn ediv_cbbtn" :style="ediv.style.cbbtn" @click="cbsubmit(drid)">{{ ediv.cblabel }}</button>
      </div>
    </VueDragResize>
    <div v-if="hasMinimized" class="evui_dock">
      <div v-for="ediv in minimizedList" :key="ediv._id" class="evui_dock_item" @click="evRestoreMinimized(ediv._id)">
        <span class="evui_dock_label">{{ ediv.title }}</span>
        <div class="evui_dock_iconwrap" :style="dockIconStyle">
          <img class="evui_dock_icon" :src="minLogo(ediv)" :alt="ediv.title" :style="dockIconStyle" />
          <span class="evui_dock_close" @click.stop="evRemove(ediv._id)" title="x"><svg viewBox="0 0 24 24" width="10" height="10"><path fill="currentColor" d="M6.4 5L5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z"/></svg></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { vue2Proto } from './api'
import VueDragResize from 'vue-draggable-resizable'

export default {
  name: 'evui',
  components: {
    VueDragResize
  },
  data() {
    return {
      init: {
        title: 'elecV2P 显示窗口',
        top: 0,
        left: 0,
        width: 620,
        height: 360,
        z: 1,
        active: true,
        resizable: false,
        draggable: true,
        content: `<h1>${this.$t('no_content')}</h1><p>About $evui: <a href='https://github.com/elecV2/elecV2P-dei/tree/master/docs/04-JS.md' target='elecV2PDoc'>DOCS $evui</a></p>`,
        style: {
          content: "font-size: 15px",
        },
        cbable: false,
        cbdata: '',
        cblabel: this.$t('submit'),
        cbhint: this.$t('input_return_data'),
      },
      script: '',
      draglist: { },
      dirty: false,
      maxZ: 2,
    }
  },
  computed: {
    hasMinimized() {
      return Object.values(this.draglist).some(e => e.minimized)
    },
    minimizedCount() {
      return Object.values(this.draglist).filter(e => e.minimized).length
    },
    displayList() {
      const list = {}
      for (const [id, item] of Object.entries(this.draglist)) {
        list[id] = item
      }
      return list
    },
    minimizedList() {
      const list = []
      for (const [id, item] of Object.entries(this.draglist)) {
        if (item.minimized) {
          list.push({ ...item, _id: id })
        }
      }
      return list
    },
    dockIconStyle() {
      const n = this.minimizedCount
      const gap = 20
      const pad = 36
      const maxW = Math.min(window.innerWidth * 0.6, 720)
      const avail = maxW - pad - gap * (n - 1)
      const size = Math.max(40, Math.min(44, Math.floor(avail / n)))
      return { width: size + 'px', height: size + 'px' }
    },
  },
  created() {
    vue2Proto.evui = (evui)=>this.neweu({ ...evui, type: 'local' })

    if (this.$wsrecv) {
      this.$wsrecv.add('evui', obj => {
        let sobj = this.$sJson(obj)

        if (!sobj) {
          this.$message.error('evui 输送的数据有误')
          return
        }
        if (sobj.data && sobj.data.script) {
          this.script = sobj.data.script
        }

        switch (sobj.type) {
        case 'neweu':
          this.neweu(sobj.data)
          break
        case 'close':
        case 'delete':
          if (this.draglist[sobj.id]) {
            this.$message.success('收到服务器端关闭', this.draglist[sobj.id].title, 'evui 界面的命令', sobj.message && '\n附带信息: ' + sobj.message )
            this.evRemove(sobj.id)
          }
          break
        case 'contentadd':
          this.draglist[sobj.id].content = this.draglist[sobj.id].content + this.$sString(sobj.data)
          break
        case 'content':
          this.draglist[sobj.id].content = this.$sString(sobj.data)
          break
        case 'cbdataadd':
          let newdata = this.draglist[sobj.id].cbdata + '\n' + this.$sString(sobj.data)
          this.draglist[sobj.id].cbdata = newdata
          break
        case 'cbdata':
        default:
          this.draglist[sobj.id].cbdata = this.$sString(sobj.data)
        }
      })
    }
    this.restoreAll()
  },
  mounted() {
    document.addEventListener('visibilitychange', this.onVisibilityChange)
    window.addEventListener('beforeunload', this.onBeforeUnload)
  },
  beforeUnmount() {
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    window.removeEventListener('beforeunload', this.onBeforeUnload)
  },
  watch: {
    script(code){
      this.$uApi.injectJs(code)
    }
  },
  methods: {
    minLogo(item) {
      return this.$uApi.hashToLogo(item._id, item.title, 3)
    },
    updateVal({...rect}, drid) {
      let newval = {
        left: rect[0],
        top: rect[1]
      }
      if (rect[2] !== undefined && rect[3] !== undefined) {
        newval.width = rect[2]
        newval.height = rect[3]
      }
      Object.assign(this.draglist[drid], newval)
    },
    neweu(evui = {}){
      let id = evui.id || this.$uStr.euid()
      const reqMaximized = !!evui.maximized
      evui = { ...this.init, ...evui }
      evui.top = evui.top || (document.body.clientHeight - Number(evui.height || 460))/2
      evui.left = evui.left || (document.body.clientWidth - Number(evui.width || 800))/2
      if (evui.top < 0) evui.top = 0
      if (evui.left < 0) evui.left = 0
      if (evui.content) evui.content = this.$sString(evui.content)
      if (evui.cbdata) evui.cbdata = this.$sString(evui.cbdata)
      if (this.$sType(evui.style) !== 'object') evui.style = { content: evui.style }
      if (evui.script) this.script = evui.script
      evui.minimized = false
      evui.maximized = false
      evui.z = ++this.maxZ
      evui.active = true
      this.draglist[id] = evui
      this.dirty = evui.persist !== false
      if (reqMaximized) this.evMaximize(id)
    },
    evMaximize(id) {
      const item = this.draglist[id]
      if (!item) return
      item.prev = { resizable: item.resizable, draggable: item.draggable }
      item.resizable = false
      item.draggable = false
      item.maximized = true
    },
    evRestoreMaximized(id) {
      const item = this.draglist[id]
      if (!item || !item.prev) return
      Object.assign(item, item.prev, { maximized: false })
      delete item.prev
      item.z = ++this.maxZ
      item.active = true
    },
    markDirty() {
      this.dirty = true
    },
    persistAll() {
      if (!this.dirty) return
      const data = {}
      const entries = Object.entries(this.draglist)
      // 只保留最新的 10 个窗口
      const latest = entries.slice(-10)
      for (const [id, item] of latest) {
        // content 大于 20KB 直接丢弃
        if (item.content && this.$sString(item.content).length > 20 * 1024) continue
        data[id] = {
          title: item.title,
          top: item.top,
          left: item.left,
          width: item.width,
          height: item.height,
          z: item.z,
          type: item.type,
          content: item.content,
          style: item.style,
          resizable: item.resizable,
          draggable: item.draggable,
          cbable: item.cbable,
          cbdata: item.cbdata,
          cblabel: item.cblabel,
          cbhint: item.cbhint,
          minimized: item.minimized,
          maximized: item.maximized,
        }
      }
      const hasData = Object.keys(data).length > 0
      const req = hasData
        ? { type: 'save', data: { key: '.evui_all', value: { type: 'object', value: data } } }
        : { type: 'delete', data: '.evui_all' }
      this.$axios.put('/store', req).then(res=>{
        if (hasData && res.data.rescode !== 0) {
          this.$message.error('evui 窗口保存到 store 常量失败', res.data.message)
        }
      }).catch(e=>{
        this.$message.error('evui 窗口保存到 store 常量失败', e && e.message)
      })
      this.dirty = false
    },
    restoreAll() {
      this.$axios.get('/store/.evui_all').then(res=>{
        let store
        try {
          const parsed = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
          store = parsed && parsed.value || {}
        } catch (e) {
          store = {}
        }
        for (const id of Object.keys(store)) {
          if (this.draglist[id]) continue
          this.neweu({ id, ...store[id] })
          if (store[id].minimized) {
            this.draglist[id].minimized = true
            this.draglist[id].active = false
          }
        }
        this.dirty = false
      }).catch(()=>{})
    },
    onVisibilityChange() {
      if (document.hidden) this.persistAll()
    },
    onBeforeUnload() {
      this.persistAll()
    },
    evMinimize(id) {
      const item = this.draglist[id]
      if (!item || item.minimized) return
      if (!item.prev) {
        item.prev = { top: item.top, left: item.left, width: item.width, height: item.height, z: item.z, resizable: item.resizable, draggable: item.draggable }
      }
      item.minimized = true
      item.active = false
      this.markDirty()
    },
    evRestoreMinimized(id) {
      const item = this.draglist[id]
      if (!item) return
      item.minimized = false
      if (item.prev && !item.maximized) {
        Object.assign(item, item.prev)
        delete item.prev
      }
      item.z = ++this.maxZ
      item.active = true
      this.markDirty()
    },
    evRemove(id){
      if (!id) {
        this.$message.error('a id of the evui is expect')
        return
      }
      if (this.draglist[id]) {
        if (this.draglist[id].type !== 'local' && this.$wsrecv && this.$wsrecv.connected) {
          this.$wsrecv.send(id, 'close')
        }
        delete this.draglist[id]
        this.markDirty()
      }
    },
    cbsubmit(id){
      this.$message.success(this.draglist[id].title, 'send data:\n', this.draglist[id].cbdata)
      if (this.$wsrecv) {
        this.$wsrecv.send(id, this.draglist[id].cbdata)
      }
    },
    evDelegate(event, id){
      const method = event && event.target.dataset.method
      if (!method) {
        return
      }
      if (this.draglist[id].methods && this.draglist[id].methods[method]) {
        this.draglist[id].methods[method](event)
      }
      const dclose = event.target.dataset.close
      if (dclose === 'true' || method === 'close') {
        this.evRemove(id)
      }
    },
    evSave(id){
      if (this.draglist[id].methods && this.draglist[id].methods['save']) {
        this.draglist[id].methods['save']()
        this.evRemove(id)
      }
    },
  }
}
</script>
