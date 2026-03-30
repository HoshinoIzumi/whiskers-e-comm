import { useMemo } from 'react'
import { useLocation, useParams } from 'react-router-dom'

type Lang = 'en' | 'zh'

function useLang(): Lang {
  const params = useParams()
  const location = useLocation()
  return useMemo(() => {
    const raw = params.lang
    if (raw === 'zh') return 'zh'
    return location.pathname.startsWith('/zh') ? 'zh' : 'en'
  }, [location.pathname, params.lang])
}

export default function MenuPage() {
  const lang = useLang()
  const t = copy[lang]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="rounded-3xl border-2 border-gelato-blue/60 bg-white p-4 shadow-[0_10px_30px_rgba(39,145,203,0.15)]">
        <h1 className="text-center text-3xl font-black tracking-tight text-gelato-deep md:text-5xl">
          {t.title}
        </h1>
        <p className="mt-1 text-center text-sm text-foreground/80">{t.subtitle}</p>

        <div className="mt-6">
          <img
            src="/images/menu/menu-desktop.png"
            alt={t.desktopAlt}
            className="hidden w-full rounded-2xl border border-gelato-blue/30 md:block"
            loading="lazy"
          />
          <img
            src="/images/menu/menu-mobile.png"
            alt={t.mobileAlt}
            className="block w-full rounded-2xl border border-gelato-blue/30 md:hidden"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  )
}

const copy = {
  en: {
    title: 'Menu',
    subtitle: 'Tap image to zoom in on your device.',
    desktopAlt: 'Whiskers menu (desktop)',
    mobileAlt: 'Whiskers menu (mobile)',
  },
  zh: {
    title: '精选菜单',
    subtitle: '可在手机端放大查看菜单图片。',
    desktopAlt: 'Whiskers 菜单（桌面）',
    mobileAlt: 'Whiskers 菜单（移动）',
  },
} satisfies Record<
  Lang,
  {
    title: string
    subtitle: string
    desktopAlt: string
    mobileAlt: string
  }
>

