const locales = [
    { name: "Rincón Familiar", comuna: "San Bernardo", loc: "Esmeralda 469", desc: "Almacén y pan fresco, ideal para compras del día a día.", hor: "09:00 - 21:00", img: "almacen.png", wa: "569XXXXXXXX", category: "Panadería" },
    { name: "Botillería El Paso", comuna: "San Bernardo", loc: "Calle Real 123", desc: "Bebidas heladas, picoteos y datos útiles para reuniones del barrio.", hor: "12:00 - 00:00", img: "botilleria.png", wa: "569XXXXXXXX", category: "Botillería" },
    { name: "Frutas del Campo", comuna: "San Bernardo", loc: "Av. Central 45", desc: "Frutas y verduras frescas, con atención cercana y buenos precios.", hor: "08:00 - 20:00", img: "verduleria.png", wa: "569XXXXXXXX", category: "Verdulería" },
    { name: "Sushi San", comuna: "San Bernardo", loc: "O'Higgins 332", desc: "Rolls artesanales y sabores ideales para compartir.", hor: "18:00 - 23:00", img: "sushi.jpg", wa: "569XXXXXXXX", category: "Sushi" },
    { name: "Pizzería Roma", comuna: "San Bernardo", loc: "Urmeneta 10", desc: "Pizza a la piedra con sabor artesanal y buenas porciones.", hor: "12:00 - 22:00", img: "pizzeria.png", wa: "569XXXXXXXX", category: "Pizzas" },
    { name: "Empanadas Express", comuna: "San Bernardo", loc: "Colon 445", desc: "Empanadas de pino y queso para almuerzo o colación rápida.", hor: "10:00 - 16:00", img: "empanadas.jpg", wa: "569XXXXXXXX", category: "Empanadas" },
    { name: "Comida Rápida Plaza", comuna: "San Bernardo", loc: "Plaza de Armas", desc: "Sándwiches, completos y colaciones para salir del paso.", hor: "11:00 - 23:00", img: "comida rapida.png", wa: "569XXXXXXXX", category: "Completos" },
    { name: "Panadería Don Pan", comuna: "San Bernardo", loc: "Eyzaguirre 12", desc: "Pan artesanal, dulces y clásicos de once con sello casero.", hor: "07:00 - 20:00", img: "panaderia.png", wa: "569XXXXXXXX", category: "Panadería" }
];

const joyitas = [
    { name: "Sushi San", comuna: "San Bernardo", loc: "O'Higgins 332", desc: "Rolls artesanales y sabores ideales para compartir.", hor: "18:00 - 23:00", img: "sushi.jpg", wa: "569XXXXXXXX", category: "Sushi" },
    { name: "Empanadas Express", comuna: "San Bernardo", loc: "Colon 445", desc: "Empanadas de pino y queso para almuerzo o colación rápida.", hor: "10:00 - 16:00", img: "empanadas.jpg", wa: "569XXXXXXXX", category: "Empanadas" },
    { name: "Panadería Don Pan", comuna: "San Bernardo", loc: "Eyzaguirre 12", desc: "Pan artesanal, dulces y clásicos de once con sello casero.", hor: "07:00 - 20:00", img: "panaderia.png", wa: "569XXXXXXXX", category: "Panadería" },
    { name: "Pizzería Roma", comuna: "San Bernardo", loc: "Urmeneta 10", desc: "Pizza a la piedra con sabor artesanal y buenas porciones.", hor: "12:00 - 22:00", img: "pizzeria.png", wa: "569XXXXXXXX", category: "Pizzas" }
];

const formUrls = {
    tally: "https://tally.so/r/ja7DOQ",
    business: "https://docs.google.com/forms/d/e/1FAIpQLSe-NoZ-wev8KO0U6LT2ko9Ly0NyZcCjkZ4A0eBF-1TbH2qZxA/viewform?embedded=true"
};

document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("locals-grid");
    const searchInput = document.getElementById("main-search");
    const searchButton = document.querySelector(".btn-buscar-main");
    const comunaSelect = document.getElementById("comuna-select");
    const comunaLabel = document.getElementById("current-comuna-label");
    const noResults = document.getElementById("no-results");
    const formTriggers = document.querySelectorAll("[data-form-modal]");
    const categoryButtons = document.querySelectorAll(".category-pill");
    const openNowFilter = document.getElementById("open-now-filter");

    let filtrosActivos = false;
    let categoriaActiva = "Todas";
    let soloAbiertos = false;

    if (!grid) return;

    renderLocales();

    function renderLocales() {
        grid.innerHTML = "";

        locales.forEach((local) => {
            const abierta = estaAbiertoAhora(local.hor);
            const card = document.createElement("article");
            card.className = "local-card";
            card.dataset.comuna = local.comuna;
            card.dataset.category = local.category;
            card.dataset.search = `${local.name} ${local.loc} ${local.desc} ${local.category}`.toLowerCase();
            card.dataset.open = abierta ? "true" : "false";

            card.innerHTML = `
                <div class="local-img-wrap">
                    <div class="local-img-box">
                        <img src="images/${local.img}" alt="${local.name}">
                    </div>
                </div>
                <div class="local-body">
                    <div class="local-headline">
                        <span class="local-inline-tag">${local.category}</span>
                        <span class="local-status ${abierta ? "open" : "closed"}">${abierta ? "Abierto" : "Cerrado"}</span>
                    </div>
                    <div class="local-topline">
                        <h3>${local.name}</h3>
                    </div>
                    <div class="local-meta">
                        <p><b>${local.comuna}</b></p>
                        <p>${local.loc}</p>
                    </div>
                    <button type="button" class="btn-ver">Ver más</button>
                </div>
            `;

            card.addEventListener("click", () => abrirDetalle(local));
            card.querySelector(".btn-ver").addEventListener("click", (event) => {
                event.stopPropagation();
                abrirDetalle(local);
            });
            grid.appendChild(card);
        });
    }

    function updateCategoryButtons() {
        categoryButtons.forEach((button) => {
            button.classList.toggle("is-active", button.dataset.category === categoriaActiva);
        });
    }

    function filtrarLocales() {
        const termino = (searchInput?.value || "").trim().toLowerCase();
        const comunaSeleccionada = comunaSelect?.value || "San Bernardo";
        const cards = grid.querySelectorAll(".local-card");
        let visibles = 0;

        if (comunaLabel) comunaLabel.textContent = comunaSeleccionada;

        cards.forEach((card) => {
            const coincideBusqueda = termino === "" || card.dataset.search.includes(termino);
            const coincideComuna = !filtrosActivos || card.dataset.comuna === comunaSeleccionada;
            const coincideCategoria = categoriaActiva === "Todas" || card.dataset.category === categoriaActiva;
            const coincideAbierto = !soloAbiertos || card.dataset.open === "true";
            const mostrar = coincideBusqueda && coincideComuna && coincideCategoria && coincideAbierto;

            card.classList.toggle("is-hidden", !mostrar);
            if (mostrar) visibles += 1;
        });

        if (noResults) noResults.hidden = visibles !== 0;
    }

    searchInput?.addEventListener("input", () => {
        filtrosActivos = (searchInput.value || "").trim() !== "" || filtrosActivos;
        filtrarLocales();
    });

    searchButton?.addEventListener("click", () => {
        filtrosActivos = true;
        filtrarLocales();
    });

    comunaSelect?.addEventListener("change", () => {
        filtrosActivos = true;
        filtrarLocales();
    });

    categoryButtons.forEach((button) => {
        button.addEventListener("click", () => {
            categoriaActiva = button.dataset.category || "Todas";
            filtrosActivos = categoriaActiva !== "Todas" || filtrosActivos;
            updateCategoryButtons();
            filtrarLocales();
        });
    });

    openNowFilter?.addEventListener("click", () => {
        soloAbiertos = !soloAbiertos;
        openNowFilter.classList.toggle("is-active", soloAbiertos);
        filtrosActivos = soloAbiertos || filtrosActivos;
        filtrarLocales();
    });

    formTriggers.forEach((trigger) => {
        trigger.addEventListener("click", (event) => {
            event.preventDefault();
            abrirFormulario(trigger.dataset.formModal);
        });
    });

    document.querySelectorAll(".comm-card").forEach((card, index) => {
        card.addEventListener("click", () => abrirDetalle(joyitas[index]));
    });

    updateCategoryButtons();
    filtrarLocales();
});

function convertirHoraAMinutos(valor) {
    const match = valor.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
}

function estaAbiertoAhora(horario) {
    if (!horario || !horario.includes("-")) return false;
    const ahora = new Date();
    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
    const partes = horario.split("-").map((parte) => parte.trim());
    if (partes.length !== 2) return false;

    const inicio = convertirHoraAMinutos(partes[0]);
    const fin = convertirHoraAMinutos(partes[1]);
    if (inicio === null || fin === null) return false;

    if (inicio <= fin) return minutosActuales >= inicio && minutosActuales <= fin;
    return minutosActuales >= inicio || minutosActuales <= fin;
}

function abrirDetalle(local) {
    document.getElementById("modal-titulo").innerText = local.name;
    document.getElementById("modal-categoria").innerText = local.category;
    document.getElementById("modal-dir").innerText = `${local.comuna} · ${local.loc}`;
    document.getElementById("modal-desc").innerText = local.desc;
    document.getElementById("modal-hor").innerText = local.hor;
    document.getElementById("modal-img").src = `images/${local.img}`;
    document.getElementById("modal-img").alt = local.name;

    const waBtn = document.getElementById("modal-wa");
    const waLink = local.wa ? `https://wa.me/${local.wa.replace(/\D/g, "")}` : "#";

    waBtn.href = waLink;
    waBtn.classList.toggle("is-hidden", waLink === "#");

    document.getElementById("modal-detalle").style.display = "flex";
}

function cerrarModal() {
    document.getElementById("modal-detalle").style.display = "none";
}

function abrirFormulario(tipoFormulario) {
    const modal = document.getElementById("form-modal");
    const frame = document.getElementById("form-modal-frame");
    const url = formUrls[tipoFormulario];
    if (!modal || !frame || !url) return;
    frame.src = url;
    modal.style.display = "flex";
}

function cerrarFormulario() {
    const modal = document.getElementById("form-modal");
    const frame = document.getElementById("form-modal-frame");
    if (!modal || !frame) return;
    modal.style.display = "none";
    frame.src = "";
}

window.onclick = function (event) {
    if (event.target === document.getElementById("modal-detalle")) cerrarModal();
    if (event.target === document.getElementById("form-modal")) cerrarFormulario();
};
