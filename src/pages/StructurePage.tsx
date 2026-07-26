import { Link } from "react-router-dom";
import { departments } from "../data/hierarchy";
import { Stamp } from "../components/Stamp";
import "./AboutPage.css";

export function StructurePage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Stamp>КНП · Слобідська МР · Структура</Stamp>
          <h1>Структура лікарні</h1>
          <p className="page-hero__lede">
            Усі служби, відділення та діагностичні напрямки лікарні.
          </p>
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