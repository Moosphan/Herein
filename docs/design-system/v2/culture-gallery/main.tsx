import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Button, Card, Link, Modal, Tabs } from '@heroui/react'
import catalog from './catalog.json'
import './style.css'
import 'virtual:project-theme.css'

type Artwork = (typeof catalog.assets)[number]

function Picture({ artwork, detail = false }: { artwork: Artwork; detail?: boolean }) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [visible, setVisible] = useState(detail)
  const stage = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (visible || !stage.current) return
    if (!('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '120px' },
    )
    observer.observe(stage.current)
    return () => observer.disconnect()
  }, [visible])
  return (
    <div
      ref={stage}
      className={detail ? 'art-stage detail-stage' : 'art-stage'}
      aria-busy={!loaded && !failed}
    >
      {failed ? (
        <p role="alert">
          预览加载失败。
          <Link href={artwork.original} target="_blank" rel="noreferrer">
            打开原图
          </Link>
        </p>
      ) : (
        <>
          {!loaded && (
            <span className="image-status" role="status">
              正在载入预览…
            </span>
          )}
          {visible && (
            <img
              src={detail ? artwork.detail : artwork.thumb}
              alt={artwork.name}
              width={artwork.width}
              height={artwork.height}
              loading={detail ? 'eager' : 'lazy'}
              decoding="async"
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
            />
          )}
        </>
      )}
    </div>
  )
}

function ArtworkCard({ artwork }: { artwork: Artwork }) {
  return (
    <article>
      <Card>
        <Card.Header>
          <Picture artwork={artwork} />
        </Card.Header>
        <Card.Content>
          <span className="collection-label">{artwork.collection}</span>
          <h2 className="art-title">{artwork.name}</h2>
          <p className="art-description">{artwork.note}</p>
        </Card.Content>
        <Card.Footer>
          <Modal>
            <Button variant="secondary" size="sm">
              放大预览
            </Button>
            <Modal.Backdrop>
              <Modal.Container size="cover" scroll="inside">
                <Modal.Dialog>
                  <Modal.CloseTrigger aria-label="关闭预览" />
                  <Modal.Header>
                    <Modal.Heading>{artwork.name}</Modal.Heading>
                    <p className="detail-meta">
                      {artwork.collection} · {artwork.width} × {artwork.height}
                    </p>
                  </Modal.Header>
                  <Modal.Body>
                    <Picture artwork={artwork} detail />
                    <p className="detail-note">{artwork.note}</p>
                  </Modal.Body>
                  <Modal.Footer>
                    <div className="download-links">
                      {artwork.svg && (
                        <Link href={artwork.svg} target="_blank" rel="noreferrer">
                          可编辑 SVG
                        </Link>
                      )}
                      <Link href={artwork.original} download>
                        {artwork.transparent ? '下载透明 PNG' : '下载原图'}
                      </Link>
                      {'page' in artwork && (
                        <Link href={String(artwork.page)} target="_blank" rel="noreferrer">
                          查看排版网页
                        </Link>
                      )}
                    </div>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        </Card.Footer>
      </Card>
    </article>
  )
}

const categories = catalog.categories
const initialCategory = new URLSearchParams(location.search).get('category')

function Gallery() {
  const [category, setCategory] = useState(
    categories.some((item) => item.id === initialCategory) ? initialCategory! : 'latest',
  )
  const [dark, setDark] = useState(
    new URLSearchParams(location.search).get('theme') === 'dark' ||
      (!new URLSearchParams(location.search).has('theme') &&
        matchMedia('(prefers-color-scheme: dark)').matches),
  )
  useEffect(() => {
    document.documentElement.className = dark ? 'dark' : 'light'
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  }, [dark])
  const artworkFor = (identity: string) =>
    catalog.assets.filter((asset) =>
      identity === 'latest'
        ? asset.latest
        : identity === 'new'
          ? asset.recent
          : asset.category === identity,
    )
  return (
    <main className="gallery-shell">
      <header className="gallery-header">
        <div>
          <p className="eyebrow">传统文化 · 原创代码绘画</p>
          <h1>纸上山河 · 作品画册</h1>
          <p className="gallery-intro">山水、古建、花木与人物，收在同一本画册里。</p>
        </div>
        <Button variant="secondary" size="sm" onPress={() => setDark(!dark)}>
          {dark ? '切换到浅色' : '切换到深色'}
        </Button>
      </header>
      <Tabs
        selectedKey={category}
        onSelectionChange={(key) => {
          setCategory(String(key))
          const url = new URL(location.href)
          url.searchParams.set('category', String(key))
          history.replaceState(null, '', url)
        }}
      >
        <div className="category-scroll">
          <Tabs.ListContainer>
            <Tabs.List aria-label="作品分类">
              {categories.map((item) => (
                <Tabs.Tab key={item.id} id={item.id}>
                  <span className="tab-label">
                    {item.name}
                    <span className="tab-count">{artworkFor(item.id).length}</span>
                  </span>
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </div>
        {categories.map((item) => (
          <Tabs.Panel key={item.id} id={item.id}>
            {category === item.id && (
              <>
                <div className="collection-summary" aria-live="polite">
                  <span>
                    {item.name} · {artworkFor(item.id).length} 幅
                  </span>
                  <span>轻量预览 · 点击放大 · 原文件可下载</span>
                </div>
                <div className="art-grid">
                  {artworkFor(item.id).map((artwork) => (
                    <ArtworkCard key={artwork.id} artwork={artwork} />
                  ))}
                </div>
              </>
            )}
          </Tabs.Panel>
        ))}
      </Tabs>
      <footer className="gallery-footer">
        纸底仅用于展示，透明素材保留独立图层。人物为原创历史文学意象，非真实肖像或服制复原。
      </footer>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<Gallery />)
