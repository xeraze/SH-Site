import { PortalLayout } from "../components/PortalLayout";
import "./Links.css";

const LINKS = [
  {
    title: "Discord Server",
    text: "Офіційний сервер медичного RP-проєкту «Слобідська ЦРЛ»",
    href: "https://discord.gg/eUBGT6yZAc",
  },
  {
    title: "Правила проєкту",
    text: "Правила проєкту «Слобідська ЦРЛ», які поширюються на спільноту Discord, гру та веб-портал",
    href: "https://docs.google.com/document/d/1hSPg5WpzAMpn48qgByT_SuPdIxpce66LkCSldv5Ne-w/edit?usp=sharing",
  },
  {
    title: "Roblox-гра «Слобідська ЦРЛ»",
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
    <PortalLayout title="Інше">
      <div className="p-block">
        <div className="p-block__head">Як отримати допомогу?</div>
        <div className="p-block__body">
          <p>
            Якщо ви граєте за пацієнта, достатньо приєднатися до сервера гри
            під час активної сесії та звернутися до медичного персоналу,
            присутнього на зміні. Медики діють у межах свого рівня підготовки
            та надають допомогу відповідно до ситуації вашого персонажа.
          </p>
          <p>
            Для заявок на посаду, звернень (скарг чи пропозицій) та записів на
            прийом використовуйте розділ «Анкети» на сайті. Після заповнення анкети оператор/перевіряльник зв'яжеться з вами для
            уточнення деталей та підтвердження вашого звернення/заявки або запису. Якщо ви бажаєте стати
            медичним працівником подайте заявку на посаду через розділ «Анкети».
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
