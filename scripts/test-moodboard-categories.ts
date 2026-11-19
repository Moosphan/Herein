import test from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runMigrations } from '../src/main/database/migrations'
import { MoodboardRepository } from '../src/main/database/repositories/moodboard-repository'

function fixture() {
  const db = new Database(':memory:')
  runMigrations(db)
  return { db, repo: new MoodboardRepository(db) }
}

test('category definitions include unused built-ins while legacy category API keeps its contract', () => {
  const { db, repo } = fixture()
  try {
    assert.equal(repo.listCategoryDefinitions().length, 6)
    assert.deepEqual(repo.getCategories(), [])
    assert.equal(
      repo.listCategoryDefinitions().find((c) => c.value === 'general')?.icon,
      'bookmark',
    )
  } finally {
    db.close()
  }
})

test('custom category and icon persist without resources after reopening the database', () => {
  const root = mkdtempSync(join(tmpdir(), 'moodboard-category-'))
  const path = join(root, 'test.db')
  let db = new Database(path)
  try {
    runMigrations(db)
    const category = new MoodboardRepository(db).addCategory({
      label: '  游戏开发  ',
      icon: 'puzzle',
    })
    assert.equal(category.label, '游戏开发')
    assert.equal(category.icon, 'puzzle')
    db.close()
    db = new Database(path)
    runMigrations(db)
    assert.deepEqual(
      new MoodboardRepository(db).listCategoryDefinitions().find((c) => c.value === category.value),
      category,
    )
  } finally {
    db.close()
    rmSync(root, { recursive: true, force: true })
  }
})

test('custom categories work for creation, edits, filtering and card metadata', () => {
  const { db, repo } = fixture()
  try {
    const category = repo.addCategory({ label: '游戏', icon: 'puzzle' })
    const id = repo.create({
      title: 'ohmygame',
      url: 'https://example.com',
      category: category.value,
    })
    assert.equal(repo.findByCategory(category.value)[0].id, id)
    repo.update(id, { category: 'design' })
    assert.equal(repo.findByCategory(category.value).length, 0)
    assert.equal(
      repo.listCategoryDefinitions().find((c) => c.value === category.value)?.icon,
      'puzzle',
    )
  } finally {
    db.close()
  }
})

test('duplicates include built-in labels, stable values, Unicode forms and legacy names', () => {
  const { db, repo } = fixture()
  try {
    repo.addCategory({ label: 'Games', icon: 'puzzle' })
    for (const label of [' games ', 'ＧＡＭＥＳ', 'Open Source', 'open-source'])
      assert.throws(() => repo.addCategory({ label, icon: 'bookmark' }), /已存在/)
    repo.create({ title: 'legacy', url: 'https://example.com', category: '旧类别' })
    assert.throws(() => repo.addCategory({ label: '旧类别', icon: 'bookmark' }), /已存在/)
    assert.equal(repo.listCategoryDefinitions().length, 8)
  } finally {
    db.close()
  }
})

test('invalid names and icons never persist a category', () => {
  const { db, repo } = fixture()
  try {
    for (const input of [
      null,
      { label: ' ', icon: 'bookmark' },
      { label: 4, icon: 'bookmark' },
      { label: '游戏', icon: 'not-real' },
      { label: '游戏', icon: '__proto__' },
    ])
      assert.throws(() => repo.addCategory(input), /类别名称|图标/)
    assert.equal(repo.listCategoryDefinitions().length, 6)
  } finally {
    db.close()
  }
})

test('historical category values stay available with a fallback icon', () => {
  const { db, repo } = fixture()
  try {
    repo.create({ title: 'old', url: 'https://example.com', category: 'legacy-custom' })
    assert.deepEqual(
      repo.listCategoryDefinitions().find((c) => c.value === 'legacy-custom'),
      { value: 'legacy-custom', label: 'legacy-custom', icon: 'bookmark' },
    )
    assert.equal(repo.findAll()[0].category, 'legacy-custom')
  } finally {
    db.close()
  }
})
