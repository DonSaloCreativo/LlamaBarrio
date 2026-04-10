const comunas = ["Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Bernardo", "San Joaquín", "San Miguel", "San Ramón", "Santiago", "Vitacura"];

const allProducts = [
    { name: "Sushis del Puerto", image: "images/sushi.jpg", price: 12000, comuna: "Santiago", desc: "Sushi premium artesanal.", contacto: "+569 1234 5678" },
    { name: "La Picada de Don Salo", image: "images/casera.jpg", price: 5500, comuna: "San Bernardo", desc: "Sabor casero de verdad.", contacto: "+569 8888 7777" },
    { name: "Pizzería Italia", image: "images/pizza.jpg", price: 8990, comuna: "Santiago", desc: "Pizzas a la piedra.", contacto: "www.italia.cl" },
    { name: "Empanadas Ñuñoa", image: "images/empanadas.jpg", price: 2500, comuna: "Ñuñoa", desc: "Receta tradicional.", contacto: "+562 222 3344" }
];

function init() {
    const filter = document.getElementById("location-filter");
    if(filter){
        filter.innerHTML = '<option value="">Comuna</option>';
        comunas.sort().forEach(c => {
            const op = document.createElement("option");
            op.value = c; op.textContent = c;
            filter.appendChild(op);
        });
    }
    displayProducts(allProducts);
}

function displayProducts(products) {
    const list = document.getElementById("product-list");
    const scroll = document.getElementById("cheap-scroll");
    const comunaList = document.getElementById("comuna-list");

    if(scroll){
        scroll.innerHTML = "";
        allProducts.forEach(p => {
            const div = document.createElement("div");
            div.className = "circle-item";
            div.onclick = () => abrirDetalleProducto(p);
            div.innerHTML = `<img src="${p.image}" class="circle-img"><p style="font-size:0.7rem; font-weight:600; margin-top:5px;">${p.name}</p>`;
            scroll.appendChild(div);
        });
    }

    if(list){
        list.innerHTML = "";
        if(products.length === 0) document.getElementById("no-results").style.display = "block";
        else {
            document.getElementById("no-results").style.display = "none";
            products.forEach(p => {
                const card = document.createElement("div");
                card.className = "res-card";
                card.onclick = () => abrirDetalleProducto(p);
                card.innerHTML = `<img src="${p.image}" class="res-thumb"><div class="res-info"><strong>${p.name}</strong><br><small>📍 ${p.comuna}</small><div style="color:#FF4500; font-weight:700; margin-top:5px;">$${p.price.toLocaleString('es-CL')}</div></div>`;
                list.appendChild(card);
            });
        }
    }

    if(comunaList) {
        comunaList.innerHTML = "";
        allProducts.slice(0, 3).forEach(p => {
            const card = document.createElement("div");
            card.className = "res-card";
            card.onclick = () => abrirDetalleProducto(p);
            card.innerHTML = `<img src="${p.image}" class="res-thumb"><div class="res-info"><strong>${p.name}</strong><br><small>📍 ${p.comuna}</small><div style="color:#FF4500; font-weight:700; margin-top:5px;">$${p.price.toLocaleString('es-CL')}</div></div>`;
            comunaList.appendChild(card);
        });
    }
}

function abrirDetalleProducto(p) {
    const body = document.getElementById("popup-body");
    body.innerHTML = `<img src="${p.image}" style="width:100%; height:180px; object-fit:cover;"><div style="padding:20px; text-align:center;"><h2>${p.name}</h2><p>${p.desc}</p><h3 style="color:#FF4500;">$${p.price.toLocaleString('es-CL')}</h3><button onclick="cerrarPopupProducto()" style="background:#2ecc71; color:white; border:none; padding:10px; width:100%; border-radius:10px; font-weight:bold; cursor:pointer; margin-top:10px;">Cerrar</button></div>`;
    document.getElementById("productPopup").style.display = "flex";
}

function cerrarPopupProducto() { document.getElementById("productPopup").style.display = "none"; }
function abrirFormPromo() { document.getElementById("popupPromo").style.display = "flex"; }
function cerrarFormPromo() { document.getElementById("popupPromo").style.display = "none"; }
function abrirFormDato() { document.getElementById("popupDato").style.display = "flex"; }
function cerrarFormDato() { document.getElementById("popupDato").style.display = "none"; }

function buscar() {
    const loc = document.getElementById("location-filter").value;
    const txt = document.getElementById("main-search").value.toLowerCase();
    const res = allProducts.filter(p => (loc ? p.comuna === loc : true) && p.name.toLowerCase().includes(txt));
    displayProducts(res);
}

window.onclick = (e) => { if(e.target.className === 'popup-overlay') e.target.style.display = "none"; }
init();