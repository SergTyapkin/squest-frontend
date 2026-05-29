<style lang="stylus" scoped>
@import '../styles/constants.styl'

plate-height = 200px
plate-max-width = 400px
plate-width = 100%

// quest-background = linear-gradient(100deg, #775939 0%, rgba(116, 73, 33, 0.9) 40%, rgba(90, 56, 25, 0.7) 65%, transparent 100%) no-repeat
quest-background = linear-gradient(100deg, #6c421e 0%, rgb(116, 73, 33) 40%, rgba(90, 56, 25, 0.9) 60%, transparent 100%) no-repeat

.quest-preview
  position relative
  overflow hidden
  display block
  width plate-width
  max-width plate-max-width
  height plate-height
  margin 20px
  margin-bottom 0
  border-radius 7px
  box-shadow 0 0 20px colorShadowDark
  transition all 0.2s ease
  .preview-image
    position absolute
    inset 0
    width 100%
    height 100%
    object-fit cover
  .preview-image.default
    z-index -1
    padding-right 20px
    font-size 100px
    line-height plate-height
    color textColor3
    text-align right
    letter-spacing 10px
    opacity 0.8
    background bgColor2

  .container
    position relative
    width 100%
    height 100%
    padding 10px 20px
    background quest-background
    background-position-x 80%
    background-size 150%
    transition all 0.5s cubic-bezier(0.2, 0.65, 0.11, 0.99)

    .text-container
      overflow hidden
      height 100%
      min-height 60px
      max-height 75px
      .title
        display flex
        align-items center
        justify-content space-between
        margin-bottom 5px
        line-height 1
        .badges-container
          white-space nowrap
          img
            width 25px
        .quest-modifier
          margin-left 5px

      .description
        overflow hidden
        text-overflow ellipsis

    .statistics
      display flex
      margin-top 5px
      margin-bottom 3px
      .rating
      .time
        display flex
        align-items center
        margin-right 20px
        font-size 15px
        img
          width 30px
          margin-right 5px
      .rating
        font-size 25px
      .rating.good
        color #a9ff5b
      .rating.bad
        color #ff7963

    .branches
      position absolute
      right 0
      bottom 0
      left 0
      background transparent
      backdrop-filter blur(10px)
      &.opened
        background empColor6

.quest-preview:hover
  box-shadow 10px 10px 20px colorShadow
  .container
    background-position-x 0

.main-info
  z-index -1
  transition all 0.2s ease
.container.inactive
  .main-info
    filter blur(5px)
.container:before
  content ''
  position absolute
  z-index 1
  inset 0
  transition all 0.2s ease
.container.inactive:before
  background #00000099
.container
  *
    z-index 2

.author-fields
  display flex
  align-items center
  img
    height 17px
    margin-right 3px
  span
    color textColor3
    transition all 0.3s ease
.author-fields:hover
  span
    color textColor1


.quest-preview.placeholder
  pointer-events none
  background linear-gradient(-60deg, #26123188 20%, #45274888 50%, #26123188 80%)
  animation placeholder-bg infinite 3s cubic-bezier(0.34, 0.66, 0.67, 0.4)
  > *
    opacity 0

  @media ({mobile})
    animation none

@keyframes placeholder-bg
  from
    background-position-x 0px
  to
    background-position-x 400px

.quest-preview:not(.many-branches)
  .branches
    display none
  .text-container
    margin-bottom 20px
  .statistics
    margin-bottom 25px
</style>

<template>
  <router-link class="quest-preview" :to="{name: 'quest', query: {id: id}}" :class="{placeholder: isPlaceholder, 'many-branches': branches.length > 1}">
    <img class="preview-image" :src="previewurl" alt="preview" v-if="previewurl">

    <div class="preview-image default text-big-xx" v-else>SQ</div>

    <div class="container" :class="{inactive: branchesOpened}">
      <div class="main-info">
        <div class="text-container">
          <div
            class="title"
            :class="{
              'text-big-x': title?.length < 20,
              'text-big': title?.length >= 20 && title?.length < 40,
              'text-middle': title?.length >= 40
            }"
          >
            <span>{{ title }}</span>
            <span class="badges-container">
              <img v-if="islinkactive" src="../res/link.svg" alt="with link" class="quest-modifier">
              <img v-if="!ispublished" src="../res/invisible.svg" alt="unpublished" class="quest-modifier">
            </span>
          </div>
          <div class="text-small description" v-if="description">{{ description.replace(/([#*_]\ ?|&lt;\w*&gt;)/g, '').slice(0, 80) + (description.length > 80 ? '...' : '') }}</div>
        </div>

        <div class="statistics text-big-xx">
          <span class="rating" :class="{good: rating >= 4.5, bad: rating < 3.5}">
            <img src="../res/star.svg" alt="star">{{ rating }}
          </span>
          <span class="time">
            <img src="../res/time.svg" alt="time">{{ time }}
          </span>
        </div>
        <router-link :to="{name: 'profile', query: {id: author}}" class="link text-small author-fields">
          <img src="../res/profile.svg" alt="">
          <span>{{ authorname }}</span>
        </router-link>
      </div>

      <CircleLoading v-if="loading" size="40px" />
      <ArrowListElement
        v-if="branches.length > 0"
        ref="branches"
        class="branches"
        :class="{'opened': this.branchesOpened}"
        title="Ветки"
        action-text="развернуть"
        closed
        :elements="branches"
        preserve-click-open
        @open="openBranches"
        @close="closeBranches"
        @click-inside="$router.push({name: 'quest', query: {id: id}})"
      />
    </div>
  </router-link>
</template>

<script>
import ArrowListElement from "./ArrowListElement.vue";
import CircleLoading from "./loaders/CircleLoading.vue";
import {secondsToStrTime} from "../utils/utils";

export default {
  components: {CircleLoading, ArrowListElement},

  props: {
    id: Number,
    title: String,
    description: String,
    previewurl: String,
    author: Number,
    authorname: String,
    islinkactive: Boolean,
    ispublished: Boolean,
    canedit: Boolean,

    isPlaceholder: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      branchesOpened: false,
      branchesGotten: false,

      loading: false,
      branches: [],

      time: '-',
      rating: '-',
      played: 0,
    }
  },

  mounted() {
    if (!this.isPlaceholder) {
      this.init();
    }
  },

  methods: {
    async init() {
      await this.getQuestStats();
      await this.getBranches();
    },
    async getBranches() {
      this.loading = true;
      const branches = await this.$api.getQuestBranches(this.id);
      this.loading = false;

      if (!branches.ok_) {
        this.$popups.error("Ошибка", "Не удалось получить ветки квесте");
        return;
      }
      this.branches = branches.branches;
      this.branchesGotten = true;
    },
    async openBranches() {
      this.branchesOpened = true;
      if (this.branchesGotten) {
        this.$refs.branches.open();
        return;
      }

      await this.getBranches();
    },

    closeBranches() {
      this.branchesOpened = false;
    },

    async getQuestStats() {
      this.loading = true;
      const questStatistics = await this.$api.getQuestStatistics(this.id);
      this.loading = false;

      if (questStatistics.ok_) {
        this.played = questStatistics.played;
        this.rating = questStatistics.rating?.toFixed(1) || '-';
        this.time = secondsToStrTime(questStatistics.time);
      }
    }
  },

  watch: {
    isPlaceholder: function (from, to) {
      if (from === false && to === true) {
        this.init();
      }
    }
  }
};
</script>
