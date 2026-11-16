import { PortalLayout } from "../components/PortalLayout";
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
    text: "Приєднатися до ігрового світу \"Слобідська ЦРЛ\".",
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
    <PortalLayout title="Контакти та звернення">
      <div className="p-block">
        <div className="p-block__head">Як звернутися по допомогу</div>
        <div className="p-block__body">
          <p>
            Якщо ви граєте за пацієнта, достатньо приєднатися до сервера гри
            під час активної сесії та звернутися до медичного персоналу,
            присутнього на зміні. Медики діють у межах свого рівня підготовки
            та надають допомогу відповідно до ситуації вашого персонажа.
          </p>
          <p>
            Для заявок на посаду, скарг або пропозицій використовуйте розділ
            "Заявки" на сайті або центр підтримки на Discord-сервері.
          </p>
        </div>
      </div>

      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Корисні посилання</div>
        <ul className="contacts-links">
          {LINKS.map((link) => (
            <li key={link.title}>
              <a href={link.href} target="_blank" rel="noreferrer" className="contacts-links__item">
                <span className="contacts-links__marker" aria-hidden="true">
                  ▸
                </span>
                <span className="contacts-links__text">
                  <strong>{link.title}</strong>
                  <span>{link.text}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </PortalLayout>
  );
}
