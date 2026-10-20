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
              {departments.slice(0, 8).map((dept) => (
                <li key={dept.id}>
                  <Link to={`/viddilennya/${dept.id}`} className="portal-menu__link">
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
                Запишіться на прийом онлайн — оберіть відділення, бажану дату
                та час.
              </p>
              <Link to="/zapys-na-pryiom" className="portal-cta">
                Записатися
              </Link>
            </div>
          </div>

          <div className="portal-box">
            <div className="portal-box__head">Про проєкт</div>
            <div className="portal-box__body portal-box__body--text">
              <p>
                КНП "Слобідська ЦРЛ" СМР — медичний рольовий проєкт спільноти
                Roblox. Офіційний веб-портал для пацієнтів та учасників.
              </p>
            </div>
          </div>

          {aside}
        </aside>
      </div>
    </div>
  );
}
