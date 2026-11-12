import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAnnouncements, type PublicAnnouncement } from "../api";
import { renderInline, stripShortFormatting } from "../components/annMarkdown";
import { Link } from "../components/AppLink";
import { PortalLayout } from "../components/PortalLayout";
import { departments } from "../data/hierarchy";
import "./HomePage.css";

const TICKER_PLACEHOLDER =
  "Тут відображуються короткі оголошення! Додайте їх у кабінеті, розділ «Оголошення».";

const MARQUEE_SPEED_PX_S = 60;
const MARQUEE_MIN_DURATION_S = 8;
const MARQUEE_MAX_DURATION_S = 60;

const INFO_LINKS = [
  { to: "/dlya-pacientiv", label: "Порядок звернення до лікаря" },
  { to: "/dlya-pacientiv", label: "Вартість послуг" },
  { to: "/pro-likarniu", label: "Про заклад" },
  { to: "/viddilennya", label: "Структура та персонал" },
  { to: "/zayavky", label: "Подати електронну заявку" },
  { to: "/kontakty", label: "Контакти та реквізити" },
];

export function HomePage() {
  const [marqueeItems, setMarqueeItems] = useState<string[]>([]);
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
  const [marqueeCopies, setMarqueeCopies] = useState(3);
  const [marqueeDuration, setMarqueeDuration] = useState(18);
  const trackRef = useRef<HTMLDivElement>(null);

  const loadAnnouncements = useCallback(async () => {
    const items = await fetchAnnouncements();
    const shorts = items
      .filter((a) => a.type === "short" && a.text.length <= 80)
      .slice(0, 5)
      .map((a) => stripShortFormatting(a.text));
    setMarqueeItems(shorts);
    setAnnouncements(
      items
        .filter((a) => a.type === "regular" && a.category !== "archive")
        .slice(0, 5),
    );
  }, []);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  const marqueeTexts = marqueeItems.length > 0 ? marqueeItems : [TICKER_PLACEHOLDER];

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      const first = el.querySelector<HTMLElement>(".home-marquee__group");
      if (!first) return;
      const w = first.getBoundingClientRect().width;
      if (w < 4) return;
      const need = Math.ceil(el.clientWidth / w) + 1;
      setMarqueeCopies(need > 12 ? 12 : Math.max(2, need));
      const dur = w / MARQUEE_SPEED_PX_S;
      setMarqueeDuration(
        Math.min(MARQUEE_MAX_DURATION_S, Math.max(MARQUEE_MIN_DURATION_S, dur)),
      );
    };
    measure();
    window.addEventListener("resize", measure);
    if (document.fonts?.ready) void document.fonts.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, [marqueeItems]);

  const renderMarqueeGroup = (copy: number) => (
    <span
      key={copy}
      className="home-marquee__group"
      style={{ animationDuration: `${marqueeDuration}s` }}
      aria-hidden={copy > 0 || undefined}
    >
      {marqueeTexts.map((part, i) => (
        <span key={`${copy}-${i}`} className="home-marquee__unit">
          {i > 0 && <span className="home-marquee__sep">•</span>}
          {renderInline(part, `m-${copy}-${i}`)}
        </span>
      ))}
      <span className="home-marquee__sep">•</span>
    </span>
  );

  return (
    <PortalLayout
      title="Головна сторінка"
    >
      <div className="home-marquee" role="note">
        <span className="home-marquee__label">УВАГА!</span>
        <div className="home-marquee__track" ref={trackRef}>
          {Array.from({ length: marqueeCopies }, (_, c) => renderMarqueeGroup(c))}
        </div>
      </div>

      <p className="p-lead">
        Комунальне некомерційне підприємство "Слобідська центральна районна
        лікарня" Слобідської міської ради — медичний рольовий проєкт спільноти
        Roblox. Тут ви знайдете відомості про структуру лікарні, персонал та
        порядок звернення.
      </p>

      <div className="home-stats home-stats--two">
        <div className="home-stats__item">
          <strong>{departments.length}</strong>
          <span>відділень</span>
        </div>
        <div className="home-stats__item">
          <strong>24/7</strong>
          <span>прийом звернень</span>
        </div>
      </div>

      <div className="p-block">
        <div className="p-block__head">
          <span>Останні новини та оголошення</span>
          <Link to="/oholoshennya" className="p-block__more">
            прочитати всі
          </Link>
        </div>
        {announcements.length === 0 ? (
          <p className="ann-empty">Поки що пусто</p>
        ) : (
          <ul className="home-news">
            {announcements.map((a) => (
              <li key={a.id} className="home-news__item">
                <span className="p-date">{a.createdAt.slice(0, 10)}</span>
                <div className="home-news__text">
                  <Link to={`/oholoshennya/${a.id}`} className="home-news__title">
                    {a.title || a.summary || a.text.slice(0, 60)}
                  </Link>
                  <p>{a.summary || a.text}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="home-cols">
        <div className="p-block">
          <div className="p-block__head p-block__head--teal">Для пацієнтів</div>
          <div className="p-block__body">
            <p>
              Щоб отримати допомогу, приєднайтеся до сервера гри та
              зверніться до медичного персоналу на зміні. Розклад сесій
              публікується у Discord-спільноті.
            </p>
            <Link to="/dlya-pacientiv" className="portal-cta">
              Інформація для пацієнтів
            </Link>
          </div>
        </div>

        <div className="p-block">
          <div className="p-block__head p-block__head--teal">Майбутньому персоналу</div>
          <div className="p-block__body">
            <p>
              Бажаєте отримати роль медичного чи допоміжного персоналу?
              Ознайомтеся зі структурою та подайте заявку онлайн.
            </p>
            <Link to="/zayavky" className="portal-cta">
              Подати заявку на посаду
            </Link>
          </div>
        </div>
      </div>

      <div className="p-block">
        <div className="p-block__head">Корисна інформація</div>
        <ul className="home-info">
          {INFO_LINKS.map((link) => (
            <li key={link.label}>
              <Link to={link.to}>
                <span className="home-info__marker" aria-hidden="true">
                  ▸
                </span>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PortalLayout>
  );
}
