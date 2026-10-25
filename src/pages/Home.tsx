import { Link } from 'react-router-dom';
import { ArrowRight, Clapperboard, FlaskConical, Globe2, Languages, Sparkles } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { useApp } from '../lib/AppContext';
import { useLang } from '../lib/i18n';
import YouTubeGallery from '../components/YouTubeGallery';
import { COMPANY_SITE } from '../lib/socials';

function Hero() {
  const { settings, audience } = useApp();
  const { t, lang } = useLang();
  const defaultMsg = t(
    "We're currently testing the site in closed beta. While we license and prepare our own titles for release, enjoy everything we've produced so far — streamed right here from our YouTube channel.",
    '現在、本サイトはクローズドベータ版としてテスト中です。自社タイトルのライセンス取得と配信準備を進める間、これまでに制作したすべての動画をYouTubeチャンネルからお楽しみください。',
  );
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 grid-bg" />
      <div className="container mx-auto px-4 py-16 sm:py-24 relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary mb-6">
          <FlaskConical className="h-3.5 w-3.5" />
          <span className="font-tech uppercase tracking-widest text-[0.6rem]">{t('Closed Beta', 'クローズドベータ')}</span>
        </div>
        <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl leading-[0.92] max-w-4xl">
          Press Play. <span className="text-gradient">{t('Anime, Officially.', 'アニメを、公式に。')}</span>
        </h1>
        <p className="mt-6 text-muted-foreground text-lg max-w-2xl">
          {(lang === 'en' && settings.beta_message) || defaultMsg}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="font-tech text-xs uppercase tracking-widest">
            <a href="#videos">{t('Watch now', '今すぐ視聴')} <ArrowRight className="h-4 w-4" /></a>
          </Button>
          {audience === 'licensor' && (
            <Button asChild size="lg" variant="outline"><Link to="/licensor">{t('Open Licensor Hub', 'ライセンサーハブを開く')}</Link></Button>
          )}
        </div>
      </div>
    </section>
  );
}

const PILLARS = [
  { icon: Languages, en: ['Localization', 'Subtitling, English dubbing and cultural adaptation done with care by fans who are also professionals.'], ja: ['ローカライズ', 'ファンでありプロでもあるスタッフが、字幕・英語吹替・文化的な翻案を丁寧に手がけます。'] },
  { icon: Globe2, en: ['Licensing & Distribution', 'We work directly with Japanese rights holders to bring feature films and series to English-speaking audiences.'], ja: ['ライセンス・配給', '日本の権利者と直接連携し、劇場作品やシリーズを英語圏の視聴者に届けます。'] },
  { icon: Clapperboard, en: ['Community-Funded', 'Fans help greenlight new releases through crowdfunding — you decide what comes next.'], ja: ['ファン支援型', 'クラウドファンディングを通じて、次にリリースする作品をファンの皆さんと一緒に決めます。'] },
];

function About() {
  const { audience } = useApp();
  const { t, lang } = useLang();
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="eyebrow mb-4">{t('Who We Are', '私たちについて')}</div>
      <h2 className="font-display text-5xl sm:text-6xl max-w-3xl">{t('Bringing anime to the world, officially.', 'アニメを、公式に世界へ。')}</h2>
      <p className="mt-4 text-muted-foreground max-w-2xl">
        {t(
          'Press Play International Media licenses, localizes, and distributes anime for English-speaking audiences — working directly with rights holders to bring exceptional stories to a global audience.',
          'Press Play International Mediaは、英語圏の視聴者に向けてアニメのライセンス取得・ローカライズ・配給を行っています。権利者と直接協力し、優れた作品を世界中に届けます。',
        )}
      </p>
      <div className="grid md:grid-cols-3 gap-4 mt-10">
        {PILLARS.map((p) => {
          const [title, body] = p[lang];
          return (
            <div key={p.en[0]} className="neon-card p-6">
              <p.icon className="h-6 w-6 text-primary mb-4" />
              <h3 className="font-display text-2xl">{title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{body}</p>
            </div>
          );
        })}
      </div>
      <div className={`mt-8 neon-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${audience === 'licensor' ? 'border-primary/60' : ''}`}>
        <div className="flex gap-3">
          <Sparkles className="h-5 w-5 text-primary shrink-0 mt-1" />
          <div>
            <p className="font-medium">{t('Rights holders & licensors', '権利者・ライセンサーの皆さまへ')}</p>
            <p className="text-sm text-muted-foreground">{t('Looking for a localization partner? Visit our company website to get in touch about partnering with us.', 'ローカライズのパートナーをお探しですか？提携のご相談は当社ウェブサイトからお問い合わせください。')}</p>
          </div>
        </div>
        <Button asChild variant="outline"><a href={COMPANY_SITE} target="_blank" rel="noopener noreferrer">pressplayanime.neocities.org</a></Button>
      </div>
    </section>
  );
}

export default function Home() {
  const { canSee } = useApp();
  const { t } = useLang();
  return (
    <>
      <Hero />
      {canSee('youtube') && (
        <section id="videos" className="container mx-auto px-4 py-16 scroll-mt-20">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <div className="eyebrow mb-3">{t('From Our Channel', 'チャンネルから')}</div>
              <h2 className="font-display text-5xl">{t("Watch What We've Made", '私たちの作品をご覧ください')}</h2>
            </div>
            <Button asChild variant="ghost" className="hidden sm:flex"><Link to="/videos">{t('See all', 'すべて見る')} <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
          <YouTubeGallery limit={8} />
          <Button asChild variant="outline" className="mt-6 sm:hidden w-full"><Link to="/videos">{t('See all videos', 'すべての動画を見る')}</Link></Button>
        </section>
      )}
      {canSee('about') && <About />}
    </>
  );
}
