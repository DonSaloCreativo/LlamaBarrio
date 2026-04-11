let allProducts = [];

async function cargarTodo() {
    const r = await fetch("https://script.google.com/macros/s/AKfycbx3eTprAjyYooIep7S2w_Q9kIUCCvknoWHORhyglVlOHWKWZ8ononv6-FvpDrXyC7OPfw/exec");
    const data = await r.json();

    allProducts = data.values.slice(1).map(r => ({
        nombre: r[0],
        imagen: r[1],
        precio: r[3],
        comuna: r[4]
    }));

    buscar();
}

function buscar() {
    const txt = document.getElementById("main-search").value.toLowerCase();
    const loc = document.getElementById("location-filter").value;

    const filtrados = allProducts.filter(p =>
        p.nombre.toLowerCase().includes(txt) &&
        (!loc || p.comuna === loc)
    );

    document.getElementById("product-list").innerHTML =
        filtrados.map(card).join("");

    const recomendados = loc
        ? allProducts.filter(p => p.comuna === loc)
        : allProducts;

    document.getElementById("comuna-list").innerHTML =
        recomendados.slice(0, 4).map(card).join("");
}

function card(p) {
    return `
    <div class="res-card" onclick='abrir(${JSON.stringify(p)})'>
        <img src="${p.imagen}">
        <div>
            <b>${p.nombre}</b>
            <div>$${p.precio}</div>
        </div>
    </div>`;
}

function abrir(p) {
    document.getElementById("popup-body").innerHTML =
        `<h3>${p.nombre}</h3>`;
    document.getElementById("productPopup").style.display = "flex";
}

function cerrarPopupProducto() {
    document.getElementById("productPopup").style.display = "none";
}

window.onload = cargarTodo;