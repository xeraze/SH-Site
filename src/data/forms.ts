export interface FormField {
  label: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
}

export interface ApplicationForm {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
}

export const APPLICATION_FORMS: ApplicationForm[] = [
  {
    id: "job_application",
    title: "Заявка на посаду",
    description: "Подайте заявку, щоб отримати посаду в нашій лікарні. Roblox Username береться з профілю.",
    fields: [
      { label: "Ваша спеціалізація за номенклатурою", required: true },
      {
        label: "Джерело вашої теоретичної бази (звідки походять ваші медичні знання за цією спеціальністю)",
        multiline: true,
        required: true,
      },
      {
        label: "Актуальний рівень базових знань для зарахування на інтернатуру (не обов'язково заповнювати середньому медичному персоналу)",
        placeholder:
          "Опишіть теоретичну базу за обраним напрямком, якою ви вже володієте і готові продемонструвати. Основи збору анамнезу, схеми первинного огляду та загальні принципи діагностики",
        multiline: true,
        required: false,
      },
      { label: "Чи є ви учасником нашої групи Roblox?", placeholder: "Так / Ні", required: true },
    ],
  },
  {
    id: "appeal",
    title: "Апеляція покарання",
    description: "Оскаржте покарання, якщо вважаєте його несправедливим. Roblox Username береться з профілю.",
    fields: [
      { label: "Отримане покарання та його причина", multiline: true, required: true },
      { label: "Детальний опис ситуації з вашого боку", multiline: true, required: false },
      { label: "Чому покарання варто зняти чи пом'якшити?", placeholder: "Обґрунтуйте свою позицію", multiline: true, required: true },
    ],
  },
  {
    id: "player_complaint",
    title: "Скарга на гравця",
    description: "Поскаржтеся на порушення правил іншим гравцем. Roblox Username порушника вказуйте в полі нижче; ваш — з профілю.",
    fields: [
      { label: "Roblox або Discord порушника", placeholder: "@username / ID", required: true },
      { label: "Яке правило було порушено та коли?", placeholder: "Суть ситуації", multiline: true, required: true },
      { label: "Наявність доказів", placeholder: "Так / Ні", required: true },
    ],
  },
  {
    id: "bug_report",
    title: "Повідомлення про помилку",
    description: "Повідомте про помилку або баг, який ви виявили.",
    fields: [
      { label: "Місце виявлення багу", placeholder: "Discord-сервер чи Roblox-плейс", required: true },
      { label: "Детальний опис проблеми", placeholder: "Як відтворився баг?", multiline: true, required: true },
      { label: "Наявність фото/відео фіксації", placeholder: "Так / Ні", required: true },
    ],
  },
  {
    id: "idea",
    title: "Ідея / Пропозиція",
    description: "Поділіться ідеєю або пропозицією щодо проєкту.",
    fields: [
      { label: "Тема пропозиції", placeholder: "Коротка тема ідеї", required: true },
      { label: "Опис пропозиції", placeholder: "Опишіть ідею максимально детально", multiline: true, required: true },
    ],
  },
  {
    id: "question",
    title: "Запитання",
    description: "Поставте запитання до дирекції сервера.",
    fields: [
      { label: "Тема звернення (коротко)", placeholder: "Коротка тема", required: true },
      { label: "Суть запитання (розгорнуто та з деталями)", multiline: true, required: true },
    ],
  },
];
