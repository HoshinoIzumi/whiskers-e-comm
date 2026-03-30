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

export default function OrderOnlinePage() {
  const lang = useLang()
  const t = copy[lang]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="overflow-hidden rounded-3xl border-2 border-gelato-blue/60 bg-white shadow-[0_10px_30px_rgba(39,145,203,0.15)]">
        <div className="border-b-2 border-gelato-blue/60 bg-gelato-blue/40 px-6 py-4">
          <h1 className="text-center text-3xl font-black tracking-tight text-gelato-deep md:text-5xl">
            {t.title}
          </h1>
          <p className="mt-1 text-center text-sm text-foreground/80">{t.subtitle}</p>
        </div>

        <div className="grid gap-0 md:grid-cols-[1.15fr_1fr_0.9fr]">
          <section className="border-b border-gelato-blue/40 px-5 py-6 md:border-r md:border-b-0">
            <h2 className="text-xl font-black text-gelato-deep">🍨 {t.gelatoTitle}</h2>
            <p className="mt-1 text-sm text-foreground/80">{t.gelatoSub}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-gelato-blue/40 bg-gelato-blue/10 p-3">
                <p className="text-sm font-bold text-gelato-deep">{t.regular}</p>
                <p className="mt-1 text-xl font-black">$7.00</p>
                <p className="text-xs text-foreground/70">{t.regularDesc}</p>
              </div>
              <div className="rounded-2xl border border-gelato-blue/40 bg-gelato-blue/10 p-3">
                <p className="text-sm font-bold text-gelato-deep">{t.large}</p>
                <p className="mt-1 text-xl font-black">$9.00</p>
                <p className="text-xs text-foreground/70">{t.largeDesc}</p>
              </div>
            </div>

            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-foreground/80">
              {t.gelatoNotes.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </section>

          <section className="border-b border-gelato-blue/40 px-5 py-6 md:border-r md:border-b-0">
            <h2 className="text-xl font-black text-gelato-deep">🥤 {t.milkTeaTitle}</h2>
            <p className="mt-1 text-sm text-foreground/80">{t.milkTeaSub}</p>
            <p className="mt-3 text-2xl font-black text-gelato-deep">$9.00</p>
            <p className="text-xs text-foreground/70">{t.milkTeaPriceNote}</p>

            <div className="mt-5 rounded-2xl border border-gelato-blue/40 bg-gelato-blue/10 p-4">
              <p className="text-sm font-bold text-gelato-deep">{t.steps}</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-foreground/80">
                <li>{t.step1}</li>
                <li>{t.step2}</li>
              </ol>
            </div>
          </section>

          <section className="px-5 py-6">
            <div className="rounded-2xl border border-gelato-blue/40 bg-white p-4">
              <h2 className="text-xl font-black text-gelato-deep">☕ {t.coffeeTitle}</h2>
              <p className="mt-1 text-sm text-foreground/80">{t.coffeeSub}</p>
              <div className="mt-4 space-y-2 text-sm">
                {t.coffeeItems.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3 border-b border-gelato-blue/20 pb-1"
                  >
                    <span>{item.name}</span>
                    <span className="font-bold text-gelato-deep">{item.price}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-foreground/70">{t.coffeeNote}</p>
            </div>

            <div className="mt-4 rounded-2xl border border-gelato-blue/40 bg-gelato-yellow/20 p-4">
              <h3 className="text-lg font-black text-gelato-deep">🍮 {t.affogatoTitle}</h3>
              <p className="mt-1 text-sm text-foreground/80">{t.affogatoSub}</p>
              <p className="mt-2 text-lg font-black text-gelato-deep">{t.affogatoNote}</p>
            </div>

            <div className="mt-4 rounded-2xl border-2 border-gelato-blue/50 bg-gelato-cream p-4">
              <h3 className="text-lg font-black text-gelato-deep">🧊 {t.takeawayTitle}</h3>
              <p className="mt-2 text-lg font-black text-gelato-deep">$32.00 / 500ml</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-foreground/80">
                <li>{t.takeawayMaxFlavours}</li>
                <li>{t.takeawayCoolerBag}</li>
                <li>{t.takeawayPremiumExtra}</li>
              </ul>
            </div>
          </section>
        </div>

        <div className="border-t border-gelato-blue/40 bg-gelato-pink/25 px-5 py-3 text-sm text-foreground/85">
          ⚠️ {t.allergy}
        </div>
      </div>
    </div>
  )
}

const copy = {
  en: {
    title: 'Order Online',
    subtitle: 'In-store menu essentials for gelato, drinks, and takeaway.',
    gelatoTitle: 'Gelato & Sorbet',
    gelatoSub: 'Artisan Italian-style gelato & sorbet',
    regular: 'Regular',
    regularDesc: '1 flavor, approx. 100g (cup or cone)',
    large: 'Large',
    largeDesc: 'Max 2 flavors, approx. 150g (cup or cone)',
    gelatoNotes: [
      'Cup or cone available',
      'Some premium flavours require extra fee',
      'Add-ons are subject to in-store availability',
    ],
    milkTeaTitle: 'Fresh Brew Milk Tea',
    milkTeaSub: 'Freshly brewed milk tea',
    milkTeaPriceNote: 'per cup, approx. 500ml',
    steps: 'Steps',
    step1: 'Choose the tea base',
    step2: 'Choose sugar / ice level',
    coffeeTitle: 'Coffee',
    coffeeSub: 'Classic options',
    coffeeItems: [
      { name: 'Espresso', price: '$4.50' },
      { name: 'Long Black', price: '$5.00 (H) / $5.50 (C)' },
      { name: 'Latte', price: '$5.50 (H) / $7.00 (C)' },
      { name: 'Flat White', price: '$5.50' },
      { name: 'Ice Coffee', price: '$11.00' },
    ],
    coffeeNote: 'choose your gelato (optional)',
    affogatoTitle: 'Signature Affogato',
    affogatoSub: 'choose your gelato',
    affogatoNote: '$11.00 / serve',
    takeawayTitle: 'Takeaway Container',
    takeawayMaxFlavours: 'Maximum 3 flavours',
    takeawayCoolerBag: 'Extra $0.50 for cooler bag',
    takeawayPremiumExtra: 'Extra $2 per premium flavour',
    allergy: 'Please let us know if you have any food allergies.',
  },
  zh: {
    title: '在线下单',
    subtitle: '门店常规菜单：冰淇淋、饮品与外带盒。',
    gelatoTitle: '意式手工冰淇淋 & 雪芭',
    gelatoSub: 'Gelato & Sorbet',
    regular: 'Regular（单球）',
    regularDesc: '1 种口味，约 100g（杯/筒）',
    large: 'Large（双球）',
    largeDesc: '最多 2 种口味，约 150g（杯/筒）',
    gelatoNotes: ['可选杯或蛋筒', '部分 premium 口味需加价', '具体 add-on 以门店为准'],
    milkTeaTitle: '杯杯现泡鲜奶茶',
    milkTeaSub: 'Fresh Brew Milk Tea',
    milkTeaPriceNote: '每杯约 500ml',
    steps: '步骤',
    step1: '选择茶底',
    step2: '选择糖度 / 冰量',
    coffeeTitle: '咖啡',
    coffeeSub: 'Coffee',
    coffeeItems: [
      { name: 'Espresso', price: '$4.50' },
      { name: 'Long Black', price: '$5.00 (热) / $5.50 (冷)' },
      { name: 'Latte', price: '$5.50 (热) / $7.00 (冷)' },
      { name: 'Flat White', price: '$5.50' },
      { name: 'Ice Coffee', price: '$11.00' },
    ],
    coffeeNote: '可选冰淇淋',
    affogatoTitle: '阿芙佳朵',
    affogatoSub: 'choose your gelato（可选冰淇淋）',
    affogatoNote: '$11.00 / 份',
    takeawayTitle: '外带盒',
    takeawayMaxFlavours: '最多 3 种口味',
    takeawayCoolerBag: '冷藏袋另加 $0.50',
    takeawayPremiumExtra: '每种 premium 口味另加 $2',
    allergy: '请告知食物过敏信息。',
  },
} satisfies Record<
  Lang,
  {
    title: string
    subtitle: string
    gelatoTitle: string
    gelatoSub: string
    regular: string
    regularDesc: string
    large: string
    largeDesc: string
    gelatoNotes: string[]
    milkTeaTitle: string
    milkTeaSub: string
    milkTeaPriceNote: string
    steps: string
    step1: string
    step2: string
    coffeeTitle: string
    coffeeSub: string
    coffeeItems: { name: string; price: string }[]
    coffeeNote: string
    affogatoTitle: string
    affogatoSub: string
    affogatoNote: string
    takeawayTitle: string
    takeawayMaxFlavours: string
    takeawayCoolerBag: string
    takeawayPremiumExtra: string
    allergy: string
  }
>

