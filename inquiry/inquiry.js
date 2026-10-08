"use strict";

(() => {
  const form = document.querySelector("#inquiry-form");
  if (!form) return;
  const config = window.ASSEMBLE_CONTACT || {};
  const product = form.elements.product;
  const contact = form.elements.contact;
  const status = document.querySelector("#inquiry-status");
  const send = document.querySelector("#send-request");
  const whatsapp = document.querySelector("#whatsapp-request");
  const email = document.querySelector("#email-request");
  const planningNotice = document.querySelector("#planning-notice");
  const customerName = form.elements.namedItem("name");
  const i18n = window.ASSEMBLE_I18N;
  const t = (key, variables) => i18n.t(key, variables);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
  const phonePattern = /^\+?[0-9() .-]+$/u;
  const whatsappNumber = String(config.whatsapp || "").replace(/[^0-9]/gu, "");
  const hasWhatsApp = /^[1-9][0-9]{6,14}$/u.test(whatsappNumber);
  const hasEmail = emailPattern.test(String(config.email || ""));
  const hasEndpoint = /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/u.test(String(config.formEndpoint || ""));
  let submitting = false;
  let currentStatus = { key: "", state: "", variables: {} };
  const validityKeys = new Map();

  const renderStatus = () => {
    status.textContent = currentStatus.key ? t(currentStatus.key, currentStatus.variables) : "";
    status.dataset.state = currentStatus.state;
  };
  const setStatus = (key, state = "", variables = {}) => {
    currentStatus = { key, state, variables };
    renderStatus();
  };
  const setValidity = (control, key) => {
    if (key) validityKeys.set(control, key);
    else validityKeys.delete(control);
    control.setCustomValidity(key ? t(key) : "");
  };
  form.addEventListener("invalid", event => {
    const control = event.target;
    const disclosure = control.closest("details");
    if (disclosure) disclosure.open = true;
    if (!validityKeys.has(control)) {
      if (control === product) setValidity(control, "inquiry.validation.product");
      else if (control === customerName) setValidity(control, "inquiry.validation.name");
      else if (control === contact) setValidity(control, "inquiry.validation.contact");
      else if (control === form.elements.quantity) setValidity(control, "inquiry.validation.quantity");
      else if (["width", "depth", "height"].includes(control.name)) setValidity(control, "inquiry.validation.dimension");
    }
    setStatus("inquiry.status.invalid", "error");
  }, true);
  form.addEventListener("input", event => {
    if (typeof event.target.setCustomValidity === "function") setValidity(event.target, "");
    if (!submitting) setStatus("");
  });
  form.addEventListener("change", event => {
    if (typeof event.target.setCustomValidity === "function") setValidity(event.target, "");
  });
  const fallbackChannel = () => {
    const channels = [hasWhatsApp && t("inquiry.channel.whatsapp"), hasEmail && t("inquiry.channel.email")].filter(Boolean);
    return channels.join(t("inquiry.channel.or"));
  };
  const renderDynamicText = () => {
    const channel = fallbackChannel();
    document.querySelector(".delivery-note").textContent = channel ? t("inquiry.delivery", { channel }) : "";
    send.textContent = t(submitting ? "inquiry.sending" : "inquiry.send");
    validityKeys.forEach((key, control) => control.setCustomValidity(t(key)));
    // Rebuild channel names so a language change never leaves mixed copy.
    if (currentStatus.key === "inquiry.status.fallback") currentStatus.variables = { channel };
    if (currentStatus.key === "inquiry.status.failed") {
      currentStatus.variables = { alternative: channel ? t("inquiry.alternative", { channel }) : "" };
    }
    renderStatus();
  };
  document.addEventListener("assemble:languagechange", renderDynamicText);
  const showPlanning = () => {
    planningNotice.hidden = product.selectedOptions[0]?.dataset.planning !== "true";
  };
  const selected = new URLSearchParams(location.search).get("product");
  if ([...product.options].some(option => option.value && option.value === selected)) product.value = selected;
  showPlanning();
  product.addEventListener("change", showPlanning);

  if (hasWhatsApp) {
    whatsapp.href = `https://wa.me/${whatsappNumber}`;
    whatsapp.hidden = false;
  }
  if (hasEmail) {
    email.href = `mailto:${config.email}`;
    email.hidden = false;
  }
  renderDynamicText();
  if (hasEndpoint) {
    form.action = config.formEndpoint;
    send.hidden = false;
  }

  const validContact = () => {
    const value = contact.value.trim();
    const digits = value.replace(/[^0-9]/gu, "");
    return emailPattern.test(value) || (phonePattern.test(value) && digits.length >= 7 && digits.length <= 15);
  };
  const validate = () => {
    setValidity(customerName, customerName.value.trim() ? "" : "inquiry.validation.name");
    setValidity(contact, validContact() ? "" : "inquiry.validation.contact");
    if (!form.reportValidity()) {
      setStatus("inquiry.status.invalid", "error");
      return false;
    }
    return true;
  };
  const message = () => {
    const lines = [t("inquiry.message.greeting"), t("inquiry.message.intro"), "", t("inquiry.message.product", { value: product.selectedOptions[0].textContent }), t("inquiry.message.name", { value: customerName.value.trim() }), t("inquiry.message.contact", { value: contact.value.trim() }), t("inquiry.message.quantity", { value: form.elements.quantity.value })];
    for (const field of ["width", "depth", "height"]) {
      if (form.elements[field].value) lines.push(t(`inquiry.message.${field}`, { value: form.elements[field].value }));
    }
    if (form.elements.note.value.trim()) lines.push("", t("inquiry.message.note", { value: form.elements.note.value.trim() }));
    if (!planningNotice.hidden) lines.push("", t("inquiry.message.planning"));
    return lines.join("\n");
  };
  whatsapp.addEventListener("click", event => {
    if (submitting || !hasWhatsApp || !validate()) return event.preventDefault();
    whatsapp.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message())}`;
    setStatus("inquiry.status.whatsapp");
  });
  email.addEventListener("click", event => {
    if (submitting || !hasEmail || !validate()) return event.preventDefault();
    const subject = t("inquiry.message.subject", { product: product.selectedOptions[0].textContent });
    email.href = `mailto:${config.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message())}`;
    setStatus("inquiry.status.email");
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (submitting || !validate()) return;
    if (!hasEndpoint) {
      const channel = fallbackChannel();
      setStatus(channel ? "inquiry.status.fallback" : "inquiry.status.unavailable", "", { channel });
      return;
    }
    if (form.elements._gotcha.value) return;
    const data = new FormData(form);
    data.set("name", customerName.value.trim());
    data.set("contact", contact.value.trim());
    data.set("product_name", product.selectedOptions[0].textContent);
    data.set("message", message());
    data.set("_subject", `ASSEMBLE LAB — ${product.selectedOptions[0].textContent}`);
    if (emailPattern.test(contact.value.trim())) data.set("email", contact.value.trim());
    const controls = [...form.querySelectorAll("input,select,textarea,button")];
    const disabled = controls.map(control => control.disabled);
    submitting = true;
    [whatsapp, email].forEach(link => link.setAttribute("aria-disabled", "true"));
    controls.forEach(control => { control.disabled = true; });
    form.setAttribute("aria-busy", "true");
    send.textContent = t("inquiry.sending");
    setStatus("inquiry.status.sending");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(config.formEndpoint, { method: "POST", mode: "cors", headers: { "Accept": "application/json" }, body: data, signal: controller.signal });
      const result = await response.json();
      const acknowledged = result && (typeof result.next === "string" || result.ok === true);
      if (!response.ok || !acknowledged || result.error || result.errors?.length) throw new Error("Submission was not acknowledged");
      setStatus("inquiry.status.sent", "success");
    } catch (error) {
      const channel = fallbackChannel();
      const alternative = channel ? t("inquiry.alternative", { channel }) : "";
      setStatus("inquiry.status.failed", "error", { alternative });
    } finally {
      clearTimeout(timeout);
      controls.forEach((control, index) => { control.disabled = disabled[index]; });
      [whatsapp, email].forEach(link => link.removeAttribute("aria-disabled"));
      form.removeAttribute("aria-busy");
      send.textContent = t("inquiry.send");
      submitting = false;
    }
  });
})();
