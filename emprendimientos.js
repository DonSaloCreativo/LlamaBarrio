const SERVICES_API_BASE = "https://script.google.com/macros/s/AKfycbzbdLTbh0a9sVSC7DOB04QrLLANsSak2pd4qQE2GqZ1BSDqwtgD69vot3R2MQk-GFV0uw/exec";
const SERVICES_FORM_URL = "https://forms.gle/mBWHgDvbY17pTk1Y7";

let servicesData = [];
let activeServiceCategory = "Todas";
const SERVICES_CACHE_KEY = "llamabarrio-services-cache-v2";
const SERVICES_CACHE_TTL = 1000 * 60 * 60 * 6;

function normalizeServicesText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s,]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeServicesFieldName(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function getServicesFieldValue(source, preferredKeys = [], partialKeys = []) {
    if (!source || typeof source !== "object") return "";

    for (const key of preferredKeys) {
        if (source[key] !== undefined && source[key] !== null && String(source[key]).trim() !== "") {
            return String(source[key]).trim();
        }
    }

    for (const [rawKey, rawValue] of Object.entries(source)) {
        if (rawValue === undefined || rawValue === null || String(rawValue).trim() === "") continue;
        const normalizedKey = normalizeServicesFieldName(rawKey);
        if (partialKeys.some((partial) => normalizedKey.includes(normalizeServicesFieldName(partial)))) {
            return String(rawValue).trim();
        }
    }

    return "";
}

function getServicesPriority(source) {
    const raw = getServicesFieldValue(source, ["Prioridad", "prioridad"], ["prioridad"]);
    const value = String(raw || "").trim().toLowerCase();

    if (!value) return 999;
    if (/^\d+$/.test(value)) return Number(value);
    if (value === "destacado" || value === "premium") return 1;
    if (value === "media") return 2;
    return 3;
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function buildInstagramUrl(handle) {
    const raw = String(handle || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;

    const cleanHandle = raw
        .replace(/^@+/, "")
        .replace(/^instagram\.com\//i, "")
        .replace(/^www\.instagram\.com\//i, "")
        .trim();

    return cleanHandle ? `https://instagram.com/${cleanHandle}` : "";
}

function normalizeWhatsappNumber(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("56")) return digits;
    if (digits.startsWith("9") && digits.length === 9) return `56${digits}`;
    return digits;
}

function buildWhatsappUrl(value) {
    const digits = normalizeWhatsappNumber(value);
    return digits ? `https://wa.me/${digits}` : "";
}

function openServicesModal(service) {
    const modal = document.getElementById("services-modal");
    if (!modal) return;

    document.getElementById("services-modal-category").textContent = service.category || "Servicio";
    document.getElementById("services-modal-title").textContent = service.name || "Sin nombre";
    document.getElementById("services-modal-description").textContent = service.description || "Sin descripción disponible.";
    document.getElementById("services-modal-comuna").textContent = service.comuna ? `Comuna base: ${service.comuna}` : "";
    document.getElementById("services-modal-cobertura").textContent = service.coverage ? `Cobertura: ${service.coverage}` : "";
    document.getElementById("services-modal-contacto").textContent = service.whatsapp ? `Contacto: ${service.whatsapp}` : "Contacto no informado";
    document.getElementById("services-modal-instagram").textContent = service.instagram ? `Instagram: ${service.instagram}` : "";

    modal.hidden = false;
}

function closeServicesModal() {
    const modal = document.getElementById("services-modal");
    if (modal) modal.hidden = true;
}

function openServicesBusinessModal() {
    const modal = document.getElementById("services-business-modal");
    const frame = document.getElementById("services-business-frame");
    if (!modal || !frame) return;

    frame.src = SERVICES_FORM_URL;
    modal.hidden = false;
}

function closeServicesBusinessModal() {
    const modal = document.getElementById("services-business-modal");
    const frame = document.getElementById("services-business-frame");
    if (!modal || !frame) return;

    modal.hidden = true;
    frame.src = "";
}

function renderServices() {
    const grid = document.getElementById("services-grid");
    const empty = document.getElementById("services-empty");
    const currentComuna = document.getElementById("services-current-comuna");
    const comuna = document.getElementById("services-comuna")?.value || "";
    const search = normalizeServicesText(document.getElementById("services-search")?.value || "");

    if (!grid || !empty) return;

    if (currentComuna) {
        currentComuna.textContent = comuna || "Todas las comunas";
    }

    const filtered = servicesData.filter((service) => {
        const categoryMatch = activeServiceCategory === "Todas" || service.category === activeServiceCategory;
        const coverageText = normalizeServicesText(`${service.comuna} ${service.coverage}`);
        const comunaMatch = !comuna || coverageText.includes(normalizeServicesText(comuna));
        const searchBase = normalizeServicesText(`${service.name} ${service.description} ${service.category} ${service.tags} ${service.coverage}`);
        const searchMatch = !search || searchBase.includes(search);
        return categoryMatch && comunaMatch && searchMatch;
    });

    if (!filtered.length) {
        grid.innerHTML = "";
        empty.hidden = false;
        return;
    }

    empty.hidden = true;
    grid.innerHTML = filtered.map((service) => {
        const instagramUrl = buildInstagramUrl(service.instagram);
        const whatsappUrl = buildWhatsappUrl(service.whatsapp);

        return `
        <article class="service-card" data-service-id="${service.id}">
            <div class="service-card-top">
                <span class="service-card-tag">${escapeHtml(service.category || "Servicio")}</span>
            </div>
            <h3>${escapeHtml(service.name)}</h3>
            <p>${escapeHtml(service.description || "Sin descripción disponible.")}</p>
            <div class="service-card-meta">
                ${service.coverage
                    ? `<span class="service-meta-pill">Comunas despacho: ${escapeHtml(service.coverage)}</span>`
                    : (service.comuna ? `<span class="service-meta-pill">Comuna base: ${escapeHtml(service.comuna)}</span>` : "")
                }
            </div>
            ${instagramUrl
                ? `<a class="service-card-social service-card-link" href="${escapeHtml(instagramUrl)}" target="_blank" rel="noopener noreferrer" data-service-action="instagram">Instagram: ${escapeHtml(service.instagram)}</a>`
                : ""
            }
            ${whatsappUrl
                ? `<div class="service-card-actions"><a class="service-contact-btn" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener noreferrer" data-service-action="contact">Contacto: ${escapeHtml(service.whatsapp)}</a></div>`
                : ""
            }
        </article>
    `;
    }).join("");

    grid.querySelectorAll(".service-card").forEach((card) => {
        card.addEventListener("click", () => {
            const service = servicesData.find((item) => item.id === card.dataset.serviceId);
            if (service) openServicesModal(service);
        });
    });

    grid.querySelectorAll("[data-service-action]").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.stopPropagation();
        });
    });
}

function processServicesData(data) {
    return (data || []).map((item, index) => ({
        id: `service-${index}`,
        name: getServicesFieldValue(item, ["Nombre", "Emprendimiento", "Negocio"], ["nombre", "emprendimiento", "negocio"]),
        category: getServicesFieldValue(item, ["Categoria", "Categoría", "Rubro"], ["categoria", "rubro"]),
        description: getServicesFieldValue(item, ["Qué ofrece", "Que ofrece", "Descripción", "Descripcion"], ["queofrece", "descripcion", "servicio"]),
        comuna: getServicesFieldValue(item, ["Comuna base", "Comuna", "comuna"], ["comunabase", "comuna"]),
        coverage: getServicesFieldValue(item, ["Cobertura", "Cobertura comunas"], ["cobertura"]),
        whatsapp: getServicesFieldValue(item, ["WhatsApp", "Whatsapp", "Telefono", "Teléfono"], ["whatsapp", "telefono"]),
        instagram: getServicesFieldValue(item, ["Instagram"], ["instagram"]),
        tags: getServicesFieldValue(item, ["Tags"], ["tags"]),
        prioridad: getServicesPriority(item),
        estado: getServicesFieldValue(item, ["Estado", "estado"], ["estado"])
    })).filter((item) => {
        const status = String(item.estado || "").trim().toLowerCase();
        return item.name && (!status || status.includes("aprob"));
    }).sort((a, b) => {
        if (a.prioridad !== b.prioridad) return a.prioridad - b.prioridad;
        return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
    });
}

function readServicesCache() {
    try {
        const cached = JSON.parse(localStorage.getItem(SERVICES_CACHE_KEY) || "null");
        if (!cached || !cached.timestamp || Date.now() - cached.timestamp > SERVICES_CACHE_TTL) return null;
        return cached.items || [];
    } catch (error) {
        return null;
    }
}

function writeServicesCache(items) {
    try {
        localStorage.setItem(SERVICES_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), items }));
    } catch (error) {}
}

document.addEventListener("DOMContentLoaded", () => {
    const cachedServices = readServicesCache();
    if (cachedServices && cachedServices.length) {
        servicesData = cachedServices;
        renderServices();
    }

    fetch(`${SERVICES_API_BASE}?hoja=${encodeURIComponent("Publicaciones Emprendimientos")}`)
        .then((response) => response.json())
        .catch(() => [])
        .then((data) => {
            servicesData = processServicesData(data);
            writeServicesCache(servicesData);
            renderServices();
        });

    document.getElementById("services-search")?.addEventListener("input", renderServices);
    document.getElementById("services-comuna")?.addEventListener("change", renderServices);

    document.querySelectorAll(".service-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
            activeServiceCategory = chip.dataset.category || "Todas";
            document.querySelectorAll(".service-chip").forEach((item) => item.classList.toggle("is-active", item === chip));
            renderServices();
        });
    });

    document.querySelectorAll("[data-close-services-modal]").forEach((trigger) => {
        trigger.addEventListener("click", closeServicesModal);
    });

    document.querySelectorAll("[data-open-services-form]").forEach((trigger) => {
        trigger.addEventListener("click", (event) => {
            event.preventDefault();
            openServicesBusinessModal();
        });
    });

    document.querySelectorAll("[data-close-services-business-modal]").forEach((trigger) => {
        trigger.addEventListener("click", closeServicesBusinessModal);
    });

    window.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        closeServicesModal();
        closeServicesBusinessModal();
    });
});
