export interface BotVariable {
  key: string;
  label: string;
  preview: string;
}

export type LoopType =
  | 'foreachLoan'
  | 'foreachPaymentInLoan'
  | 'foreachPayment'
  | 'foreachSchedule';

export interface BotLoop {
  type: LoopType;
  label: string;
  description: string;
  parent?: LoopType;
}

export interface BotVariableGroup {
  title: string;
  scope: 'global' | LoopType;
  description?: string;
  variables: BotVariable[];
}

export const BOT_LOOPS: BotLoop[] = [
  {
    type: 'foreachLoan',
    label: 'Цикл по рассрочкам',
    description: 'Перебор всех рассрочек клиента'
  },
  {
    type: 'foreachPaymentInLoan',
    label: 'Цикл по платежам рассрочки',
    description: 'Вложенный цикл — только внутри «Цикла по рассрочкам»',
    parent: 'foreachLoan'
  },
  {
    type: 'foreachPayment',
    label: 'Цикл по всем платежам',
    description: 'Перебор всех платежей клиента'
  },
  {
    type: 'foreachSchedule',
    label: 'Цикл по графикам платежей',
    description: 'Перебор будущих платежей по графику'
  }
];

export const BOT_VARIABLE_GROUPS: BotVariableGroup[] = [
  {
    title: 'Глобальные — Клиент',
    scope: 'global',
    description: 'Доступны везде',
    variables: [
      { key: 'client_fullname', label: 'ФИО клиента', preview: 'Иванов Иван Иванович' },
      { key: 'client_id', label: 'ID клиента', preview: '4521' },
      { key: 'client_birthdate', label: 'Дата рождения', preview: '15.04.1990' },
      { key: 'client_address', label: 'Адрес регистрации', preview: 'г. Москва, ул. Ленина, д. 1, кв. 5' },
      { key: 'client_created_at', label: 'Дата создания', preview: '12.01.2024' }
    ]
  },
  {
    title: 'Глобальные — Компания',
    scope: 'global',
    description: 'Доступны везде',
    variables: [
      { key: 'company', label: 'Название', preview: 'ООО "Пример"' },
      { key: 'company_city', label: 'Город', preview: 'Москва' },
      { key: 'company_address', label: 'Адрес офиса', preview: 'г. Москва, ул. Тверская, д. 10' },
      { key: 'company_email', label: 'Email', preview: 'info@example.ru' },
      { key: 'company_chief', label: 'Руководитель', preview: 'Сидоров С.С.' },
      { key: 'company_card', label: 'Карта для перевода', preview: '**** 1234 (Сбербанк)' },
      { key: 'support_phone', label: 'Телефон поддержки', preview: '+7 (999) 123-45-67' }
    ]
  },
  {
    title: 'Внутри {foreachLoan}',
    scope: 'foreachLoan',
    description: 'Только между {foreachLoan} и {/foreachLoan}',
    variables: [
      { key: 'name', label: 'Номер рассрочки', preview: '№123' },
      { key: 'loan_date', label: 'Дата выдачи', preview: '01.01.2024' },
      { key: 'total_clean', label: 'Стоимость товаров', preview: '100 000 ₽' },
      { key: 'total_amount', label: 'Сумма с надбавкой', preview: '120 000 ₽' },
      { key: 'first_payment', label: 'Первый взнос', preview: '20 000 ₽' },
      { key: 'term', label: 'Срок (мес)', preview: '12' },
      { key: 'start_date', label: 'Дата начала', preview: '01.02.2024' },
      { key: 'month_payment', label: 'Ежемесячный платёж', preview: '10 000 ₽' },
      { key: 'guarantor_fullname', label: 'ФИО поручителя', preview: 'Петров Пётр Петрович' },
      { key: 'guarantor_phone', label: 'Телефон поручителя', preview: '+7 (999) 765-43-21' }
    ]
  },
  {
    title: 'Внутри {foreachPaymentInLoan}',
    scope: 'foreachPaymentInLoan',
    description: 'Только во вложенном цикле платежей рассрочки',
    variables: [
      { key: 'payment_in_loan_date', label: 'Дата платежа', preview: '15.02.2024' },
      { key: 'payment_in_loan_amount', label: 'Сумма платежа', preview: '10 000 ₽' },
      { key: 'payment_in_loan_employee', label: 'Сотрудник', preview: 'Петров П.П.' },
      { key: 'payment_in_loan_type', label: 'Тип платежа', preview: 'Наличными' }
    ]
  },
  {
    title: 'Внутри {foreachPayment}',
    scope: 'foreachPayment',
    description: 'Только между {foreachPayment} и {/foreachPayment}',
    variables: [
      { key: 'payment_date', label: 'Дата платежа', preview: '15.02.2024' },
      { key: 'payment_type', label: 'Тип платежа', preview: 'Наличными' },
      { key: 'employee', label: 'Сотрудник', preview: 'Петров П.П.' },
      { key: 'payment_amount', label: 'Сумма', preview: '10 000 ₽' },
      { key: 'loan_payment_name', label: 'Рассрочка — номер', preview: '№123' },
      { key: 'loan_payment_date', label: 'Рассрочка — дата выдачи', preview: '01.01.2024' },
      { key: 'loan_payment_total_clean', label: 'Рассрочка — стоимость товаров', preview: '100 000 ₽' },
      { key: 'loan_payment_total_amount', label: 'Рассрочка — сумма с надбавкой', preview: '120 000 ₽' },
      { key: 'loan_payment_first_payment', label: 'Рассрочка — первый взнос', preview: '20 000 ₽' },
      { key: 'loan_payment_term', label: 'Рассрочка — срок', preview: '12' },
      { key: 'loan_payment_start_date', label: 'Рассрочка — дата начала', preview: '01.02.2024' },
      { key: 'loan_payment_month_payment', label: 'Рассрочка — ежемесячный платёж', preview: '10 000 ₽' },
      { key: 'loan_payment_guarantor_fullname', label: 'Рассрочка — ФИО поручителя', preview: 'Петров Пётр Петрович' },
      { key: 'loan_payment_guarantor_phone', label: 'Рассрочка — телефон поручителя', preview: '+7 (999) 765-43-21' }
    ]
  },
  {
    title: 'Внутри {foreachSchedule}',
    scope: 'foreachSchedule',
    description: 'Только между {foreachSchedule} и {/foreachSchedule}',
    variables: [
      { key: 'schedule_date', label: 'Дата по графику', preview: '15.03.2024' },
      { key: 'rest', label: 'Остаток долга', preview: '80 000 ₽' },
      { key: 'scheduled_amount', label: 'Сумма платежа', preview: '10 000 ₽' },
      { key: 'comment', label: 'Номер взноса', preview: '2 из 12' },
      { key: 'schedule_schedule_name', label: 'Рассрочка — номер', preview: '№123' },
      { key: 'loan_schedule_date', label: 'Рассрочка — дата выдачи', preview: '01.01.2024' },
      { key: 'loan_schedule_total_clean', label: 'Рассрочка — стоимость товаров', preview: '100 000 ₽' },
      { key: 'loan_schedule_total_amount', label: 'Рассрочка — сумма с надбавкой', preview: '120 000 ₽' },
      { key: 'loan_schedule_first_payment', label: 'Рассрочка — первый взнос', preview: '20 000 ₽' },
      { key: 'loan_schedule_term', label: 'Рассрочка — срок', preview: '12' },
      { key: 'loan_schedule_start_date', label: 'Рассрочка — дата начала', preview: '01.02.2024' },
      { key: 'loan_schedule_month_payment', label: 'Рассрочка — ежемесячный платёж', preview: '10 000 ₽' },
      { key: 'loan_schedule_guarantor_fullname', label: 'Рассрочка — ФИО поручителя', preview: 'Петров Пётр Петрович' },
      { key: 'loan_schedule_guarantor_phone', label: 'Рассрочка — телефон поручителя', preview: '+7 (999) 765-43-21' }
    ]
  }
];

type SimpleRecord = Record<string, string>;

interface SampleLoan extends SimpleRecord {
  name: string;
  loan_date: string;
  total_clean: string;
  total_amount: string;
  first_payment: string;
  term: string;
  start_date: string;
  month_payment: string;
  guarantor_fullname: string;
  guarantor_phone: string;
}

interface SamplePaymentInLoan extends SimpleRecord {
  payment_in_loan_date: string;
  payment_in_loan_amount: string;
  payment_in_loan_employee: string;
  payment_in_loan_type: string;
}

const SAMPLE_LOAN_PAYMENTS: SamplePaymentInLoan[][] = [
  [
    { payment_in_loan_date: '15.02.2024', payment_in_loan_amount: '10 000 ₽', payment_in_loan_employee: 'Петров П.П.', payment_in_loan_type: 'Наличными' },
    { payment_in_loan_date: '15.03.2024', payment_in_loan_amount: '10 000 ₽', payment_in_loan_employee: 'Петров П.П.', payment_in_loan_type: 'Картой' }
  ],
  [
    { payment_in_loan_date: '20.04.2024', payment_in_loan_amount: '5 000 ₽', payment_in_loan_employee: 'Иванов И.И.', payment_in_loan_type: 'Картой' }
  ]
];

const SAMPLE_LOANS: SampleLoan[] = [
  {
    name: '№123', loan_date: '01.01.2024', total_clean: '100 000 ₽', total_amount: '120 000 ₽',
    first_payment: '20 000 ₽', term: '12', start_date: '01.02.2024', month_payment: '10 000 ₽',
    guarantor_fullname: 'Петров Пётр Петрович', guarantor_phone: '+7 (999) 765-43-21'
  },
  {
    name: '№124', loan_date: '15.03.2024', total_clean: '50 000 ₽', total_amount: '60 000 ₽',
    first_payment: '10 000 ₽', term: '6', start_date: '15.04.2024', month_payment: '8 333 ₽',
    guarantor_fullname: '—', guarantor_phone: '—'
  }
];

const SAMPLE_PAYMENTS: SimpleRecord[] = [
  {
    payment_date: '15.02.2024', payment_type: 'Наличными', employee: 'Петров П.П.', payment_amount: '10 000 ₽',
    loan_payment_name: '№123', loan_payment_date: '01.01.2024', loan_payment_total_clean: '100 000 ₽',
    loan_payment_total_amount: '120 000 ₽', loan_payment_first_payment: '20 000 ₽',
    loan_payment_term: '12', loan_payment_start_date: '01.02.2024', loan_payment_month_payment: '10 000 ₽',
    loan_payment_guarantor_fullname: 'Петров Пётр Петрович', loan_payment_guarantor_phone: '+7 (999) 765-43-21'
  },
  {
    payment_date: '15.03.2024', payment_type: 'Картой', employee: 'Петров П.П.', payment_amount: '10 000 ₽',
    loan_payment_name: '№123', loan_payment_date: '01.01.2024', loan_payment_total_clean: '100 000 ₽',
    loan_payment_total_amount: '120 000 ₽', loan_payment_first_payment: '20 000 ₽',
    loan_payment_term: '12', loan_payment_start_date: '01.02.2024', loan_payment_month_payment: '10 000 ₽',
    loan_payment_guarantor_fullname: 'Петров Пётр Петрович', loan_payment_guarantor_phone: '+7 (999) 765-43-21'
  }
];

const SAMPLE_SCHEDULES: SimpleRecord[] = [
  {
    schedule_date: '15.04.2024', rest: '80 000 ₽', scheduled_amount: '10 000 ₽', comment: '3 из 12',
    schedule_schedule_name: '№123', loan_schedule_date: '01.01.2024', loan_schedule_total_clean: '100 000 ₽',
    loan_schedule_total_amount: '120 000 ₽', loan_schedule_first_payment: '20 000 ₽',
    loan_schedule_term: '12', loan_schedule_start_date: '01.02.2024', loan_schedule_month_payment: '10 000 ₽',
    loan_schedule_guarantor_fullname: 'Петров Пётр Петрович', loan_schedule_guarantor_phone: '+7 (999) 765-43-21'
  },
  {
    schedule_date: '15.05.2024', rest: '70 000 ₽', scheduled_amount: '10 000 ₽', comment: '4 из 12',
    schedule_schedule_name: '№123', loan_schedule_date: '01.01.2024', loan_schedule_total_clean: '100 000 ₽',
    loan_schedule_total_amount: '120 000 ₽', loan_schedule_first_payment: '20 000 ₽',
    loan_schedule_term: '12', loan_schedule_start_date: '01.02.2024', loan_schedule_month_payment: '10 000 ₽',
    loan_schedule_guarantor_fullname: 'Петров Пётр Петрович', loan_schedule_guarantor_phone: '+7 (999) 765-43-21'
  }
];

function substituteGlobals(template: string): string {
  let result = template;
  for (const group of BOT_VARIABLE_GROUPS) {
    if (group.scope !== 'global') continue;
    for (const variable of group.variables) {
      result = result.split(`{${variable.key}}`).join(variable.preview);
    }
  }
  return result;
}

function substituteRecord(template: string, record: SimpleRecord): string {
  let result = template;
  for (const [key, value] of Object.entries(record)) {
    result = result.split(`{${key}}`).join(value);
  }
  return result;
}

function renderLoanLoop(template: string): string {
  const regex = /\{foreachLoan\}([\s\S]*?)\{\/foreachLoan\}/g;
  return template.replace(regex, (_match, body: string) => {
    return SAMPLE_LOANS.map((loan, idx) => {
      let iteration = body;
      const nestedPayments = SAMPLE_LOAN_PAYMENTS[idx] ?? [];
      iteration = iteration.replace(
        /\{foreachPaymentInLoan\}([\s\S]*?)\{\/foreachPaymentInLoan\}/g,
        (_m, nestedBody: string) =>
          nestedPayments.map(payment => substituteRecord(nestedBody, payment)).join('')
      );
      return substituteRecord(iteration, loan);
    }).join('');
  });
}

function renderPaymentLoop(template: string): string {
  return template.replace(
    /\{foreachPayment\}([\s\S]*?)\{\/foreachPayment\}/g,
    (_m, body: string) => SAMPLE_PAYMENTS.map(p => substituteRecord(body, p)).join('')
  );
}

function renderScheduleLoop(template: string): string {
  return template.replace(
    /\{foreachSchedule\}([\s\S]*?)\{\/foreachSchedule\}/g,
    (_m, body: string) => SAMPLE_SCHEDULES.map(s => substituteRecord(body, s)).join('')
  );
}

export function renderBotTemplate(template: string): string {
  if (!template) return '';
  let result = substituteGlobals(template);
  result = renderLoanLoop(result);
  result = renderPaymentLoop(result);
  result = renderScheduleLoop(result);
  return result;
}

export interface TemplateValidationIssue {
  type: 'unclosed' | 'unopened' | 'misnested' | 'nested';
  loop: LoopType;
  message: string;
}

export function isNestingAllowed(loop: LoopType, parentContext: LoopType[]): boolean {
  const top = parentContext[parentContext.length - 1];
  if (top === undefined) {
    return loop !== 'foreachPaymentInLoan';
  }
  return loop === 'foreachPaymentInLoan' && top === 'foreachLoan';
}

export function validateBotTemplate(template: string): TemplateValidationIssue[] {
  const issues: TemplateValidationIssue[] = [];
  const stack: LoopType[] = [];
  const tagRegex = /\{(\/?)(foreachLoan|foreachPaymentInLoan|foreachPayment|foreachSchedule)\}/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(template)) !== null) {
    const isClose = match[1] === '/';
    const loop = match[2] as LoopType;

    if (!isClose) {
      const top = stack[stack.length - 1];
      if (loop === 'foreachPaymentInLoan') {
        if (top !== 'foreachLoan') {
          issues.push({
            type: 'misnested',
            loop,
            message: top
              ? `{foreachPaymentInLoan} нельзя помещать внутри {${top}} — только внутри {foreachLoan}`
              : '{foreachPaymentInLoan} должен быть внутри {foreachLoan}'
          });
        }
      } else if (top !== undefined) {
        issues.push({
          type: 'nested',
          loop,
          message: `{${loop}} нельзя вкладывать в {${top}} — циклы внутри циклов не поддерживаются`
        });
      }
      stack.push(loop);
    } else {
      const top = stack.pop();
      if (top !== loop) {
        issues.push({
          type: 'unopened',
          loop,
          message: `{/${loop}} без соответствующего открывающего тега`
        });
        if (top) stack.push(top);
      }
    }
  }

  for (const loop of stack) {
    issues.push({
      type: 'unclosed',
      loop,
      message: `Не закрыт {${loop}} — добавьте {/${loop}}`
    });
  }

  return issues;
}
