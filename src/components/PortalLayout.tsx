import type { ReactNode } from "react";
import { Link } from "../components/AppLink";
import { departments } from "../data/hierarchy";
import "./PortalLayout.css";

interface PortalLayoutProps {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}

export function PortalLayout({ title, children, aside }: PortalLayoutProps) {
  return (
    <div className="portal">
      <div className="container portal__crumbs">
        <Link to="/">Головна</Link>
        <span aria-hidden="true">›</span>
        <span>{title}</span>
      </div>

      <div className="container portal__grid">
        <aside className="portal__left">
          <div className="portal-box">
            <div className="portal-box__head">Відділення</div>
            <ul className="portal-menu">
              {departments.map((dept) => (
                <li key={dept.id}>
                  <Link to={`/departments/${dept.id}`} className="portal-menu__link">
                    <span className="portal-menu__marker" aria-hidden="true">
                      ▸
                    </span>
                    {dept.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="portal__main">
          <h1 className="portal__title">{title}</h1>
          {children}
        </main>

        <aside className="portal__right">
          <div className="portal-box">
            <div className="portal-box__head">Запис на прийом</div>
            <div className="portal-box__body portal-box__body--text">
              <p>
                Запишіться на прийом онлайн! Оберіть бажану дату та час,
                а оператор кол-центру підтвердить запис.
              </p>
              <Link to="/forms?type=appointment" className="portal-cta">
                Записатися
              </Link>
            </div>
          </div>

          <div className="portal-box">
            <div className="portal-box__head">Про проєкт</div>
            <div className="portal-box__body portal-box__body--text">
              <p>
                Слобідська ЦРЛ — медичний рольовий проєкт, розроблений на платформі
                Roblox, який відтворює роботу української лікарні. Ми фокусуємося на реалізмі та атмосферній грі.
Як пацієнт: просто загляньте у гру. Ви можете звертатися до медиків за допомогою, коли вони присутні на зміні.
Як медик: хочете рятувати життя, ставити діагнози та керувати процесами? Подавайте заявку на відповідну роль у грі на нашому сайті.
              </p>
            </div>
          </div>

          {aside}
        </aside>
      </div>
    </div>
  );
}
