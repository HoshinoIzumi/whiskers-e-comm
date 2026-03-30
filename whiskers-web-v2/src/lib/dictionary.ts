export type DictionaryLang = 'en' | 'zh'

export type HomeDictionary = {
  home: {
    badge: string
    fridge_alt: string
    explore_btn: string
    visit_btn: string
  }
}

export type Dictionary = HomeDictionary & {
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

