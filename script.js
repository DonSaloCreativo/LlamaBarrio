const apiUrl = "https://api.sheetbest.com/sheets/caf4ae8d-2b11-42a4-bf34-c2b68a0b921a";

let allProducts = [];

const productList = document.getElementById("product-list");
const featuredList = document.getElementById("featured-scroll");
const cheapList = document.getElementById("cheap-scroll");
const searchInput = document.getElementById("search-input");
const locationFilter = document.getElementById("location-filter");
const whatsappButton = document.getElementById("whatsapp-btn");
const contactBtn = document.getElementById("contact-btn");

// CONTACTO GENERAL
contactBtn.addEventListener("click", () => {
  window.open("https://wa.me/56984368260?text=Hola, quiero saber más sobre RedBarrio");
});

// BOTÓN NEGOCIO
function botonNegocio(p) {
  const telefono = (p.telefono || "").trim();

  if (!telefono) {
    return `<button class="contact-business" disabled>Sin contacto</button>`;
  }

  return `
    <button class="contact-business"
      onclick="window.open('https://wa.me/${telefono}?text=Hola, te hablo por ${encodeURIComponent(p.nombre)}')">
      Contactar negocio
    </button>
  `;
}

// MOSTRAR PRODUCTOS
function displayProducts(products) {
  productList.innerHTML = "";
  featuredList.innerHTML = "";
  cheapList.innerHTML = "";

  const loc = locationFilter.value;

  const filtrados = products.filter(p =>
    loc === "Todas" || p.comuna === loc
  );

  // 💸 BARATOS
  filtrados
    .sort((a, b) => (parseInt(a.precio) || 999999) - (parseInt(b.precio) || 999999))
    .slice(0, 5)
    .forEach(p => {
      cheapList.innerHTML += `
        <div class="cheap-card">
          <img src="${p.imagen}">
          <div class="info">
            <h3>${p.nombre}</h3>
            <p>${p.precio}</p>
            ${botonNegocio(p)}
          </div>
        </div>
      `;
    });

  // 🔥 DESTACADOS
  filtrados
    .filter(p => (p.nombre || "").toLowerCase().includes("promo"))
    .slice(0, 5)
    .forEach(p => {
      featuredList.innerHTML += `
        <div class="featured-card">
          <img src="${p.imagen}">
          <div class="info">
            <h3>${p.nombre}</h3>
            <p>${p.precio}</p>
            ${botonNegocio(p)}
          </div>
        </div>
      `;
    });

  // 📍 TODOS
  filtrados.forEach(p => {
    productList.innerHTML += `
      <li>
        <img src="${p.imagen}" class="product-img">
        <div class="product-info">
          <h3>${p.nombre}</h3>
          <p>${p.precio}</p>
          ${botonNegocio(p)}
        </div>
      </li>
    `;
  });
}

// CARGAR DATOS
fetch(apiUrl)
  .then(res => res.json())
  .then(data => {
    allProducts = data;

    const comunas = ["Todas", ...new Set(data.map(p => p.comuna))];
    locationFilter.innerHTML = comunas.map(c => `<option>${c}</option>`);

    displayProducts(allProducts);
  });

// EVENTOS
searchInput.addEventListener("input", () => displayProducts(allProducts));
locationFilter.addEventListener("change", () => displayProducts(allProducts));

// BOTÓN FORMULARIO
whatsappButton.addEventListener("click", () => {
  window.open("https://forms.gle/yNVktkjKFGuWC7MP8");
});

// FUNCIÓN BUSCAR BOTÓN
function buscar() {
  displayProducts(allProducts);
}