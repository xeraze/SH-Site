import { departments, roleHierarchy } from "../data/hierarchy";
import { Stamp } from "../components/Stamp";
import { pluralizePosady } from "../utils/pluralize";
import "./AboutPage.css";

export function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Stamp>КНП · Слобідська МР</Stamp>
          <span className="eyebrow">Про заклад</span>
          <h1>Про лікарню</h1>
          <p className="page-hero__lede">
            КНП «Слобідська ЦРЛ» СМР — медичний заклад, що об'єднує
            поліклінічну, стаціонарну та консультативно-діагностичну
            допомогу в межах рольового проєкту.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container about-grid">
          <div className="about-card">
            <span className="about-card__label">Повна назва</span>
            <p>
              Комунальне некомерційне підприємство «Слобідська центральна
              районна лікарня» Слобідської міської ради
            </p>
          </div>
          <div className="about-card">
            <span className="about-card__label">Скорочена назва</span>
            <p>КНП «СЦРЛ» СМР</p>
          </div>
          <div className="about-card">
            <span className="about-card__label">Форма власності</span>
            <p>Комунальне некомерційне підприємство</p>
          </div>
          <div className="about-card">
            <span className="about-card__label">Підпорядкування</span>
            <p>Слобідська міська рада</p>
          </div>
        </div>
      </section>

      <section className="section org-structure">
        <div className="container">
          <span className="eyebrow">Організаційна структура</span>
          <h2 className="departments__title">Рівні управління</h2>
          <p className="departments__lede">
            Лікарня має шестирівневу структуру підпорядкування — від Ради
            директорів до молодшого медичного персоналу.
          </p>

          <div className="org-ladder">
            {roleHierarchy.map((level, i) => (
              <div
                className="org-step"
                key={level.id}
                style={{
                  ["--level-accent" as string]: level.colorAccent,
                  width: `${100 - i * 9}%`,
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <span className="org-step__num">{i + 1}</span>
                <span className="org-step__label">{level.label}</span>
                <span className="org-step__count">
                  {level.roles.length} {pluralizePosady(level.roles.length)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section departments">
        <div className="container">
          <span className="eyebrow">Структура закладу</span>
          <h2 className="departments__title">Відділення лікарні</h2>
          <p className="departments__lede">
            Медична допомога в лікарні організована за відділеннями. Кожне з
            них очолює завідувач, відповідальний за якість та організацію
            роботи свого підрозділу.
          </p>

          <div className="departments__grid">
            {departments.map((dept, i) => (
              <div
                className="dept-card"
                key={dept.id}
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <span className="dept-card__index">{String(i + 1).padStart(2, "0")}</span>
                <h3>{dept.name}</h3>
                <p>{dept.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}