export enum Locale {
  EnglishUnitedStates = 'en-US',
  ChineseSimplified = 'zh-CN',
  Japanese = 'ja-JP',
  Korean = 'ko-KR',
  Vietnamese = 'vi-VN'
}

export const DEFAULT_LOCALE = Locale.EnglishUnitedStates

export const LOCALE_LABELS: Record<Locale, string> = {
  [Locale.EnglishUnitedStates]: 'English',
  [Locale.ChineseSimplified]: '中文',
  [Locale.Japanese]: '日本語',
  [Locale.Korean]: '한국어',
  [Locale.Vietnamese]: 'Tiếng Việt',
}