const allProducts = [
  { name: "Casera", image: "images/casera.jpg", price: 5000 },
  { name: "Completo", image: "images/completo.jpg", price: 6000 },
  { name: "Empanadas", image: "images/empanadas.jpg", price: 2000 },
  { name: "Pizza", image: "images/pizza.jpg", price: 8000 },
  { name: "Sushi", image: "images/sushi.jpg", price: 9000 }
];

const cheapScroll = document.getElementById("cheap-scroll");
const featuredScroll = document.getElementById("featured-scroll");
const productList = document.getElementById("product-list");

function displayProducts(products) {
  cheapScroll.innerHTML = "";
  featuredScroll.innerHTML = "";
  productList.innerHTML = "";

  products.forEach(p => {
    // Lo más barato
    const cheapCard = document.createElement("div");
    cheapCard.className = "cheap-card";
    cheapCard.innerHTML = `<img src="${p.image}"><div class="info"><strong>${p.name}</strong><br> $${p.price}</div>`;
    cheapScroll.appendChild(cheapCard);

    // Destacados (puedes aplicar lógica real si quieres)
    const featuredCard = document.createElement("div");
    featuredCard.className = "featured-card";
    featuredCard.innerHTML = `<img src="${p.image}"><div class="info"><strong>${p.name}</strong><br> $${p.price}</div>`;
    featuredScroll.appendChild(featuredCard);

    // Todas las promociones
    const li = document.createElement("li");
    li.innerHTML = `<img class="product-img" src="${p.image}"><div class="product-info"><strong>${p.name}</strong><br>$${p.price}</div>`;
    productList.appendChild(li);
  });
}

// FILTRO BÁSICO
function buscar() {
  displayProducts(allProducts);
}

// Inicializar
displayProducts(allProducts);