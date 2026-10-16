import { useCallback, useEffect, useState } from "react";
import { fetchAnnouncements, type PublicAnnouncement } from "../api";
import { renderInline } from "../components/annMarkdown";
import { Link } from "../components/AppLink";
import { PortalLayout } from "../components/PortalLayout";
import { departments } from "../data/hierarchy";
import "./HomePage.css";

const TICKER_PLACEHOLDER =
  "Тут відображуються короткі оголошення! Додайте їх у кабінеті, розділ «Оголошення».";

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

  const loadAnnouncements = useCallback(async () => {
    const items = await fetchAnnouncements();
    const shorts = items
      .filter((a) => a.type === "short" && a.text.length <= 80)
      .slice(0, 5)
      .map((a) => a.text);
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

  const marqueeParts: React.ReactNode[] =
    marqueeItems.length > 0 ? marqueeItems : [TICKER_PLACEHOLDER];

  const renderMarquee = (keyPrefix: string) => (
    <span>
      {marqueeParts.map((part, i) => (
        <span key={`${keyPrefix}-${i}`}>
          {i > 0 && "  ***  "}
          {renderInline(part, `${keyPrefix}-${i}`)}
        </span>
      ))}
      {"  ***  "}
    </span>
  );

  return (
    <PortalLayout
      title="Головна сторінка"
    >
      <div className="home-marquee" role="note">
        <span className="home-marquee__label">УВАГА!</span>
        <div className="home-marquee__track">
          {renderMarquee("a")}
          <span aria-hidden="true">{renderMarquee("b")}</span>
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
