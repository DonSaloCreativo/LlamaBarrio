const comunas = ["Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Bernardo", "San Joaquín", "San Miguel", "San Ramón", "Santiago", "Vitacura"];

const API_URL = "https://api.sheetbest.com/sheets/caf4ae8d-2b11-42a4-bf34-c2b68a0b921a";
let allProducts = [];

/* ================= INIT ================= */
function init() {
    const filter = document.getElementById("location-filter");
    if (filter) {
        filter.innerHTML = '<option value="">Comuna</option>';
        comunas.sort().forEach(c => {
            const op = document.createElement("option");
            op.value = c;
            op.textContent = c;
            filter.appendChild(op);
        });
    }

    cargarProductos();
}

/* ================= LOAD DATA ================= */
function cargarProductos() {
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {

            // 🔥 SOLO APROBADOS
            allProducts = data.filter(p => p.estado === "aprobado");

            displayProducts(allProducts);
        });
}

/* ================= RENDER ================= */
function displayProducts(products) {
    const list = document.getElementById("product-list");
    const scroll = document.getElementById("cheap-scroll");
    const comunaList = document.getElementById("comuna-list");

    if (scroll) {
        scroll.innerHTML = "";
        allProducts.slice(0, 10).forEach(p => {
            const div = document.createElement("div");
            div.className = "circle-item";
            div.onclick = () => abrirDetalleProducto(p);
            div.innerHTML = `<img src="${p.imagen}" class="circle-img"><p style="font-size:0.7rem; font-weight:600; margin-top:5px;">${p.nombre}</p>`;
            scroll.appendChild(div);
        });
    }

    if (list) {
        list.innerHTML = "";

        if (products.length === 0) {
            document.getElementById("no-results").style.display = "block";
        } else {
            document.getElementById("no-results").style.display = "none";

            products.forEach(p => {
                const card = document.createElement("div");
                card.className = "res-card";
                card.onclick = () => abrirDetalleProducto(p);

                card.innerHTML = `
                    <img src="${p.imagen}" class="res-thumb">
                    <div class="res-info">
                        <strong>${p.nombre}</strong><br>
                        <small>📍 ${p.comuna}</small>
                        <div style="color:#FF4500; font-weight:700; margin-top:5px;">
                            $${Number(p.precio).toLocaleString('es-CL')}
                        </div>
                    </div>
                `;

                list.appendChild(card);
            });
        }
    }

    if (comunaList) {
        comunaList.innerHTML = "";
        allProducts.slice(0, 3).forEach(p => {
            const card = document.createElement("div");
            card.className = "res-card";
            card.onclick = () => abrirDetalleProducto(p);

            card.innerHTML = `
                <img src="${p.imagen}" class="res-thumb">
                <div class="res-info">
                    <strong>${p.nombre}</strong><br>
                    <small>📍 ${p.comuna}</small>
                    <div style="color:#FF4500; font-weight:700; margin-top:5px;">
                        $${Number(p.precio).toLocaleString('es-CL')}
                    </div>
                </div>
            `;

            comunaList.appendChild(card);
        });
    }
}

/* ================= POPUP ================= */
function abrirDetalleProducto(p) {
    const body = document.getElementById("popup-body");

    body.innerHTML = `
        <img src="${p.imagen}" style="width:100%; height:180px; object-fit:cover;">
        <div style="padding:20px; text-align:center;">
            <h2>${p.nombre}</h2>
            <p>${p.desc || ""}</p>
            <h3 style="color:#FF4500;">$${Number(p.precio).toLocaleString('es-CL')}</h3>
            <p>📞 ${p.telefono || ""}</p>
            <button onclick="cerrarPopupProducto()" style="background:#2ecc71; color:white; border:none; padding:10px; width:100%; border-radius:10px; font-weight:bold; cursor:pointer; margin-top:10px;">
                Cerrar
            </button>
        </div>
    `;

    document.getElementById("productPopup").style.display = "flex";
}

function cerrarPopupProducto() {
    document.getElementById("productPopup").style.display = "none";
}

/* ================= FORM POPUPS ================= */
function abrirFormPromo() { document.getElementById("popupPromo").style.display = "flex"; }
function cerrarFormPromo() { document.getElementById("popupPromo").style.display = "none"; }
function abrirFormDato() { document.getElementById("popupDato").style.display = "flex"; }
function cerrarFormDato() { document.getElementById("popupDato").style.display = "none"; }

/* ================= SEARCH ================= */
function buscar() {
    const loc = document.getElementById("location-filter").value;
    const txt = document.getElementById("main-search").value.toLowerCase();

    const res = allProducts.filter(p =>
        (loc ? p.comuna === loc : true) &&
        p.nombre.toLowerCase().includes(txt)
    );

    displayProducts(res);
}

/* ================= CLOSE OVERLAY ================= */
window.onclick = (e) => {
    if (e.target.className === 'popup-overlay') {
        e.target.style.display = "none";
    }
};

init();