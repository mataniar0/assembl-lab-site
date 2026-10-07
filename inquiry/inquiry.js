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
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
  const phonePattern = /^\+?[0-9() .-]+$/u;
  const whatsappNumber = String(config.whatsapp || "").replace(/[^0-9]/gu, "");
  const hasWhatsApp = /^[1-9][0-9]{6,14}$/u.test(whatsappNumber);
  const hasEmail = emailPattern.test(String(config.email || ""));
  const hasEndpoint = /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/u.test(String(config.formEndpoint || ""));
  let submitting = false;

  const setStatus = (message, state = "") => {
    status.textContent = message;
    status.dataset.state = state;
  };
  form.addEventListener("input", () => {
    if (!submitting) setStatus("");
  });
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
  const availableChannels = [hasWhatsApp && "ב־WhatsApp", hasEmail && "באפליקציית המייל"].filter(Boolean);
  const fallbackChannel = availableChannels.join(" או ");
  document.querySelector(".delivery-note").textContent = fallbackChannel ? `${fallbackChannel} ההודעה נפתחת עם הפרטים שמילאתם. השליחה מתבצעת באפליקציה.` : "";
  if (hasEndpoint) {
    form.action = config.formEndpoint;
    send.hidden = false;
  }

  const validContact = () => {
    const value = contact.value.trim();
    const digits = value.replace(/[^0-9]/gu, "");
    return emailPattern.test(value) || (phonePattern.test(value) && digits.length >= 7 && digits.length <= 15);
  };
  contact.addEventListener("input", () => contact.setCustomValidity(""));
  customerName.addEventListener("input", () => customerName.setCustomValidity(""));
  const validate = () => {
    customerName.setCustomValidity(customerName.value.trim() ? "" : "הזינו שם כדי שנוכל לפנות אליכם.");
    contact.setCustomValidity(validContact() ? "" : "הזינו מספר טלפון או כתובת מייל תקינים.");
    if (!form.reportValidity()) {
      setStatus("בדקו את השדות המסומנים לפני שליחת הבקשה.", "error");
      return false;
    }
    return true;
  };
  const message = () => {
    const lines = ["שלום ASSEMBLE LAB,", "אשמח לבירור ולהצעת מחיר.", "", `מוצר: ${product.selectedOptions[0].textContent}`, `שם: ${form.elements.name.value.trim()}`, `פרטי קשר: ${contact.value.trim()}`, `כמות: ${form.elements.quantity.value}`];
    for (const [field, label] of [["width", "רוחב"], ["depth", "עומק"], ["height", "גובה"]]) {
      if (form.elements[field].value) lines.push(`${label}: ${form.elements[field].value} מ״מ`);
    }
    if (form.elements.note.value.trim()) lines.push("", `הערה: ${form.elements.note.value.trim()}`);
    if (!planningNotice.hidden) lines.push("", "המוצר בפיתוח — בקשה לבירור אפשרות ייצור והתאמה.");
    return lines.join("\n");
  };
  whatsapp.addEventListener("click", event => {
    if (submitting || !hasWhatsApp || !validate()) return event.preventDefault();
    whatsapp.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message())}`;
    setStatus("WhatsApp ייפתח עם פרטי הבקשה. יש לשלוח את ההודעה באפליקציה.");
  });
  email.addEventListener("click", event => {
    if (submitting || !hasEmail || !validate()) return event.preventDefault();
    const subject = `בקשת הצעת מחיר — ${product.selectedOptions[0].textContent} — ASSEMBLE LAB`;
    email.href = `mailto:${config.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message())}`;
    setStatus("אפליקציית המייל תיפתח עם פרטי הבקשה. יש לשלוח את ההודעה באפליקציה.");
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (submitting || !validate()) return;
    if (!hasEndpoint) {
      setStatus(fallbackChannel ? `אפשר לפתוח את הבקשה ${fallbackChannel}.` : "לא ניתן לשלוח את הבקשה כרגע. נסו שוב מאוחר יותר.");
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
    send.textContent = "שולח…";
    setStatus("שולחים את הבקשה…");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(config.formEndpoint, { method: "POST", mode: "cors", headers: { "Accept": "application/json" }, body: data, signal: controller.signal });
      const result = await response.json();
      const acknowledged = result && (typeof result.next === "string" || result.ok === true);
      if (!response.ok || !acknowledged || result.error || result.errors?.length) throw new Error("Submission was not acknowledged");
      setStatus("הבקשה נשלחה. נחזור אליכם בפרטי הקשר שמילאתם.", "success");
    } catch (error) {
      const alternative = fallbackChannel ? ` או לפתוח את הבקשה ${fallbackChannel}` : "";
      setStatus(`לא התקבל אישור לשליחה. הפרטים נשמרו בטופס; אפשר לנסות שוב${alternative}.`, "error");
    } finally {
      clearTimeout(timeout);
      controls.forEach((control, index) => { control.disabled = disabled[index]; });
      [whatsapp, email].forEach(link => link.removeAttribute("aria-disabled"));
      form.removeAttribute("aria-busy");
      send.textContent = "שליחת בקשה";
      submitting = false;
    }
  });
})();
