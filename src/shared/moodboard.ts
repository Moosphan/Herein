export const MOODBOARD_ICONS = [
  { value: 'bookmark', label: '书签' },
  { value: 'code', label: '代码' },
  { value: 'palette', label: '配色' },
  { value: 'cpu', label: '人工智能' },
  { value: 'academic', label: '学习' },
  { value: 'briefcase', label: '工作' },
  { value: 'puzzle', label: '游戏' },
  { value: 'folder', label: '文件夹' },
  { value: 'book', label: '阅读' },
  { value: 'camera', label: '摄影' },
  { value: 'film', label: '视频' },
  { value: 'music', label: '音乐' },
  { value: 'globe', label: '网站' },
  { value: 'heart', label: '生活' },
  { value: 'home', label: '家居' },
  { value: 'lightbulb', label: '灵感' },
  { value: 'wrench', label: '工具' },
  { value: 'chart', label: '数据' },
  { value: 'rocket', label: '创作' },
  { value: 'chat', label: '交流' },
] as const

export type MoodboardIcon = (typeof MOODBOARD_ICONS)[number]['value']
export interface MoodboardCategory {
  value: string
  label: string
  icon: MoodboardIcon
}
export const MOODBOARD_DEFAULT_CATEGORIES: readonly MoodboardCategory[] = [
  { value: 'open-source', label: 'Open Source', icon: 'code' },
  { value: 'design', label: 'Design', icon: 'palette' },
  { value: 'ai-tools', label: 'AI Tools', icon: 'cpu' },
  { value: 'learning', label: 'Learning', icon: 'academic' },
  { value: 'productivity', label: 'Productivity', icon: 'briefcase' },
  { value: 'general', label: 'General', icon: 'bookmark' },
]
