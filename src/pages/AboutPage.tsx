import { Link } from "react-router-dom";
import { departments } from "../data/hierarchy";
import { Stamp } from "../components/Stamp";
import "./AboutPage.css";

export function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Stamp>КНП · Слобідська МР · Про заклад</Stamp>
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
              <Link
                to={`/spivrobitnyky/${dept.id}`}
                className="dept-card"
                key={dept.id}
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <span className="dept-card__index">{String(i + 1).padStart(2, "0")}</span>
                <h3>{dept.name}</h3>
                <p>{dept.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}