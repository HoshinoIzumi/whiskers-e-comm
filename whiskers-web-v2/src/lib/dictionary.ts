export type DictionaryLang = 'en' | 'zh'

export type HomeDictionary = {
  home: {
    badge: string
    fridge_alt: string
    explore_btn: string
    visit_btn: string
  }
}

export type FlavoursDictionary = {
  flavours: {
    title: string
    subtitle: string
    labels?: {
      allergy_notice?: string
    }
    categories: Record<
      string,
      { title: string; sticker: string; price_suffix?: string }
    >
  }
}

export type Dictionary = HomeDictionary &
  FlavoursDictionary & {
  site?: {
    shopName?: string
    tagline?: string
    address?: string
    hours?: Record<string, string>
  }
}


export async function getDictionary(lang: DictionaryLang): Promise<Dictionary> {
  const res = await fetch(`/dictionaries/${lang}.json`)
  if (!res.ok) {
    throw new Error(`Failed to load dictionary: ${lang}`)
  }
  return (await res.json()) as Dictionary
}

