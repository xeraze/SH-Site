import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { departments, roleHierarchy } from "../data/hierarchy";
import "./HomePage.css";

const totalRoles = roleHierarchy.reduce((sum, level) => sum + level.roles.length, 0);

const QUICK_LINKS = [
  {
    title: "Про лікарню",
    text: "Структура закладу, відділення та загальні відомості про КНП.",
    to: "/pro-likarniu",
    icon: "building",
  },
  {
    title: "Персонал",
    text: "Ієрархія посад — від молодшого персоналу до керівництва.",
    to: "/spivrobitnyky",
    icon: "people",
  },
  {
    title: "Контакти та звернення",
    text: "Як звернутися до медиків та подати заявку на сервері.",
    to: "/kontakty",
    icon: "message",
  },
];

const ICONS: Record<string, ReactElement> = {
  building: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 21V10a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v11" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 21h20" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M7 8h1M7 12h1M7 16h1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M15 13h1M15 17h1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  people: (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 20c0-3.5 2.6-6 5.5-6s5.5 2.5 5.5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="17" cy="7" r="2.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M15.5 20c-.2-2.7 1.3-5.2 3.8-5.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  message: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 5h16v11H9l-4 4V5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8 9.5h8M8 13h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
};

export function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__text">
            <span className="eyebrow">КНП «СЛОБІДСЬКА ЦРЛ» СМР</span>
            <h1 className="hero__title">
              Довідковий центр
              <br />
              Слобідської центральної <em>районної лікарні</em>
            </h1>
            <p className="hero__lede">
              Комунальне некомерційне підприємство «Слобідська центральна
              районна лікарня» Слобідської міської ради — медичний рольовий
              проєкт спільноти Roblox. Тут ви знайдете відомості про
              структуру лікарні, персонал та порядок звернення.
            </p>
            <div className="hero__actions">
              <Link to="/pro-likarniu" className="btn btn--primary">
                Про лікарню
              </Link>
              <Link to="/kontakty" className="btn btn--ghost">
                Як звернутися
              </Link>
            </div>

            <div className="hero__stats">
              <div className="hero__stat">
                <strong>{departments.length}</strong>
                <span>відділень</span>
              </div>
              <div className="hero__stat">
                <strong>{roleHierarchy.length}</strong>
                <span>рівнів ієрархії</span>
              </div>
              <div className="hero__stat">
                <strong>{totalRoles}</strong>
                <span>штатних посад</span>
              </div>
            </div>
          </div>

          <div className="hero__emblem-wrap">
            <img src="/SH-Site/emblem.png" alt="Герб" className="hero__emblem" />
            <div className="hero__id-card">
              <span className="hero__id-card__row">
                <span>Тип закладу</span>
                <strong>КНП</strong>
              </span>
              <span className="hero__id-card__row">
                <span>Підпорядкування</span>
                <strong>Слобідська МР</strong>
              </span>
              <span className="hero__id-card__row">
                <span>Статус</span>
                <strong className="hero__id-card__status">Діє</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section quick-links">
        <div className="container">
          <div className="quick-links__grid">
            {QUICK_LINKS.map((item, i) => (
              <Link
                to={item.to}
                key={item.title}
                className={`quick-card${i === 0 ? " quick-card--featured" : ""}`}
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span className="quick-card__icon">{ICONS[item.icon]}</span>
                <h3 className="quick-card__title">{item.title}</h3>
                <p className="quick-card__text">{item.text}</p>
                <span className="quick-card__arrow" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section info-band">
        <div className="container info-band__inner">
          <div className="info-band__card">
            <span className="eyebrow">Для пацієнтів</span>
            <h2>Звернення до медичного персоналу</h2>
            <p>
              Щоб отримати допомогу, достатньо приєднатися до сервера гри та
              звернутися до медичного персоналу, присутнього на зміні.
              Розклад ігрових сесій та актуальні події публікуються на
              Discord-сервері проєкту.
            </p>
            <a
              href="https://discord.com/channels/1465334351452569800/1465695682227601704"
              target="_blank"
              rel="noreferrer"
              className="btn btn--outline"
            >
              Графік сесій у Discord
            </a>
          </div>

          <div className="info-band__card info-band__card--accent">
            <span className="eyebrow">Для майбутнього персоналу</span>
            <h2>Приєднатися до штату лікарні</h2>
            <p>
              Бажаєте отримати роль медичного чи допоміжного персоналу?
              Ознайомтеся з ієрархією посад та подайте заявку через центр
              підтримки на Discord-сервері.
            </p>
            <div className="info-band__actions">
              <Link to="/spivrobitnyky" className="btn btn--primary">
                Ієрархія посад
              </Link>
              <a
                href="https://discord.com/channels/1465334351452569800/1466418410035482706"
                target="_blank"
                rel="noreferrer"
                className="btn btn--ghost"
              >
                Подати заявку
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}