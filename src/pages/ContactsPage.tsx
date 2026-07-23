import { Stamp } from "../components/Stamp";
import "./ContactsPage.css";

const LINKS = [
  {
    title: "Центр підтримки",
    text: "Заявки на посаду, скарги та пропозиції щодо роботи лікарні.",
    href: "https://discord.com/channels/1465334351452569800/1466418410035482706",
  },
  {
    title: "Графік ігрових сесій",
    text: "Актуальний розклад запланованих сесій та подій проєкту.",
    href: "https://discord.com/channels/1465334351452569800/1465695682227601704",
  },
  {
    title: "Список ролей у RP",
    text: "Повний перелік ролей на Discord-сервері спільноти.",
    href: "https://discord.com/channels/1465334351452569800/1466418240577339586",
  },
  {
    title: "Гра в Roblox",
    text: "Приєднатися до ігрового світу «Слобідська ЦРЛ».",
    href: "https://www.roblox.com/share?code=9687247321d6614a842c75669b6f7218&type=ExperienceDetails",
  },
  {
    title: "Група в Roblox",
    text: "Вступіть до групи, щоб отримати роль молодшого персоналу без заявки.",
    href: "https://www.roblox.com/share/g/558657762",
  },
];

export function ContactsPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Stamp>Discord · Roblox</Stamp>
          <span className="eyebrow">Звернення</span>
          <h1>Контакти та звернення</h1>
          <p className="page-hero__lede">
            Всі звернення пацієнтів та учасників проєкту відбуваються через
            ігровий сервер та Discord-спільноту лікарні.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container contacts-grid">
          <div className="contacts-note">
            <h2>Як звернутися по допомогу</h2>
            <p>
              Якщо ви граєте за пацієнта, достатньо приєднатися до сервера
              гри під час активної сесії та звернутися до медичного
              персоналу, присутнього на зміні. Медики діють у межах свого
              рівня підготовки та надають допомогу відповідно до ситуації
              вашого персонажа.
            </p>
            <p>
              Для заявок на посаду, скарг або пропозицій використовуйте
              центр підтримки на Discord-сервері — там же можна ознайомитися
              з детальним списком ролей та порядком подачі заявки.
            </p>
          </div>

          <div className="contacts-links">
            {LINKS.map((link) => (
              <a
                key={link.title}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="contact-card"
              >
                <div>
                  <h3>{link.title}</h3>
                  <p>{link.text}</p>
                </div>
                <svg viewBox="0 0 16 16" fill="none" className="contact-card__arrow">
                  <path d="M3.5 12.5l9-9M6 3.5h6.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}