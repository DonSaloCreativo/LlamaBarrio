const SERVICES_API_BASE = "https://script.google.com/macros/s/AKfycbzbdLTbh0a9sVSC7DOB04QrLLANsSak2pd4qQE2GqZ1BSDqwtgD69vot3R2MQk-GFV0uw/exec";

let servicesData = [];
let activeServiceCategory = "Todas";

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

function getServicesPhoneHref(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    let digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("56")) return `tel:+${digits}`;
    if (digits.length === 9 && digits.startsWith("9")) return `tel:+56${digits}`;
    if (digits.length === 8 || digits.length === 9) return `tel:+56${digits}`;
    return `tel:+${digits}`;
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
    grid.innerHTML = filtered.map((service) => `
        <article class="service-card" data-service-id="${service.id}">
            <div class="service-card-top">
                <span class="service-card-tag">${service.category || "Servicio"}</span>
            </div>
            <h3>${service.name}</h3>
            <p>${service.description || "Sin descripción disponible."}</p>
            <div class="service-card-meta">
                ${service.coverage ? `<span class="service-meta-pill">Comunas despacho: ${service.coverage}</span>` : (service.comuna ? `<span class="service-meta-pill">Comuna base: ${service.comuna}</span>` : "")}
            </div>
            ${service.instagram ? `<div class="service-card-social">Instagram: ${service.instagram}</div>` : ""}
        </article>
    `).join("");

    grid.querySelectorAll(".service-card").forEach((card) => {
        card.addEventListener("click", () => {
            const service = servicesData.find((item) => item.id === card.dataset.serviceId);
            if (service) openServicesModal(service);
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    fetch(`${SERVICES_API_BASE}?hoja=${encodeURIComponent("Publicaciones Emprendimientos")}`)
        .then((response) => response.json())
        .catch(() => [])
        .then((data) => {
            servicesData = (data || []).map((item, index) => ({
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

    window.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        closeServicesModal();
    });
});
