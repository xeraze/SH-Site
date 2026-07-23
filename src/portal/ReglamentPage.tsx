import { useState } from "react";
import { reglamentSections } from "../data/reglament";
import "./ReglamentPage.css";

export function ReglamentPage() {
  const [activeSection, setActiveSection] = useState(reglamentSections[0].id);

  function scrollToSection(id: string) {
    setActiveSection(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="reglament-page">
      <aside className="reglament-toc">
        <span className="eyebrow">Регламент</span>
        <h2>Зміст</h2>
        <nav>
          {reglamentSections.map((s) => (
            <button
              key={s.id}
              className={`reglament-toc__item${activeSection === s.id ? " reglament-toc__item--active" : ""}`}
              onClick={() => scrollToSection(s.id)}
            >
              <span>{s.number}</span>
              {s.title}
            </button>
          ))}
        </nav>
      </aside>

      <div className="reglament-content">
        <div className="reglament-content__head">
          <span className="eyebrow">Внутрішній розділ</span>
          <h1>Правила проєкту «Слобідська ЦРЛ»</h1>
          <p>
            Регламент обов'язковий до виконання для всього персоналу лікарні.
            Незнання правил не звільняє від відповідальності.
          </p>
        </div>

        {reglamentSections.map((section) => (
          <section id={`section-${section.id}`} className="reglament-section" key={section.id}>
            <h2>
              <span className="reglament-section__num">{section.number}.</span>
              {section.title}
            </h2>

            <ol className="reglament-points">
              {section.points.map((point) => (
                <li key={point.id}>{point.text}</li>
              ))}
            </ol>

            {section.list && (
              <div className="reglament-list">
                {section.list.intro && <p className="reglament-list__intro">{section.list.intro}</p>}
                <ul>
                  {section.list.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}