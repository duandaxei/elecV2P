<template>
  <VueDragResize v-if="show.groupchoose" className="ediv" dragHandle=".ediv_title--name" :parent="true" :prevent-deactivation="false" :active="true" w="480" h="92" z="9" :resizable="false" :draggable="true" :handles="['tl','tr','bl','br']" :lock-aspect-ratio="false">
    <h3 class="ediv_title">
      <span class="ediv_title--name">{{ $t('choose_group') }}</span>
      <span class="ediv_title--close" @click="show.groupchoose=!show.groupchoose">x</span>
    </h3>
    <div class="ediv_content">
      <div class="mgselect">
        <label class="elecTable_label mgselect_label">{{ $t('move_to_group') }}</label>
        <select class="elecTable_select mgselect_choose" v-model="choose">
          <option value="new">{{ $t('new_group') }}</option>
          <option value="none">{{ $t('no_group') }}</option>
          <option v-for="(value, key) in gpoptions" :key="key" :value="key">{{ value }}</option>
        </select>
        <button class="elecBtn greenbk" @click="groupChoose()">{{ $t('ok') }}</button>
      </div>
    </div>
  </VueDragResize>
</template>

<script>
import VueDragResize from 'vue-draggable-resizable'

export default {
  name: 'movegroup',
  props: ['show', 'gpoptions'],
  components: {
    VueDragResize
  },
  data(){
    return {
      choose: 'new',
    }
  },
  methods: {
    groupChoose(){
      this.$emit('choose', this.choose)
    }
  }
}
</script>

<style scoped>
.mgselect {
  display: flex;
  margin: 8px;
  align-items: center;
  justify-content: center;
}

.mgselect_label {
  font-size: 1.25em;
}

.mgselect_choose {
  width: 180px;
  margin-right: 1em;
}

.ediv_content {
  height: auto;
  overflow: hidden;
}
</style>