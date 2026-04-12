const locales = [
    { name: "Rincón Familiar", loc: "Esmeralda 469", desc: "Almacén y pan fresco.", hor: "09:00 - 21:00", img: "almacen.png", wa: "569XXXXXXXX" },
    { name: "Botillería El Paso", loc: "Calle Real 123", desc: "Licores y bebidas heladas.", hor: "12:00 - 00:00", img: "botilleria.png", wa: "569XXXXXXXX" },
    { name: "Frutas del Campo", loc: "Av. Central 45", desc: "Frutas y verduras frescas.", hor: "08:00 - 20:00", img: "verduleria.png", wa: "569XXXXXXXX" },
    { name: "Sushi San", loc: "O'Higgins 332", desc: "Rolls artesanales.", hor: "18:00 - 23:00", img: "sushi.jpg", wa: "569XXXXXXXX" },
    { name: "Pizzería Roma", loc: "Urmeneta 10", desc: "Pizza a la piedra.", hor: "12:00 - 22:00", img: "pizzeria.png", wa: "569XXXXXXXX" },
    { name: "Empanadas Express", loc: "Colon 445", desc: "Pino y Queso.", hor: "10:00 - 16:00", img: "empanadas.jpg", wa: "569XXXXXXXX" },
    { name: "Comida Rápida", loc: "Plaza de Armas", desc: "Sándwiches y completos.", hor: "11:00 - 23:00", img: "comida rapida.png", wa: "569XXXXXXXX" },
    { name: "Panadería Don Pan", loc: "Eyzaguirre 12", desc: "Pan artesanal.", hor: "07:00 - 20:00", img: "panaderia.png", wa: "569XXXXXXXX" }
];

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('locals-grid');
    if (!grid) return;

    locales.forEach(l => {
        const card = document.createElement('div');
        card.className = 'local-card';
        card.onclick = () => abrirDetalle(l.name, l.loc, l.desc, l.hor, l.wa, l.img);
        
        card.innerHTML = `
            <div class="local-img-box"><img src="images/${l.img}"></div>
            <div class="local-body">
                <h3 style="margin:0; font-size:0.9rem; font-weight:700;">${l.name}</h3>
                <p style="font-size:0.75rem; color:#777; margin:5px 0;">📍 ${l.loc}</p>
                <button class="btn-ver">Ver más</button>
            </div>`;
        grid.appendChild(card);
    });
});

function abrirDetalle(titulo, direccion, desc, horario, contacto, imagen) {
    document.getElementById('modal-titulo').innerText = titulo;
    document.getElementById('modal-dir').innerText = direccion;
    document.getElementById('modal-desc').innerText = desc;
    document.getElementById('modal-hor').innerText = horario;
    document.getElementById('modal-img').src = "images/" + imagen;
    const waBtn = document.getElementById('modal-wa');
    if(contacto && contacto !== "Sin contacto") {
        waBtn.style.display = "block";
        waBtn.href = "https://wa.me/" + contacto.replace(/\D/g,'');
    } else { waBtn.style.display = "none"; }
    document.getElementById('modal-detalle').style.display = 'flex';
}

function cerrarModal() { document.getElementById('modal-detalle').style.display = 'none'; }
window.onclick = function(e) { if (e.target == document.getElementById('modal-detalle')) cerrarModal(); }