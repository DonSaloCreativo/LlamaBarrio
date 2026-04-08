const allProducts = [
  { name: "Casera", image: "images/casera.jpg", price: 5000, comuna: "Providencia", tipo: "barato" },
  { name: "Completo", image: "images/completo.jpg", price: 6000, comuna: "Las Condes", tipo: "destacado" },
  { name: "Empanadas", image: "images/empanadas.jpg", price: 2000, comuna: "Ñuñoa", tipo: "barato" },
  { name: "Pizza", image: "images/pizza.jpg", price: 8000, comuna: "Providencia", tipo: "destacado" },
  { name: "Sushi", image: "images/sushi.jpg", price: 9000, comuna: "Las Condes", tipo: "barato" }
];

const cheapScroll = document.getElementById("cheap-scroll");
const featuredScroll = document.getElementById("featured-scroll");
const productList = document.getElementById("product-list");
const locationFilter = document.getElementById("location-filter");
const searchInput = document.getElementById("search-input");

const normalizeText = (text) => {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

function displayProducts(products) {
  cheapScroll.innerHTML = "";
  featuredScroll.innerHTML = "";
  productList.innerHTML = "";

  if (products.length === 0) {
    productList.innerHTML = "<p style='padding:20px;'>No hay resultados.</p>";
    return;
  }

  products.forEach(p => {
    // Formato moneda chilena
    const formattedPrice = "$" + p.price.toLocaleString('es-CL');

    // Tarjeta para los scrolls superiores
    const card = document.createElement("div");
    card.className = "cheap-card";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <div class="price-tag">${formattedPrice}</div>
      <div class="info">
        <strong>${p.name}</strong><br>
        <small>${p.comuna}</small>
      </div>
    `;

    if (p.tipo === "barato") {
      cheapScroll.appendChild(card);
    } else {
      card.className = "featured-card";
      featuredScroll.appendChild(card);
    }

    // Lista vertical inferior
    const li = document.createElement("li");
    li.innerHTML = `
      <img class="product-img" src="${p.image}">
      <div class="product-info">
        <div style="display:flex; justify-content:space-between;">
          <strong>${p.name}</strong>
          <span style="color:#25D366; font-weight:bold;">${formattedPrice}</span>
        </div>
        <small>${p.comuna}</small>
      </div>
    `;
    productList.appendChild(li);
  });
}

function buscar() {
  const comuna = locationFilter.value;
  const query = normalizeText(searchInput.value);

  const filtered = allProducts.filter(p => {
    const matchComuna = comuna ? p.comuna === comuna : true;
    const matchName = query ? normalizeText(p.name).includes(query) : true;
    return matchComuna && matchName;
  });

  displayProducts(filtered);
}

// Carga inicial
displayProducts(allProducts);