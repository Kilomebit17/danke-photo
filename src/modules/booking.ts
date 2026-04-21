/**
 * Booking form:
 *  - floating labels driven by `.has-value` class (set when the field has a value)
 *  - contact method chips change the placeholder/label for the contact input
 *  - fake async submit with loader + success state
 */
export function initBooking(): void {
  const form = document.querySelector<HTMLFormElement>('[data-booking-form]');
  if (!form) return;

  const section = form.closest<HTMLElement>('.booking');

  // —— Floating labels ——
  // Only bind to the field's DIRECT-child control. This prevents the outer
  // <fieldset class="field field--group"> from grabbing the first radio and
  // toggling `.has-value` on itself — which used to cascade into the nested
  // phone field and leave its label stuck in the floated-up state.
  const fields = Array.from(form.querySelectorAll<HTMLElement>('.field'));
  fields.forEach((field) => {
    const control = field.querySelector<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >(':scope > input, :scope > textarea, :scope > select');
    if (!control) return;

    const refresh = () => {
      const hasValue =
        control instanceof HTMLSelectElement
          ? control.value !== ''
          : control.value.trim() !== '';
      field.classList.toggle('has-value', hasValue);
    };

    refresh();
    control.addEventListener('input', refresh);
    control.addEventListener('change', refresh);
    control.addEventListener('blur', refresh);
  });

  // —— Contact method chips ——
  const methods = form.querySelectorAll<HTMLInputElement>(
    'input[name="contactMethod"]'
  );
  const contactInput = form.querySelector<HTMLInputElement>(
    '[data-contact-input]'
  );
  const contactLabel =
    form.querySelector<HTMLLabelElement>('[data-contact-label]');

  const placeholders: Record<string, { label: string; type: string; pattern?: string }> = {
    phone: { label: 'Номер телефону', type: 'tel' },
    telegram: { label: '@username у Telegram', type: 'text' },
    instagram: { label: '@username в Instagram', type: 'text' },
  };

  const applyMethod = (method: string) => {
    if (!contactInput || !contactLabel) return;
    const cfg = placeholders[method] ?? placeholders.phone;
    contactInput.type = cfg.type;
    contactLabel.textContent = cfg.label;
    // nudge user focus for chip switch
    if (document.activeElement !== contactInput) return;
  };

  methods.forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) applyMethod(input.value);
    });
  });
  const initial = Array.from(methods).find((m) => m.checked)?.value ?? 'phone';
  applyMethod(initial);

  // —— Submit → Telegram Bot ——
  const submitBtn = form.querySelector<HTMLButtonElement>('[data-submit]');

  const typeLabels: Record<string, string> = {
    family: 'Family / Love story',
    personal: 'Personal',
    morning: "The Bride's Morning",
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameEl    = form.querySelector<HTMLInputElement>('#f-name');
    const contactEl = form.querySelector<HTMLInputElement>('#f-contact');
    const typeEl    = form.querySelector<HTMLSelectElement>('#f-type');
    const msgEl     = form.querySelector<HTMLTextAreaElement>('#f-msg');
    const method    = Array.from(methods).find((m) => m.checked)?.value ?? 'phone';

    if (!nameEl?.value.trim() || !contactEl?.value.trim() || !typeEl?.value) {
      [nameEl, contactEl, typeEl].forEach((el) => {
        if (!el) return;
        const isEmpty = el instanceof HTMLSelectElement ? !el.value : !el.value.trim();
        if (!isEmpty) return;
        const wrap = el.closest<HTMLElement>('.field');
        if (!wrap) return;
        wrap.classList.remove('is-invalid');
        void wrap.offsetWidth;
        wrap.classList.add('is-invalid');
      });
      return;
    }

    const text = [
      `📸 *Нове бронювання*`,
      `👤 Ім'я: ${nameEl.value.trim()}`,
      `📱 ${method.charAt(0).toUpperCase() + method.slice(1)}: ${contactEl.value.trim()}`,
      `🎞 Тип зйомки: ${typeLabels[typeEl.value] ?? typeEl.value}`,
      msgEl?.value.trim() ? `💬 Повідомлення: ${msgEl.value.trim()}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    submitBtn?.classList.add('is-loading');

    try {
      const token  = import.meta.env.VITE_TG_BOT_TOKEN as string;
      const chatId = import.meta.env.VITE_TG_CHAT_ID as string;

      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
      });

      if (!res.ok) throw new Error(`TG ${res.status}`);

      submitBtn?.classList.remove('is-loading');
      section?.classList.add('is-submitted');
    } catch {
      submitBtn?.classList.remove('is-loading');
      submitBtn?.classList.add('is-error');
      window.setTimeout(() => submitBtn?.classList.remove('is-error'), 3000);
    }
  });
}
