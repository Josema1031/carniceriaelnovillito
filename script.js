// Firebase SDKs

const tiendaId = "CARNICERIAELNOVILLITO"; // <- el ID exacto de tu tienda
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA36uwBk0FBDc6rI16BAsqUNe_AXLpv62Q",
  authDomain: "carniceriadonjose-48638.firebaseapp.com",
  projectId: "carniceriadonjose-48638",
  storageBucket: "carniceriadonjose-48638.firebasestorage.app",
  messagingSenderId: "322531750471",
  appId: "1:322531750471:web:78e290c9c81eecc7be3762"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const productosRef = collection(db, "tiendas", tiendaId, "productos");



let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let productosCargados = [];
let productosMostrados = 0;
const cantidadPorCarga = 8;


// Cargar productos desde Firebase
async function cargarProductos() {
  document.getElementById("loader").style.display = "block";

  // No usar caché: siempre traer datos frescos desde Firebase
try {
  const snapshot = await getDocs(productosRef);
  productosCargados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  mostrarProductos(productosCargados);
} catch (error) {
  console.error("Error cargando productos desde Firebase:", error);
} finally {
  document.getElementById("loader").style.display = "none";
}

}


// Buscar productos en tiempo real
document.getElementById("buscador").addEventListener("input", e => {
  const texto = e.target.value.toLowerCase();
  const filtrados = productosCargados.filter(p => p.nombre.toLowerCase().includes(texto));
  mostrarProductos(filtrados);
});

// Agregar producto al carrito
function agregarAlCarrito(id, nombre, precio) {
  const index = carrito.findIndex(p => p.id === id);
  if (index !== -1) {
    carrito[index].cantidad += 1;
  } else {
    carrito.push({ id, nombre, precio, cantidad: 1 });
  }
  guardarCarrito();
  mostrarCarrito();
}

// Guardar carrito en localStorage
function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}
window.addEventListener("beforeunload", () => {
  localStorage.removeItem("carrito");
});


// Mostrar el contenido del carrito
function mostrarCarrito() {
  const lista = document.getElementById("lista-carrito");
  lista.innerHTML = "";

  carrito.forEach((prod, index) => {
    const subtotal = prod.precio * prod.cantidad;
    const li = document.createElement("li");
    li.innerHTML = `
      ${prod.nombre} - $${prod.precio} x ${prod.cantidad} = <strong>$${subtotal}</strong><br>
      <button onclick="disminuirCantidad(${index})">➖</button>
      <button onclick="aumentarCantidad(${index})">➕</button>
      <button onclick="eliminarDelCarrito(${index})">❌</button>
    `;
    lista.appendChild(li);
  });

  const total = carrito.reduce((acc, prod) => acc + prod.precio * prod.cantidad, 0);
  document.getElementById("total").textContent = `Total: $${total}`;
}

// Aumentar cantidad
function aumentarCantidad(index) {
  carrito[index].cantidad += 1;
  guardarCarrito();
  mostrarCarrito();
}

// Disminuir cantidad
function disminuirCantidad(index) {
  if (carrito[index].cantidad > 1) {
    carrito[index].cantidad -= 1;
  } else {
    carrito.splice(index, 1);
  }
  guardarCarrito();
  mostrarCarrito();
}

// Eliminar producto
function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  guardarCarrito();
  mostrarCarrito();
}

// Vaciar carrito
document.getElementById("btn-vaciar").addEventListener("click", () => {
  if (confirm("¿Estás seguro que querés vaciar el carrito?")) {
    carrito = [];
    guardarCarrito();
    mostrarCarrito();
  }
});

// Enviar pedido por WhatsApp
document.getElementById("btn-enviar").addEventListener("click", () => {
  if (carrito.length === 0) {
    alert("El carrito está vacío");
    return;
  }

  const mensajeProductos = carrito.map(p => `${p.nombre} - $${p.precio} x ${p.cantidad}`).join("\n");
  const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  const mensajeCompleto = `${mensajeProductos}\n\nTotal del pedido: $${total}`;

  const url = `https://wa.me/5492644429649?text=Hola, quiero hacer el siguiente pedido:%0A${encodeURIComponent(mensajeCompleto)}`;

  window.open(url, "_blank");
  carrito = [];
  guardarCarrito();
  mostrarCarrito();
  window.location.href = "gracias.html";
});


// Carrito flotante
document.getElementById("toggle-carrito").addEventListener("click", () => {
  document.getElementById("carrito-contenido").classList.toggle("oculto");
});

// Modal
function abrirModal(id) {
  const producto = productosCargados.find(p => p.id === id);
  if (!producto) return;

  document.getElementById("modal-imagen").src = producto.imagen;
  document.getElementById("modal-nombre").textContent = producto.nombre;
  document.getElementById("modal-precio").textContent = "$" + producto.precio;
  document.getElementById("modal-descripcion").textContent = producto.descripcion || "";
  document.getElementById("modal-producto").classList.remove("oculto");

  document.getElementById("modal-agregar").onclick = () => {
    agregarAlCarrito(producto.id, producto.nombre, producto.precio);
    cerrarModal();
  };
}

function cerrarModal() {
  document.getElementById("modal-producto").classList.add("oculto");
}

// Mostrar productos
function mostrarProductos(lista) {
  const contenedor = document.getElementById("contenedor-productos");
  contenedor.innerHTML = "";

  productosMostrados = 0;
  cargarMasProductos(lista);

  const btn = document.getElementById("btn-mostrar-mas");
  if (lista.length > cantidadPorCarga) {
    btn.style.display = "inline-block";
    btn.onclick = () => cargarMasProductos(lista);
  } else {
    btn.style.display = "none";
  }
}

function cargarMasProductos(lista) {
  const contenedor = document.getElementById("contenedor-productos");
  const fin = productosMostrados + cantidadPorCarga;
  const fragmento = lista.slice(productosMostrados, fin);

  fragmento.forEach(prod => {
    if (!prod.id || !prod.nombre || !prod.precio) return;

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <img src="${prod.imagen}" alt="${prod.nombre}" style="cursor: pointer;" onclick="abrirModal('${prod.id}')">
      <h3>${prod.nombre}</h3>
      <p>$${prod.precio} por ${prod.tipoVenta || 'unidad'}</p>
      <button onclick="agregarAlCarrito('${prod.id}', '${prod.nombre.replaceAll("'", "\\'")}', ${prod.precio})">Agregar</button>
    `;
    contenedor.appendChild(div);
  });

  productosMostrados += fragmento.length;

  const btn = document.getElementById("btn-mostrar-mas");
  if (productosMostrados >= lista.length) {
    btn.style.display = "none";
  }
}


// Iniciar
cargarProductos();
mostrarCarrito();

// Exponer funciones al contexto global
window.agregarAlCarrito = agregarAlCarrito;
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.disminuirCantidad = disminuirCantidad;
window.aumentarCantidad = aumentarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;

window.addEventListener("storage", e => {
  if (e.key === "productosActualizados") {
    cargarProductos(); // vuelve a cargar desde Firebase
  }
});

function filtrarCategoria(categoria) {
  if (categoria === 'todo') {
    mostrarProductos(productosCargados);
  } else {
    const filtrados = productosCargados.filter(p => p.categoria === categoria);
    mostrarProductos(filtrados);
  }
}
window.filtrarCategoria = filtrarCategoria;




