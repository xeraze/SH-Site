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
    description: "Подайте заявку, щоб отримати посаду в нашій лікарні.",
    fields: [
      { label: "Ваш нікнейм у Roblox", placeholder: "@username", required: true },
      { label: "Бажана посада", placeholder: "Медична сестра / Санітар / Інше", required: true },
      { label: "Ваш досвід у RolePlay", placeholder: "Опишіть максимально розгорнуто", multiline: true, required: true },
      { label: "Чи перебуваєте ви у нашій Roblox-групі?", placeholder: "Так / Ні", required: true },
    ],
  },
  {
    id: "appeal",
    title: "Апеляція покарання",
    description: "Оскаржте покарання, якщо вважаєте його несправедливим.",
    fields: [
      { label: "Ваш нікнейм у Roblox", placeholder: "@username", required: true },
      { label: "Отримане покарання та його причина", multiline: true, required: true },
      { label: "Детальний опис ситуації з вашого боку", multiline: true, required: false },
      { label: "Чому покарання варто зняти чи пом'якшити?", placeholder: "Обґрунтуйте свою позицію", multiline: true, required: true },
    ],
  },
  {
    id: "player_complaint",
    title: "Скарга на гравця",
    description: "Поскаржтеся на порушення правил іншим гравцем.",
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
