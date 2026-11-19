import type Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import {
  MOODBOARD_DEFAULT_CATEGORIES,
  MOODBOARD_ICONS,
  type MoodboardCategory,
} from '../../../shared/moodboard'
import { BaseRepository } from './base'

export interface MoodboardItemRow {
  id: number
  title: string
  url: string
  description: string | null
  category: string
  thumbnail_url: string | null
  rating: number
  tags: string
  is_pinned: number
  created_at: string
  updated_at: string
}

export class MoodboardRepository extends BaseRepository<MoodboardItemRow> {
  constructor(db: Database.Database) {
    super(db, 'moodboard_items')
  }

  findAll(): MoodboardItemRow[] {
    return this.all<MoodboardItemRow>(
      'SELECT * FROM moodboard_items ORDER BY is_pinned DESC, rating DESC, created_at DESC',
    )
  }

  findByCategory(category: string): MoodboardItemRow[] {
    return this.all<MoodboardItemRow>(
      'SELECT * FROM moodboard_items WHERE category = ? ORDER BY is_pinned DESC, rating DESC, created_at DESC',
      category,
    )
  }

  getCategories(): string[] {
    const rows = this.all<{ category: string }>(
      'SELECT DISTINCT category FROM moodboard_items ORDER BY category',
    )
    return rows.map((r) => r.category)
  }

  listCategoryDefinitions(): MoodboardCategory[] {
    const categories = [
      ...MOODBOARD_DEFAULT_CATEGORIES.map((category) => ({ ...category })),
      ...this.all<MoodboardCategory>(
        'SELECT value, label, icon FROM moodboard_categories ORDER BY rowid',
      ),
    ]
    const known = new Set(categories.map((category) => category.value))
    for (const value of this.getCategories()) {
      if (typeof value === 'string' && value && !known.has(value))
        categories.push({ value, label: value, icon: 'bookmark' })
    }
    return categories
  }

  addCategory(input: unknown): MoodboardCategory {
    if (
      !input ||
      typeof input !== 'object' ||
      !('label' in input) ||
      typeof input.label !== 'string' ||
      !input.label.trim()
    )
      throw new Error('请填写类别名称')
    const icon = MOODBOARD_ICONS.find((icon) => 'icon' in input && icon.value === input.icon)?.value
    if (!icon) throw new Error('请选择有效图标')
    const label = input.label.trim()
    const normalized = label.normalize('NFKC').toLowerCase()
    return this.db.transaction(() => {
      const exists = this.listCategoryDefinitions().some((category) =>
        [category.label, category.value].some(
          (value) => value.trim().normalize('NFKC').toLowerCase() === normalized,
        ),
      )
      if (exists) throw new Error('该类别已存在，请直接选择已有类别')
      const category = { value: `custom-${randomUUID()}`, label, icon }
      this.run(
        'INSERT INTO moodboard_categories (value, label, normalized_name, icon) VALUES (?, ?, ?, ?)',
        category.value,
        label,
        normalized,
        icon,
      )
      return category
    })()
  }

  create(data: {
    title: string
    url: string
    description?: string
    category?: string
    thumbnail_url?: string
    rating?: number
    tags?: string
  }): number {
    const result = this.run(
      `INSERT INTO moodboard_items (title, url, description, category, thumbnail_url, rating, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      data.title,
      data.url,
      data.description ?? null,
      data.category ?? 'general',
      data.thumbnail_url ?? null,
      data.rating ?? 0,
      data.tags ?? '[]',
    )
    return Number(result.lastInsertRowid)
  }

  update(
    id: number,
    data: Partial<Omit<MoodboardItemRow, 'id' | 'created_at' | 'updated_at'>>,
  ): boolean {
    const fields: string[] = []
    const values: unknown[] = []
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }
    if (fields.length === 0) return false
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)
    const result = this.run(
      `UPDATE moodboard_items SET ${fields.join(', ')} WHERE id = ?`,
      ...values,
    )
    return result.changes > 0
  }

  togglePin(id: number): boolean {
    const result = this.run(
      'UPDATE moodboard_items SET is_pinned = 1 - is_pinned, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      id,
    )
    return result.changes > 0
  }

  updateRating(id: number, rating: number): boolean {
    const result = this.run(
      'UPDATE moodboard_items SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      Math.max(0, Math.min(5, rating)),
      id,
    )
    return result.changes > 0
  }
}
