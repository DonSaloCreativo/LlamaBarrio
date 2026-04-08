const allProducts = [
  { name: "Casera", image: "images/casera.jpg", price: 5000, comuna: "Providencia" },
  { name: "Completo", image: "images/completo.jpg", price: 6000, comuna: "Las Condes" },
  { name: "Empanadas", image: "images/empanadas.jpg", price: 2000, comuna: "Ñuñoa" },
  { name: "Pizza", image: "images/pizza.jpg", price: 8000, comuna: "Providencia" },
  { name: "Sushi", image: "images/sushi.jpg", price: 9000, comuna: "Las Condes" }
];

const cheapScroll = document.getElementById("cheap-scroll");
const featuredScroll = document.getElementById("featured-scroll");
const productList = document.getElementById("product-list");

const locationFilter = document.getElementById("location-filter");
const searchInput = document.getElementById("search-input");

function displayProducts(products) {
  cheapScroll.innerHTML = "";
  featuredScroll.innerHTML = "";
  productList.innerHTML = "";

  products.forEach(p => {
    const cheapCard = document.createElement("div");
    cheapCard.className = "cheap-card";
    cheapCard.innerHTML = `
      <img src="${p.image}">
      <div class="info">
        <strong>${p.name}</strong><br>
        $${p.price}
        <div class="price-tag">$${p.price}</div>
      </div>
    `;
    cheapScroll.appendChild(cheapCard);

    const featuredCard = document.createElement("div");
    featuredCard.className = "featured-card";
    featuredCard.innerHTML = `
      <img src="${p.image}">
      <div class="info">
        <strong>${p.name}</strong><br>
        $${p.price}
        <div class="price-tag">$${p.price}</div>
      </div>
    `;
    featuredScroll.appendChild(featuredCard);

    const li = document.createElement("li");
    li.innerHTML = `
      <img class="product-img" src="${p.image}">
      <div class="product-info">
        <strong>${p.name}</strong><br>
        $${p.price}
      </div>
    `;
    productList.appendChild(li);
  });
}

function buscar() {
  const comuna = locationFilter.value;
  const query = searchInput.value.toLowerCase();

  const filtered = allProducts.filter(p => {
    const matchComuna = comuna ? p.comuna === comuna : true;
    const matchName = query ? p.name.toLowerCase().includes(query) : true;
    return matchComuna && matchName;
  });

  displayProducts(filtered);
}

// Inicializar
displayProducts(allProducts);