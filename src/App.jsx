import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShoppingCart, Menu, X, Plus, Minus, Trash2, MessageCircle, ChevronRight,
  ChevronLeft, Lock, Star, MapPin, Phone, Mail, Clock, Instagram, Facebook,
  Wheat, Shirt, Droplet, Package, Link2, Check, Edit2, Save, LogOut, PlusCircle,
  ImageOff, AlertCircle
} from "lucide-react";

/* =========================================================================
   TIENDA CRIOLLA — Productos para el Caballo Criollo Colombiano
   -------------------------------------------------------------------------
   Guía rápida para Esteban:
   - Todo el "contenido" de la tienda (productos, combos, datos de contacto,
     número de WhatsApp) vive en objetos de JavaScript más abajo (sección
     DATOS POR DEFECTO) y se guarda con window.storage. Así el código NUNCA
     tiene que tocarse para agregar un producto: se hace desde el Panel
     Admin (candado en la esquina superior derecha).
   - window.storage es una base de datos simple llave→valor que persiste
     entre visitas. Se usa "shared: true" para productos/combos/config
     (para que TODOS los visitantes vean lo mismo) y "shared: false" para
     el carrito de cada persona (privado).
   - No hay backend real todavía. La contraseña del panel admin es solo un
     candado básico para no mostrar los botones de edición a cualquiera;
     cuando conectes una base de datos de verdad, reemplaza ADMIN LOGIN por
     autenticación real.
   ========================================================================= */

/* ---------------------------- Utilidades ---------------------------- */

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const formatCOP = (n) =>
  "$" + Math.round(Number(n) || 0).toLocaleString("es-CO") ;

// NOTA PARA ESTEBAN:
// En el artefacto de Claude estas funciones usaban "window.storage" (una base
// de datos que Anthropic ofrece SOLO dentro del chat). Fuera de Claude eso no
// existe, así que aquí las reemplazamos por localStorage: guarda los datos en
// el navegador de quien los creó. Funciona perfecto para probar y hasta para
// una tienda pequeña, PERO OJO: si editas productos desde tu celular, esos
// cambios NO se verán en el computador de un cliente — cada navegador tiene
// su propio localStorage. Cuando quieras que los cambios del panel admin se
// vean para TODOS los visitantes, el siguiente paso es conectar una base de
// datos real (Supabase es una opción gratuita y sencilla). El README explica
// esto con más detalle.
async function storageGet(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
async function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("No se pudo guardar", key, e);
  }
}

/* ---------------------------- Datos por defecto ---------------------------- */

const DEFAULT_CONFIG = {
  nombreTienda: "Finca Criolla",
  eslogan: "Tradición, elegancia y pasión por el Caballo Criollo Colombiano",
  whatsappNumber: "573001234567", // formato: código de país + número, sin + ni espacios
  telefono: "+57 300 123 4567",
  email: "contacto@fincacriolla.co",
  direccion: "Vereda El Trapiche, Sopó, Cundinamarca",
  horario: "Lunes a sábado · 8:00 a.m. – 6:00 p.m.",
  instagram: "@fincacriolla",
  facebook: "Finca Criolla",
  adminPassword: "criollo2026",
  nosotrosTexto:
    "Somos una familia de caballistas antes que una tienda. Durante más de una década hemos criado, entrenado y presentado Caballos de Paso Fino Colombiano, y cada producto que vendemos es el mismo que usamos en nuestra propia finca. No creemos en el catálogo genérico de mascotas: creemos en el apero bien hecho, el concentrado que sí rinde y el trato que un animal de trabajo y de exhibición se merece. Trabajamos con talabarteros, veterinarios y criadores colombianos para ofrecerte productos probados en el llano, la sabana y la pista.",
};

const DEFAULT_CATEGORIES = [
  { id: "alimentacion", nombre: "Alimentación", icono: "Wheat" },
  { id: "accesorios", nombre: "Accesorios", icono: "Link2" },
  { id: "monturas", nombre: "Monturas y Aperos", icono: "Package" },
  { id: "ropa", nombre: "Ropa para Montar", icono: "Shirt" },
  { id: "cuidado", nombre: "Cuidado y Aseo", icono: "Droplet" },
  { id: "otros", nombre: "Otros Productos", icono: "Package" },
];

const ICONS = { Wheat, Link2, Package, Shirt, Droplet };

const DEFAULT_PRODUCTS = [
  { id: uid(), nombre: "Concentrado Premium 40kg", categoria: "alimentacion", precio: 145000, descripcion: "Fórmula balanceada para caballos de trabajo y exhibición, alta en fibra y proteína.", disponible: true, imagen: "", variantes: "" },
  { id: uid(), nombre: "Suplemento Mineral en Bloque", categoria: "alimentacion", precio: 38000, descripcion: "Bloque de sales minerales para completar la dieta diaria.", disponible: true, imagen: "", variantes: "" },
  { id: uid(), nombre: "Vitaminas para Casco y Pelaje", categoria: "alimentacion", precio: 62000, descripcion: "Biotina y omega-3 para fortalecer casco, crin y cola.", disponible: true, imagen: "", variantes: "" },
  { id: uid(), nombre: "Cabestro de Cuero Trenzado", categoria: "accesorios", precio: 95000, descripcion: "Cuero colombiano trenzado a mano, hebillas de bronce.", disponible: true, imagen: "", variantes: "Talla: Potro, Caballo" },
  { id: uid(), nombre: "Riendas de Cuero con Costura Doble", categoria: "accesorios", precio: 78000, descripcion: "Resistentes y flexibles, ideales para paso fino.", disponible: true, imagen: "", variantes: "" },
  { id: uid(), nombre: "Cincha Acolchada", categoria: "accesorios", precio: 54000, descripcion: "Acolchado transpirable, evita rozaduras.", disponible: true, imagen: "", variantes: "" },
  { id: uid(), nombre: "Montura Colombiana Clásica", categoria: "monturas", precio: 890000, descripcion: "Montura en cuero grabado a mano, estilo llanero tradicional.", disponible: true, imagen: "", variantes: "Color: Café, Negro" },
  { id: uid(), nombre: "Mantilla de Lana", categoria: "monturas", precio: 65000, descripcion: "Absorbe el sudor y protege el lomo del caballo.", disponible: true, imagen: "", variantes: "" },
  { id: uid(), nombre: "Ruana de Jinete", categoria: "ropa", precio: 175000, descripcion: "Ruana tradicional en lana virgen, ideal para trote matinal.", disponible: true, imagen: "", variantes: "Talla: S, M, L, XL" },
  { id: uid(), nombre: "Botas de Montar en Cuero", categoria: "ropa", precio: 220000, descripcion: "Bota alta clásica, suela antideslizante.", disponible: true, imagen: "", variantes: "Talla: 38-44" },
  { id: uid(), nombre: "Sombrero Aguadeño", categoria: "ropa", precio: 98000, descripcion: "Sombrero tradicional tejido a mano.", disponible: true, imagen: "", variantes: "" },
  { id: uid(), nombre: "Shampoo Brillo y Cuerpo", categoria: "cuidado", precio: 34000, descripcion: "Limpia y da brillo sin resecar la piel.", disponible: true, imagen: "", variantes: "" },
  { id: uid(), nombre: "Cepillo de Cerdas Naturales", categoria: "cuidado", precio: 22000, descripcion: "Ideal para el cepillado diario y la circulación de la piel.", disponible: true, imagen: "", variantes: "" },
  { id: uid(), nombre: "Aceite para Casco", categoria: "cuidado", precio: 29000, descripcion: "Previene el resecamiento y las grietas del casco.", disponible: true, imagen: "", variantes: "" },
  { id: uid(), nombre: "Botiquín Básico Ecuestre", categoria: "otros", precio: 85000, descripcion: "Elementos esenciales de primeros auxilios para el caballo.", disponible: true, imagen: "", variantes: "" },
];

const DEFAULT_COMBOS = [
  { id: uid(), nombre: "Combo Básico", descripcion: "Lo esencial para el cuidado diario de tu caballo.", precio: 165000, precioOriginal: 195000, descuento: 15, productos: ["Concentrado Premium 40kg", "Cepillo de Cerdas Naturales", "Shampoo Brillo y Cuerpo"], imagen: "", activo: true },
  { id: uid(), nombre: "Combo para Trabajo", descripcion: "Pensado para el caballo de faena diaria en la finca.", precio: 265000, precioOriginal: 310000, descuento: 14, productos: ["Cabestro de Cuero Trenzado", "Cincha Acolchada", "Suplemento Mineral en Bloque"], imagen: "", activo: true },
  { id: uid(), nombre: "Combo de Lujo", descripcion: "Presentación impecable para exposición y desfile.", precio: 980000, precioOriginal: 1150000, descuento: 15, productos: ["Montura Colombiana Clásica", "Mantilla de Lana", "Riendas de Cuero con Costura Doble", "Vitaminas para Casco y Pelaje"], imagen: "", activo: true },
  { id: uid(), nombre: "Combo para Competencia", descripcion: "Todo lo necesario para llegar listo a la pista.", precio: 410000, precioOriginal: 470000, descuento: 13, productos: ["Riendas de Cuero con Costura Doble", "Vitaminas para Casco y Pelaje", "Aceite para Casco"], imagen: "", activo: true },
  { id: uid(), nombre: "Combo de Cuidado", descripcion: "Rutina completa de aseo y bienestar.", precio: 78000, precioOriginal: 92000, descuento: 15, productos: ["Shampoo Brillo y Cuerpo", "Cepillo de Cerdas Naturales", "Aceite para Casco"], imagen: "", activo: true },
  { id: uid(), nombre: "Combo para Potro", descripcion: "Un buen comienzo para los más jóvenes de la manada.", precio: 145000, precioOriginal: 170000, descuento: 15, productos: ["Suplemento Mineral en Bloque", "Cabestro de Cuero Trenzado", "Vitaminas para Casco y Pelaje"], imagen: "", activo: true },
  { id: uid(), nombre: "Combo Personalizado", descripcion: "Cuéntanos qué necesita tu caballo y lo armamos por WhatsApp.", precio: 0, precioOriginal: 0, descuento: 0, productos: ["A definir contigo"], imagen: "", activo: true },
];

/* ---------------------------- Íconos y marca ---------------------------- */

// Herradura dibujada a mano — la marca recurrente de la tienda: divide
// secciones, decora el logo y sirve de "viñeta" en vez de números genéricos.
function Herradura({ size = 22, color = "var(--oro)", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={style}>
      <path
        d="M50 8
          C74 8 88 28 88 52
          C88 68 80 80 68 88
          L68 62
          C68 48 60 40 50 40
          C40 40 32 48 32 62
          L32 88
          C20 80 12 68 12 52
          C12 28 26 8 50 8 Z"
        fill={color}
      />
      <circle cx="30" cy="70" r="4" fill="var(--negro)" />
      <circle cx="30" cy="84" r="4" fill="var(--negro)" />
      <circle cx="70" cy="70" r="4" fill="var(--negro)" />
      <circle cx="70" cy="84" r="4" fill="var(--negro)" />
    </svg>
  );
}

// Etiqueta estilo "hierro de marcar" — se usa para nombrar categorías y
// pasos, coherente con el mundo de la finca (en vez de "01 / 02 / 03").
function MarcaTag({ children }) {
  return <span className="marca-tag">{children}</span>;
}

function CategoriaIcono({ nombre, size = 20, color = "currentColor" }) {
  const Ico = ICONS[nombre] || Package;
  return <Ico size={size} color={color} />;
}

/* ---------------------------- Imagen con respaldo ---------------------------- */

function FotoProducto({ src, alt, className }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className={`foto-respaldo ${className || ""}`}>
        <Herradura size={34} color="var(--oro-suave)" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}

/* ---------------------------- App principal ---------------------------- */

export default function App() {
  const [cargando, setCargando] = useState(true);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [categorias] = useState(DEFAULT_CATEGORIES);
  const [productos, setProductos] = useState(DEFAULT_PRODUCTS);
  const [combos, setCombos] = useState(DEFAULT_COMBOS);
  const [carrito, setCarrito] = useState([]); // [{tipo:'producto'|'combo', id, cantidad}]

  const [vista, setVista] = useState("inicio");
  const [vistaParam, setVistaParam] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [adminAutenticado, setAdminAutenticado] = useState(false);
  const [avisoCarrito, setAvisoCarrito] = useState("");

  // Cargar datos guardados (o crear los valores por defecto la primera vez)
  useEffect(() => {
    (async () => {
      const [c, p, cb, cart] = await Promise.all([
        storageGet("store-config"),
        storageGet("store-products"),
        storageGet("store-combos"),
        storageGet("store-cart"),
      ]);
      if (c) setConfig(c); else await storageSet("store-config", DEFAULT_CONFIG);
      if (p) setProductos(p); else await storageSet("store-products", DEFAULT_PRODUCTS);
      if (cb) setCombos(cb); else await storageSet("store-combos", DEFAULT_COMBOS);
      if (cart) setCarrito(cart);
      setCargando(false);
    })();
  }, []);

  // Inyectar tipografías (Fraunces para títulos, Work Sans para texto,
  // JetBrains Mono para precios / etiquetas tipo ficha de inventario)
  useEffect(() => {
    if (document.getElementById("finca-fonts")) return;
    const link = document.createElement("link");
    link.id = "finca-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,500&family=Work+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap";
    document.head.appendChild(link);
  }, []);

  const irA = (v, param = null) => {
    setVista(v);
    setVistaParam(param);
    setMenuAbierto(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const guardarProductos = async (nuevos) => {
    setProductos(nuevos);
    await storageSet("store-products", nuevos);
  };
  const guardarCombos = async (nuevos) => {
    setCombos(nuevos);
    await storageSet("store-combos", nuevos);
  };
  const guardarConfig = async (nuevo) => {
    setConfig(nuevo);
    await storageSet("store-config", nuevo);
  };
  const guardarCarrito = async (nuevo) => {
    setCarrito(nuevo);
    await storageSet("store-cart", nuevo);
  };

  const mostrarAviso = (msg) => {
    setAvisoCarrito(msg);
    setTimeout(() => setAvisoCarrito(""), 2200);
  };

  const agregarAlCarrito = (tipo, id, nombre) => {
    const existente = carrito.find((i) => i.tipo === tipo && i.id === id);
    let nuevo;
    if (existente) {
      nuevo = carrito.map((i) =>
        i.tipo === tipo && i.id === id ? { ...i, cantidad: i.cantidad + 1 } : i
      );
    } else {
      nuevo = [...carrito, { tipo, id, cantidad: 1 }];
    }
    guardarCarrito(nuevo);
    mostrarAviso(`${nombre} — agregado al carrito`);
  };

  const cambiarCantidad = (tipo, id, delta) => {
    let nuevo = carrito
      .map((i) => (i.tipo === tipo && i.id === id ? { ...i, cantidad: i.cantidad + delta } : i))
      .filter((i) => i.cantidad > 0);
    guardarCarrito(nuevo);
  };

  const quitarDelCarrito = (tipo, id) => {
    guardarCarrito(carrito.filter((i) => !(i.tipo === tipo && i.id === id)));
  };

  const resolverItem = (item) => {
    const fuente = item.tipo === "producto" ? productos : combos;
    const base = fuente.find((x) => x.id === item.id);
    if (!base) return null;
    return { ...base, tipo: item.tipo, cantidad: item.cantidad };
  };

  const itemsCarrito = useMemo(
    () => carrito.map(resolverItem).filter(Boolean),
    [carrito, productos, combos]
  );
  const totalCarrito = useMemo(
    () => itemsCarrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0),
    [itemsCarrito]
  );
  const cantidadCarrito = useMemo(
    () => carrito.reduce((sum, i) => sum + i.cantidad, 0),
    [carrito]
  );

  const linkWhatsApp = (items, total, mensajeExtra = "") => {
    let texto = "Hola, estoy interesado en realizar una compra.\n\nProductos:\n";
    items.forEach((i) => {
      texto += `- ${i.nombre} x${i.cantidad}\n`;
    });
    texto += `\nTotal: ${formatCOP(total)}\n\n`;
    texto += mensajeExtra || "Quisiera recibir información sobre disponibilidad, envío y formas de pago.";
    return `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(texto)}`;
  };

  const comprarUnPorWhatsApp = (item) => {
    const url = linkWhatsApp([{ nombre: item.nombre, cantidad: 1 }], item.precio);
    window.open(url, "_blank");
  };

  const comprarCarritoPorWhatsApp = () => {
    if (itemsCarrito.length === 0) return;
    const url = linkWhatsApp(itemsCarrito, totalCarrito);
    window.open(url, "_blank");
  };

  if (cargando) {
    return (
      <div className="pantalla-carga">
        <Herradura size={44} />
        <p>Cargando la tienda…</p>
        <EstiloGlobal />
      </div>
    );
  }

  return (
    <div className="app-tienda">
      <EstiloGlobal />

      <Encabezado
        config={config}
        categorias={categorias}
        vista={vista}
        irA={irA}
        menuAbierto={menuAbierto}
        setMenuAbierto={setMenuAbierto}
        cantidadCarrito={cantidadCarrito}
        setCarritoAbierto={setCarritoAbierto}
      />

      {avisoCarrito && <div className="aviso-flotante"><Check size={16} /> {avisoCarrito}</div>}

      <main>
        {vista === "inicio" && (
          <VistaInicio
            config={config}
            categorias={categorias}
            combos={combos.filter((c) => c.activo)}
            irA={irA}
            agregarAlCarrito={agregarAlCarrito}
            comprarUnPorWhatsApp={comprarUnPorWhatsApp}
          />
        )}

        {vista === "combos" && (
          <VistaCombos
            combos={combos.filter((c) => c.activo)}
            agregarAlCarrito={agregarAlCarrito}
            comprarUnPorWhatsApp={comprarUnPorWhatsApp}
          />
        )}

        {vista === "categoria" && (
          <VistaCategoria
            categoria={categorias.find((c) => c.id === vistaParam)}
            productos={productos.filter((p) => p.categoria === vistaParam && p.disponible)}
            agregarAlCarrito={agregarAlCarrito}
            comprarUnPorWhatsApp={comprarUnPorWhatsApp}
          />
        )}

        {vista === "nosotros" && <VistaNosotros config={config} />}

        {vista === "contacto" && <VistaContacto config={config} linkWhatsApp={() => linkWhatsApp([], 0, "Hola, quisiera más información sobre sus productos.")} />}

        {vista === "admin" && (
          <VistaAdmin
            autenticado={adminAutenticado}
            setAutenticado={setAdminAutenticado}
            config={config}
            guardarConfig={guardarConfig}
            categorias={categorias}
            productos={productos}
            guardarProductos={guardarProductos}
            combos={combos}
            guardarCombos={guardarCombos}
          />
        )}
      </main>

      <PiePagina config={config} irA={irA} />

      {carritoAbierto && (
        <CarritoLateral
          items={itemsCarrito}
          total={totalCarrito}
          onCerrar={() => setCarritoAbierto(false)}
          cambiarCantidad={cambiarCantidad}
          quitarDelCarrito={quitarDelCarrito}
          comprarPorWhatsApp={comprarCarritoPorWhatsApp}
          irA={irA}
        />
      )}

      {/* Botón flotante de WhatsApp, siempre visible como pide la especificación */}
      <a
        className="whatsapp-flotante"
        href={linkWhatsApp([], 0, "Hola, quisiera más información sobre sus productos.")}
        target="_blank"
        rel="noreferrer"
        aria-label="Escribir por WhatsApp"
      >
        <MessageCircle size={26} />
      </a>
    </div>
  );
}

/* ---------------------------- Encabezado / navegación ---------------------------- */

function Encabezado({ config, categorias, vista, irA, menuAbierto, setMenuAbierto, cantidadCarrito, setCarritoAbierto }) {
  const enlaces = [
    { id: "inicio", label: "Inicio" },
    { id: "combos", label: "Combos" },
    ...categorias.map((c) => ({ id: "categoria:" + c.id, label: c.nombre })),
    { id: "nosotros", label: "Nosotros" },
    { id: "contacto", label: "Contacto" },
  ];

  const clicEnlace = (id) => {
    if (id.startsWith("categoria:")) irA("categoria", id.split(":")[1]);
    else irA(id);
  };

  return (
    <header className="encabezado">
      <div className="encabezado-fila">
        <button className="marca" onClick={() => irA("inicio")}>
          <Herradura size={30} />
          <span className="marca-texto">
            <strong>{config.nombreTienda}</strong>
            <em>Caballo Criollo Colombiano</em>
          </span>
        </button>

        <nav className="nav-escritorio">
          {enlaces.map((e) => (
            <button key={e.id} onClick={() => clicEnlace(e.id)} className="nav-link">
              {e.label}
            </button>
          ))}
        </nav>

        <div className="encabezado-acciones">
          <button className="boton-admin" onClick={() => irA("admin")} title="Panel administrativo">
            <Lock size={18} />
          </button>
          <button className="boton-carrito" onClick={() => setCarritoAbierto(true)}>
            <ShoppingCart size={20} />
            {cantidadCarrito > 0 && <span className="carrito-contador">{cantidadCarrito}</span>}
          </button>
          <button className="boton-menu" onClick={() => setMenuAbierto(!menuAbierto)}>
            {menuAbierto ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {menuAbierto && (
        <nav className="nav-movil">
          {enlaces.map((e) => (
            <button key={e.id} onClick={() => clicEnlace(e.id)}>
              {e.label}
              <ChevronRight size={16} />
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}

/* ---------------------------- Vista: Inicio ---------------------------- */

function VistaInicio({ config, categorias, combos, irA, agregarAlCarrito, comprarUnPorWhatsApp }) {
  return (
    <>
      <section className="hero">
        <div className="hero-contenido">
          <span className="hero-eyebrow"><Herradura size={16} /> Desde la sabana hasta tu finca</span>
          <h1>{config.eslogan}</h1>
          <p className="hero-sub">
            Alimento, aperos, monturas, ropa de jinete y cuidado, elegidos por caballistas
            para el Caballo de Paso Fino Colombiano.
          </p>
          <div className="hero-botones">
            <button className="boton boton-oro" onClick={() => irA("combos")}>Comprar ahora</button>
            <button className="boton boton-linea" onClick={() => document.getElementById("categorias-inicio")?.scrollIntoView({ behavior: "smooth" })}>
              Ver productos
            </button>
          </div>
        </div>
        <div className="hero-divisor">
          <Herradura size={20} />
        </div>
      </section>

      <section className="seccion">
        <SeccionTitulo eyebrow="Selección de la casa" titulo="Combos para tu caballo" />
        <div className="grid-combos">
          {combos.slice(0, 4).map((c) => (
            <TarjetaCombo
              key={c.id}
              combo={c}
              agregarAlCarrito={agregarAlCarrito}
              comprarUnPorWhatsApp={comprarUnPorWhatsApp}
            />
          ))}
        </div>
        <div className="centrado">
          <button className="boton boton-linea" onClick={() => irA("combos")}>Ver todos los combos</button>
        </div>
      </section>

      <section className="seccion fondo-oscuro" id="categorias-inicio">
        <SeccionTitulo
          eyebrow="Explora"
          titulo="Categorías"
          clara
        />
        <div className="grid-categorias">
          {categorias.map((c) => (
            <button key={c.id} className="tarjeta-categoria" onClick={() => irA("categoria", c.id)}>
              <CategoriaIcono nombre={c.icono} size={28} color="var(--oro)" />
              <span>{c.nombre}</span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function SeccionTitulo({ eyebrow, titulo, clara }) {
  return (
    <div className={`seccion-titulo ${clara ? "clara" : ""}`}>
      <MarcaTag>{eyebrow}</MarcaTag>
      <h2>{titulo}</h2>
    </div>
  );
}

/* ---------------------------- Vista: Combos ---------------------------- */

function VistaCombos({ combos, agregarAlCarrito, comprarUnPorWhatsApp }) {
  return (
    <section className="seccion">
      <SeccionTitulo eyebrow="Combos" titulo="Combos para tu caballo" />
      <div className="grid-combos">
        {combos.map((c) => (
          <TarjetaCombo key={c.id} combo={c} agregarAlCarrito={agregarAlCarrito} comprarUnPorWhatsApp={comprarUnPorWhatsApp} />
        ))}
      </div>
      {combos.length === 0 && <VacioAviso texto="Todavía no hay combos publicados." />}
    </section>
  );
}

function TarjetaCombo({ combo, agregarAlCarrito, comprarUnPorWhatsApp }) {
  return (
    <article className="tarjeta-combo">
      <FotoProducto src={combo.imagen} alt={combo.nombre} className="tarjeta-combo-foto" />
      {combo.descuento > 0 && <span className="etiqueta-descuento">-{combo.descuento}%</span>}
      <div className="tarjeta-combo-cuerpo">
        <h3>{combo.nombre}</h3>
        <p className="tarjeta-descripcion">{combo.descripcion}</p>
        <ul className="lista-incluye">
          {combo.productos.slice(0, 4).map((p, i) => (
            <li key={i}><Check size={13} /> {p}</li>
          ))}
        </ul>
        <div className="tarjeta-precios">
          {combo.precio > 0 ? (
            <>
              <span className="precio">{formatCOP(combo.precio)}</span>
              {combo.precioOriginal > combo.precio && (
                <span className="precio-tachado">{formatCOP(combo.precioOriginal)}</span>
              )}
            </>
          ) : (
            <span className="precio">Cotiza por WhatsApp</span>
          )}
        </div>
        <div className="tarjeta-botones">
          {combo.precio > 0 && (
            <button className="boton boton-oro boton-pequeno" onClick={() => agregarAlCarrito("combo", combo.id, combo.nombre)}>
              <ShoppingCart size={15} /> Agregar
            </button>
          )}
          <button className="boton boton-whatsapp boton-pequeno" onClick={() => comprarUnPorWhatsApp(combo)}>
            <MessageCircle size={15} /> Comprar por WhatsApp
          </button>
        </div>
      </div>
    </article>
  );
}

/* ---------------------------- Vista: Categoría ---------------------------- */

function VistaCategoria({ categoria, productos, agregarAlCarrito, comprarUnPorWhatsApp }) {
  if (!categoria) return <VacioAviso texto="Categoría no encontrada." />;
  return (
    <section className="seccion">
      <SeccionTitulo eyebrow="Categoría" titulo={categoria.nombre} />
      <div className="grid-productos">
        {productos.map((p) => (
          <TarjetaProducto key={p.id} producto={p} agregarAlCarrito={agregarAlCarrito} comprarUnPorWhatsApp={comprarUnPorWhatsApp} />
        ))}
      </div>
      {productos.length === 0 && <VacioAviso texto="Aún no hay productos disponibles en esta categoría." />}
    </section>
  );
}

function TarjetaProducto({ producto, agregarAlCarrito, comprarUnPorWhatsApp }) {
  return (
    <article className="tarjeta-producto">
      <FotoProducto src={producto.imagen} alt={producto.nombre} className="tarjeta-producto-foto" />
      <div className="tarjeta-producto-cuerpo">
        <h4>{producto.nombre}</h4>
        <p className="tarjeta-descripcion">{producto.descripcion}</p>
        {producto.variantes && <p className="tarjeta-variantes">{producto.variantes}</p>}
        <div className="tarjeta-precios">
          <span className="precio">{formatCOP(producto.precio)}</span>
        </div>
        <div className="tarjeta-botones">
          <button className="boton boton-oro boton-pequeno" onClick={() => agregarAlCarrito("producto", producto.id, producto.nombre)}>
            <ShoppingCart size={15} /> Agregar
          </button>
          <button className="boton boton-whatsapp boton-pequeno" onClick={() => comprarUnPorWhatsApp(producto)}>
            <MessageCircle size={15} /> WhatsApp
          </button>
        </div>
      </div>
    </article>
  );
}

function VacioAviso({ texto }) {
  return (
    <div className="vacio-aviso">
      <AlertCircle size={20} />
      <p>{texto}</p>
    </div>
  );
}

/* ---------------------------- Vista: Nosotros ---------------------------- */

function VistaNosotros({ config }) {
  return (
    <section className="seccion seccion-angosta">
      <SeccionTitulo eyebrow="Nuestra historia" titulo="Nosotros" />
      <p className="texto-largo">{config.nosotrosTexto}</p>
      <div className="grid-valores">
        <div className="valor"><Herradura size={22} /><h4>Tradición</h4><p>Productos con raíces en la talabartería y la ganadería colombiana.</p></div>
        <div className="valor"><Herradura size={22} /><h4>Calidad</h4><p>Cada producto pasa primero por nuestra propia finca.</p></div>
        <div className="valor"><Herradura size={22} /><h4>Compromiso</h4><p>Acompañamos al caballista antes, durante y después de la compra.</p></div>
      </div>
    </section>
  );
}

/* ---------------------------- Vista: Contacto ---------------------------- */

function VistaContacto({ config, linkWhatsApp }) {
  return (
    <section className="seccion seccion-angosta">
      <SeccionTitulo eyebrow="Hablemos" titulo="Contacto" />
      <div className="grid-contacto">
        <div className="dato-contacto"><Phone size={20} /><div><strong>Teléfono</strong><p>{config.telefono}</p></div></div>
        <div className="dato-contacto"><MapPin size={20} /><div><strong>Ubicación</strong><p>{config.direccion}</p></div></div>
        <div className="dato-contacto"><Mail size={20} /><div><strong>Correo</strong><p>{config.email}</p></div></div>
        <div className="dato-contacto"><Clock size={20} /><div><strong>Horario</strong><p>{config.horario}</p></div></div>
        <div className="dato-contacto"><Instagram size={20} /><div><strong>Instagram</strong><p>{config.instagram}</p></div></div>
        <div className="dato-contacto"><Facebook size={20} /><div><strong>Facebook</strong><p>{config.facebook}</p></div></div>
      </div>
      <div className="centrado" style={{ marginTop: 28 }}>
        <a className="boton boton-whatsapp" href={linkWhatsApp()} target="_blank" rel="noreferrer">
          <MessageCircle size={18} /> Escríbenos por WhatsApp
        </a>
      </div>
    </section>
  );
}

/* ---------------------------- Carrito lateral ---------------------------- */

function CarritoLateral({ items, total, onCerrar, cambiarCantidad, quitarDelCarrito, comprarPorWhatsApp, irA }) {
  return (
    <div className="carrito-overlay" onClick={onCerrar}>
      <aside className="carrito-panel" onClick={(e) => e.stopPropagation()}>
        <div className="carrito-encabezado">
          <h3><ShoppingCart size={18} /> Tu carrito</h3>
          <button onClick={onCerrar}><X size={22} /></button>
        </div>

        <div className="carrito-items">
          {items.length === 0 && <VacioAviso texto="Tu carrito está vacío por ahora." />}
          {items.map((item) => (
            <div className="carrito-item" key={item.tipo + item.id}>
              <FotoProducto src={item.imagen} alt={item.nombre} className="carrito-item-foto" />
              <div className="carrito-item-info">
                <strong>{item.nombre}</strong>
                <span className="precio-chico">{formatCOP(item.precio)}</span>
                <div className="stepper">
                  <button onClick={() => cambiarCantidad(item.tipo, item.id, -1)}><Minus size={13} /></button>
                  <span>{item.cantidad}</span>
                  <button onClick={() => cambiarCantidad(item.tipo, item.id, 1)}><Plus size={13} /></button>
                </div>
              </div>
              <button className="boton-quitar" onClick={() => quitarDelCarrito(item.tipo, item.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="carrito-resumen">
          <div className="carrito-total-fila">
            <span>Subtotal</span>
            <span>{formatCOP(total)}</span>
          </div>
          <div className="carrito-total-fila carrito-total-grande">
            <span>Total</span>
            <span>{formatCOP(total)}</span>
          </div>
          <button className="boton boton-whatsapp ancho" disabled={items.length === 0} onClick={comprarPorWhatsApp}>
            <MessageCircle size={18} /> Comprar por WhatsApp
          </button>
          <button className="boton boton-linea ancho" onClick={() => { onCerrar(); irA("combos"); }}>
            Seguir comprando
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ---------------------------- Pie de página ---------------------------- */

function PiePagina({ config, irA }) {
  return (
    <footer className="pie">
      <div className="pie-columna">
        <div className="marca-pie"><Herradura size={26} /><strong>{config.nombreTienda}</strong></div>
        <p>{config.eslogan}</p>
      </div>
      <div className="pie-columna">
        <h5>Tienda</h5>
        <button onClick={() => irA("combos")}>Combos</button>
        <button onClick={() => irA("nosotros")}>Nosotros</button>
        <button onClick={() => irA("contacto")}>Contacto</button>
      </div>
      <div className="pie-columna">
        <h5>Contacto</h5>
        <p>{config.telefono}</p>
        <p>{config.email}</p>
        <p>{config.direccion}</p>
      </div>
      <div className="pie-linea">© {new Date().getFullYear()} {config.nombreTienda} — Hecho con orgullo por caballistas colombianos.</div>
    </footer>
  );
}

/* ---------------------------- Panel administrativo ---------------------------- */

function VistaAdmin({ autenticado, setAutenticado, config, guardarConfig, categorias, productos, guardarProductos, combos, guardarCombos }) {
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [pestaña, setPestaña] = useState("productos");

  const entrar = (e) => {
    e.preventDefault();
    if (clave === config.adminPassword) {
      setAutenticado(true);
      setError("");
    } else {
      setError("Contraseña incorrecta.");
    }
  };

  if (!autenticado) {
    return (
      <section className="seccion seccion-angosta">
        <SeccionTitulo eyebrow="Acceso restringido" titulo="Panel administrativo" />
        <form className="form-login" onSubmit={entrar}>
          <label>Contraseña</label>
          <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} placeholder="••••••••" />
          {error && <p className="texto-error">{error}</p>}
          <button className="boton boton-oro ancho" type="submit"><Lock size={16} /> Entrar</button>
          <p className="nota-admin">
            Nota para Esteban: esta es una protección básica (solo compara una contraseña guardada),
            no un sistema de autenticación real. Cuando conectes una base de datos, reemplaza esto
            por un login de verdad.
          </p>
        </form>
      </section>
    );
  }

  return (
    <section className="seccion">
      <div className="admin-encabezado">
        <SeccionTitulo eyebrow="Panel administrativo" titulo={`Hola, administra ${config.nombreTienda}`} />
        <button className="boton boton-linea boton-pequeno" onClick={() => setAutenticado(false)}>
          <LogOut size={15} /> Salir
        </button>
      </div>

      <div className="admin-tabs">
        {[
          ["productos", "Productos"],
          ["combos", "Combos"],
          ["config", "Configuración"],
        ].map(([id, label]) => (
          <button key={id} className={pestaña === id ? "activo" : ""} onClick={() => setPestaña(id)}>
            {label}
          </button>
        ))}
      </div>

      {pestaña === "productos" && (
        <AdminProductos categorias={categorias} productos={productos} guardarProductos={guardarProductos} />
      )}
      {pestaña === "combos" && (
        <AdminCombos combos={combos} guardarCombos={guardarCombos} />
      )}
      {pestaña === "config" && (
        <AdminConfig config={config} guardarConfig={guardarConfig} />
      )}
    </section>
  );
}

function vacioProducto(categoriaDefault) {
  return { id: null, nombre: "", categoria: categoriaDefault || "alimentacion", precio: "", descripcion: "", disponible: true, imagen: "", variantes: "" };
}

function AdminProductos({ categorias, productos, guardarProductos }) {
  const [editando, setEditando] = useState(null); // producto en edición o null

  const guardar = (prod) => {
    let nuevos;
    if (prod.id) {
      nuevos = productos.map((p) => (p.id === prod.id ? prod : p));
    } else {
      nuevos = [...productos, { ...prod, id: uid() }];
    }
    guardarProductos(nuevos);
    setEditando(null);
  };

  const eliminar = (id) => {
    guardarProductos(productos.filter((p) => p.id !== id));
  };

  const alternarDisponible = (id) => {
    guardarProductos(productos.map((p) => (p.id === id ? { ...p, disponible: !p.disponible } : p)));
  };

  if (editando) {
    return <FormularioProducto categorias={categorias} producto={editando} onGuardar={guardar} onCancelar={() => setEditando(null)} />;
  }

  return (
    <div>
      <button className="boton boton-oro boton-pequeno" onClick={() => setEditando(vacioProducto())}>
        <PlusCircle size={16} /> Nuevo producto
      </button>
      <div className="admin-tabla">
        {productos.map((p) => (
          <div key={p.id} className="admin-fila">
            <FotoProducto src={p.imagen} alt={p.nombre} className="admin-fila-foto" />
            <div className="admin-fila-info">
              <strong>{p.nombre}</strong>
              <span>{categorias.find((c) => c.id === p.categoria)?.nombre || p.categoria} · {formatCOP(p.precio)}</span>
            </div>
            <label className="switch">
              <input type="checkbox" checked={p.disponible} onChange={() => alternarDisponible(p.id)} />
              <span>{p.disponible ? "Activo" : "Oculto"}</span>
            </label>
            <button className="boton-icono" onClick={() => setEditando(p)}><Edit2 size={16} /></button>
            <button className="boton-icono peligro" onClick={() => eliminar(p.id)}><Trash2 size={16} /></button>
          </div>
        ))}
        {productos.length === 0 && <VacioAviso texto="No hay productos todavía." />}
      </div>
    </div>
  );
}

function FormularioProducto({ categorias, producto, onGuardar, onCancelar }) {
  const [f, setF] = useState(producto);
  const cambiar = (campo, valor) => setF({ ...f, [campo]: valor });

  return (
    <form
      className="form-admin"
      onSubmit={(e) => {
        e.preventDefault();
        onGuardar({ ...f, precio: Number(f.precio) || 0 });
      }}
    >
      <label>Nombre<input value={f.nombre} onChange={(e) => cambiar("nombre", e.target.value)} required /></label>
      <label>Categoría
        <select value={f.categoria} onChange={(e) => cambiar("categoria", e.target.value)}>
          {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </label>
      <label>Precio (COP)<input type="number" value={f.precio} onChange={(e) => cambiar("precio", e.target.value)} required /></label>
      <label>Descripción<textarea value={f.descripcion} onChange={(e) => cambiar("descripcion", e.target.value)} /></label>
      <label>Variantes (opcional, ej: Talla: S, M, L)<input value={f.variantes} onChange={(e) => cambiar("variantes", e.target.value)} /></label>
      <label>URL de la foto (opcional)<input value={f.imagen} onChange={(e) => cambiar("imagen", e.target.value)} placeholder="https://…" /></label>
      <label className="fila-check"><input type="checkbox" checked={f.disponible} onChange={(e) => cambiar("disponible", e.target.checked)} /> Disponible en la tienda</label>
      <div className="form-botones">
        <button type="submit" className="boton boton-oro"><Save size={16} /> Guardar</button>
        <button type="button" className="boton boton-linea" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}

function vacioCombo() {
  return { id: null, nombre: "", descripcion: "", precio: "", precioOriginal: "", descuento: 0, productos: "", imagen: "", activo: true };
}

function AdminCombos({ combos, guardarCombos }) {
  const [editando, setEditando] = useState(null);

  const guardar = (combo) => {
    const productosArray = combo.productos.split(",").map((s) => s.trim()).filter(Boolean);
    const limpio = { ...combo, productos: productosArray, precio: Number(combo.precio) || 0, precioOriginal: Number(combo.precioOriginal) || 0, descuento: Number(combo.descuento) || 0 };
    let nuevos;
    if (limpio.id) nuevos = combos.map((c) => (c.id === limpio.id ? limpio : c));
    else nuevos = [...combos, { ...limpio, id: uid() }];
    guardarCombos(nuevos);
    setEditando(null);
  };

  const eliminar = (id) => guardarCombos(combos.filter((c) => c.id !== id));
  const alternarActivo = (id) => guardarCombos(combos.map((c) => (c.id === id ? { ...c, activo: !c.activo } : c)));

  if (editando) {
    const paraEditar = editando.id
      ? { ...editando, productos: editando.productos.join(", ") }
      : editando;
    return <FormularioCombo combo={paraEditar} onGuardar={guardar} onCancelar={() => setEditando(null)} />;
  }

  return (
    <div>
      <button className="boton boton-oro boton-pequeno" onClick={() => setEditando(vacioCombo())}>
        <PlusCircle size={16} /> Nuevo combo
      </button>
      <div className="admin-tabla">
        {combos.map((c) => (
          <div key={c.id} className="admin-fila">
            <FotoProducto src={c.imagen} alt={c.nombre} className="admin-fila-foto" />
            <div className="admin-fila-info">
              <strong>{c.nombre}</strong>
              <span>{formatCOP(c.precio)} {c.descuento > 0 && `· -${c.descuento}%`}</span>
            </div>
            <label className="switch">
              <input type="checkbox" checked={c.activo} onChange={() => alternarActivo(c.id)} />
              <span>{c.activo ? "Publicado" : "Oculto"}</span>
            </label>
            <button className="boton-icono" onClick={() => setEditando(c)}><Edit2 size={16} /></button>
            <button className="boton-icono peligro" onClick={() => eliminar(c.id)}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormularioCombo({ combo, onGuardar, onCancelar }) {
  const [f, setF] = useState(combo);
  const cambiar = (campo, valor) => setF({ ...f, [campo]: valor });

  return (
    <form className="form-admin" onSubmit={(e) => { e.preventDefault(); onGuardar(f); }}>
      <label>Nombre<input value={f.nombre} onChange={(e) => cambiar("nombre", e.target.value)} required /></label>
      <label>Descripción<textarea value={f.descripcion} onChange={(e) => cambiar("descripcion", e.target.value)} /></label>
      <label>Precio final (COP)<input type="number" value={f.precio} onChange={(e) => cambiar("precio", e.target.value)} /></label>
      <label>Precio original (opcional, para mostrar el descuento)<input type="number" value={f.precioOriginal} onChange={(e) => cambiar("precioOriginal", e.target.value)} /></label>
      <label>Descuento % (opcional, solo referencia visual)<input type="number" value={f.descuento} onChange={(e) => cambiar("descuento", e.target.value)} /></label>
      <label>Productos incluidos (separados por coma)<input value={f.productos} onChange={(e) => cambiar("productos", e.target.value)} placeholder="Concentrado, Cepillo, Shampoo" /></label>
      <label>URL de la foto (opcional)<input value={f.imagen} onChange={(e) => cambiar("imagen", e.target.value)} placeholder="https://…" /></label>
      <label className="fila-check"><input type="checkbox" checked={f.activo} onChange={(e) => cambiar("activo", e.target.checked)} /> Publicado en la tienda</label>
      <div className="form-botones">
        <button type="submit" className="boton boton-oro"><Save size={16} /> Guardar</button>
        <button type="button" className="boton boton-linea" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}

function AdminConfig({ config, guardarConfig }) {
  const [f, setF] = useState(config);
  const [guardado, setGuardado] = useState(false);
  const cambiar = (campo, valor) => setF({ ...f, [campo]: valor });

  return (
    <form
      className="form-admin"
      onSubmit={(e) => {
        e.preventDefault();
        guardarConfig(f);
        setGuardado(true);
        setTimeout(() => setGuardado(false), 2000);
      }}
    >
      <label>Nombre de la tienda<input value={f.nombreTienda} onChange={(e) => cambiar("nombreTienda", e.target.value)} /></label>
      <label>Eslogan<input value={f.eslogan} onChange={(e) => cambiar("eslogan", e.target.value)} /></label>
      <label>
        Número de WhatsApp (solo números, con código de país, ej: 573001234567)
        <input value={f.whatsappNumber} onChange={(e) => cambiar("whatsappNumber", e.target.value)} />
      </label>
      <label>Teléfono visible<input value={f.telefono} onChange={(e) => cambiar("telefono", e.target.value)} /></label>
      <label>Correo<input value={f.email} onChange={(e) => cambiar("email", e.target.value)} /></label>
      <label>Dirección<input value={f.direccion} onChange={(e) => cambiar("direccion", e.target.value)} /></label>
      <label>Horario<input value={f.horario} onChange={(e) => cambiar("horario", e.target.value)} /></label>
      <label>Instagram<input value={f.instagram} onChange={(e) => cambiar("instagram", e.target.value)} /></label>
      <label>Facebook<input value={f.facebook} onChange={(e) => cambiar("facebook", e.target.value)} /></label>
      <label>Texto de "Nosotros"<textarea rows={5} value={f.nosotrosTexto} onChange={(e) => cambiar("nosotrosTexto", e.target.value)} /></label>
      <label>Contraseña del panel admin<input value={f.adminPassword} onChange={(e) => cambiar("adminPassword", e.target.value)} /></label>
      <div className="form-botones">
        <button type="submit" className="boton boton-oro"><Save size={16} /> Guardar cambios</button>
        {guardado && <span className="texto-exito"><Check size={16} /> Guardado</span>}
      </div>
    </form>
  );
}

/* ---------------------------- Estilos ---------------------------- */

function EstiloGlobal() {
  return (
    <style>{`
      :root{
        --negro: #17130f;
        --cafe: #241b14;
        --cafe-claro: #3a2c1f;
        --beige: #ece3d2;
        --crema: #f6f1e6;
        --oro: #c9a24b;
        --oro-suave: #e0c988;
        --verde: #38452f;
        --rojo: #a6432f;
        --radio: 4px;
        font-family: 'Work Sans', sans-serif;
      }
      *{ box-sizing: border-box; }
      .app-tienda{
        background: var(--crema);
        color: var(--negro);
        min-height: 100vh;
        font-family: 'Work Sans', sans-serif;
        line-height: 1.5;
      }
      h1,h2,h3,h4,h5{ font-family: 'Fraunces', serif; font-weight: 600; margin: 0 0 0.4em; letter-spacing: -0.01em; }
      p{ margin: 0 0 0.8em; }
      button{ font-family: inherit; cursor: pointer; }
      input, select, textarea{ font-family: inherit; }
      a{ color: inherit; }

      .pantalla-carga{
        min-height: 100vh; display:flex; flex-direction:column; align-items:center; justify-content:center;
        gap: 14px; background: var(--negro); color: var(--oro-suave); font-family: 'Fraunces', serif;
      }

      /* ---- Marca / etiqueta tipo hierro ---- */
      .marca-tag{
        display:inline-flex; align-items:center; gap:6px;
        font-family:'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
        color: var(--oro); border: 1px solid var(--oro); border-radius: 2px; padding: 4px 10px;
      }

      /* ---- Encabezado ---- */
      .encabezado{ position: sticky; top:0; z-index: 40; background: var(--negro); border-bottom: 1px solid var(--cafe-claro); }
      .encabezado-fila{ max-width: 1180px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; padding: 12px 20px; gap: 16px; }
      .marca{ display:flex; align-items:center; gap:10px; background:none; border:none; color: var(--crema); padding:0; }
      .marca-texto{ display:flex; flex-direction:column; text-align:left; line-height:1.15; }
      .marca-texto strong{ font-family:'Fraunces', serif; font-size: 19px; color: var(--crema); }
      .marca-texto em{ font-style: normal; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--oro-suave); }
      .nav-escritorio{ display:none; gap: 4px; }
      .nav-link{ background:none; border:none; color: var(--beige); font-size: 14px; padding: 8px 10px; border-radius: var(--radio); }
      .nav-link:hover{ color: var(--oro-suave); }
      .encabezado-acciones{ display:flex; align-items:center; gap: 8px; }
      .boton-admin, .boton-carrito, .boton-menu{ background:none; border:1px solid var(--cafe-claro); color: var(--crema); border-radius: var(--radio); padding: 8px; position:relative; display:flex; }
      .boton-admin:hover, .boton-carrito:hover, .boton-menu:hover{ border-color: var(--oro); color: var(--oro-suave); }
      .carrito-contador{ position:absolute; top:-6px; right:-6px; background: var(--oro); color: var(--negro); font-size: 10px; font-weight:700; border-radius: 50%; width: 18px; height:18px; display:flex; align-items:center; justify-content:center; }
      .nav-movil{ display:flex; flex-direction:column; border-top: 1px solid var(--cafe-claro); background: var(--negro); }
      .nav-movil button{ display:flex; justify-content:space-between; align-items:center; background:none; border:none; border-bottom: 1px solid var(--cafe); color: var(--beige); padding: 14px 20px; font-size:15px; text-align:left; }

      @media (min-width: 900px){
        .nav-escritorio{ display:flex; }
        .boton-menu{ display:none; }
      }

      .aviso-flotante{
        position: fixed; top: 78px; left: 50%; transform: translateX(-50%); z-index: 60;
        background: var(--verde); color: var(--crema); padding: 10px 18px; border-radius: var(--radio);
        display:flex; align-items:center; gap:8px; font-size: 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      }

      /* ---- Hero ---- */
      .hero{
        background: radial-gradient(ellipse at 20% 20%, #2b2015 0%, var(--negro) 55%), var(--negro);
        color: var(--crema); padding: 90px 20px 40px; text-align:center; position:relative;
      }
      .hero-contenido{ max-width: 720px; margin: 0 auto; }
      .hero-eyebrow{ display:inline-flex; align-items:center; gap:8px; font-family:'JetBrains Mono', monospace; font-size:12px; letter-spacing:0.12em; text-transform:uppercase; color: var(--oro-suave); margin-bottom: 18px; }
      .hero h1{ font-size: clamp(30px, 5.4vw, 54px); color: var(--crema); margin-bottom: 18px; }
      .hero-sub{ font-size: 17px; color: var(--beige); max-width: 520px; margin: 0 auto 30px; }
      .hero-botones{ display:flex; gap: 14px; justify-content:center; flex-wrap:wrap; }
      .hero-divisor{ margin-top: 50px; display:flex; justify-content:center; opacity:0.8; }

      /* ---- Botones ---- */
      .boton{ display:inline-flex; align-items:center; gap:8px; padding: 13px 26px; border-radius: var(--radio); font-size: 14.5px; font-weight:600; border: 1px solid transparent; text-decoration:none; }
      .boton-oro{ background: var(--oro); color: var(--negro); }
      .boton-oro:hover{ background: var(--oro-suave); }
      .boton-linea{ background: transparent; border-color: currentColor; color: inherit; }
      .boton-whatsapp{ background: var(--verde); color: var(--crema); }
      .boton-whatsapp:hover{ background: #465538; }
      .boton-pequeno{ padding: 9px 14px; font-size: 13px; }
      .boton.ancho{ width:100%; justify-content:center; }
      .boton:disabled{ opacity: 0.5; cursor:not-allowed; }
      .centrado{ text-align:center; margin-top: 30px; }

      /* ---- Secciones ---- */
      .seccion{ max-width: 1180px; margin: 0 auto; padding: 64px 20px; }
      .seccion-angosta{ max-width: 820px; }
      .fondo-oscuro{ background: var(--negro); color: var(--crema); max-width: none; margin-top: 0; }
      .fondo-oscuro .seccion-titulo, .fondo-oscuro h2{ color: var(--crema); }
      .seccion-titulo{ margin-bottom: 32px; }
      .seccion-titulo h2{ font-size: 30px; margin-top: 10px; }
      .fondo-oscuro{ padding: 64px 20px; }

      /* ---- Grillas ---- */
      .grid-combos{ display:grid; grid-template-columns: 1fr; gap: 24px; }
      .grid-productos{ display:grid; grid-template-columns: repeat(2,1fr); gap: 20px; }
      .grid-categorias{ display:grid; grid-template-columns: 1fr; gap: 14px; max-width: 1180px; margin: 0 auto; }
      @media (min-width: 640px){ .grid-combos{ grid-template-columns: repeat(2,1fr); } .grid-categorias{ grid-template-columns: repeat(3,1fr); } }
      @media (min-width: 900px){ .grid-productos{ grid-template-columns: repeat(3,1fr); } .grid-combos{ grid-template-columns: repeat(4,1fr); } .grid-categorias{ grid-template-columns: repeat(6,1fr); } }

      .tarjeta-categoria{ display:flex; align-items:center; gap: 10px; background: var(--cafe); border: 1px solid var(--cafe-claro); color: var(--crema); padding: 16px; border-radius: var(--radio); text-align:left; }
      .tarjeta-categoria span{ flex:1; font-size: 14px; }
      .tarjeta-categoria:hover{ border-color: var(--oro); }

      /* ---- Tarjetas de producto / combo ---- */
      .tarjeta-combo, .tarjeta-producto{ background: white; border: 1px solid #e2d8c3; border-radius: var(--radio); overflow:hidden; display:flex; flex-direction:column; position:relative; }
      .tarjeta-combo-foto, .tarjeta-producto-foto, .foto-respaldo{ width:100%; aspect-ratio: 4/3; object-fit: cover; background: linear-gradient(135deg, var(--cafe) 0%, var(--negro) 100%); display:flex; align-items:center; justify-content:center; }
      .etiqueta-descuento{ position:absolute; top:10px; right:10px; background: var(--rojo); color:white; font-size: 11px; font-weight:700; padding: 4px 8px; border-radius: 2px; }
      .tarjeta-combo-cuerpo, .tarjeta-producto-cuerpo{ padding: 16px; display:flex; flex-direction:column; gap: 6px; flex:1; }
      .tarjeta-combo-cuerpo h3{ font-size: 18px; }
      .tarjeta-producto-cuerpo h4{ font-size: 15.5px; }
      .tarjeta-descripcion{ font-size: 13.5px; color:#5c5040; margin-bottom: 4px; }
      .tarjeta-variantes{ font-family:'JetBrains Mono', monospace; font-size: 11px; color: var(--verde); }
      .lista-incluye{ list-style:none; margin:0 0 8px; padding:0; display:flex; flex-direction:column; gap:3px; }
      .lista-incluye li{ display:flex; align-items:center; gap:6px; font-size: 12.5px; color:#4a4030; }
      .lista-incluye svg{ color: var(--verde); flex-shrink:0; }
      .tarjeta-precios{ display:flex; align-items:baseline; gap:8px; margin-top:auto; padding-top: 6px; }
      .precio{ font-family:'JetBrains Mono', monospace; font-weight:600; font-size: 17px; color: var(--negro); }
      .precio-chico{ font-family:'JetBrains Mono', monospace; font-size: 12px; color:#5c5040; }
      .precio-tachado{ font-family:'JetBrains Mono', monospace; font-size: 13px; color:#a89a7d; text-decoration: line-through; }
      .tarjeta-botones{ display:flex; gap:8px; margin-top: 8px; flex-wrap:wrap; }
      .tarjeta-botones .boton{ flex:1; justify-content:center; white-space:nowrap; }

      .foto-respaldo{ color: var(--oro-suave); }

      .vacio-aviso{ display:flex; align-items:center; gap:10px; background:#f0e9d8; border:1px dashed #c9b98d; padding:16px; border-radius: var(--radio); color:#6b5c3d; }

      /* ---- Nosotros / Contacto ---- */
      .texto-largo{ font-size: 16px; color:#4a4030; }
      .grid-valores{ display:grid; grid-template-columns:1fr; gap:20px; margin-top: 30px; }
      @media (min-width:700px){ .grid-valores{ grid-template-columns: repeat(3,1fr); } }
      .valor{ background: var(--beige); padding: 22px; border-radius: var(--radio); }
      .valor h4{ margin-top:10px; font-size:16px; }
      .valor p{ font-size: 13.5px; color:#5c5040; margin:0; }

      .grid-contacto{ display:grid; grid-template-columns:1fr; gap: 16px; }
      @media (min-width:640px){ .grid-contacto{ grid-template-columns: repeat(2,1fr); } }
      .dato-contacto{ display:flex; gap:12px; background:white; border:1px solid #e2d8c3; padding:16px; border-radius: var(--radio); align-items:flex-start; }
      .dato-contacto strong{ display:block; font-size:13px; text-transform:uppercase; letter-spacing:0.06em; color: var(--verde); }
      .dato-contacto p{ margin:2px 0 0; font-size:14px; }

      /* ---- Carrito lateral ---- */
      .carrito-overlay{ position:fixed; inset:0; background: rgba(23,19,15,0.55); z-index: 70; display:flex; justify-content:flex-end; }
      .carrito-panel{ width: 100%; max-width: 420px; background: var(--crema); height:100%; display:flex; flex-direction:column; }
      .carrito-encabezado{ display:flex; align-items:center; justify-content:space-between; padding: 18px 20px; border-bottom:1px solid #e2d8c3; }
      .carrito-encabezado h3{ display:flex; align-items:center; gap:8px; margin:0; font-size:17px; }
      .carrito-encabezado button{ background:none; border:none; }
      .carrito-items{ flex:1; overflow-y:auto; padding: 12px 20px; display:flex; flex-direction:column; gap: 14px; }
      .carrito-item{ display:flex; gap: 10px; align-items:center; border-bottom: 1px solid #ece3d2; padding-bottom: 12px; }
      .carrito-item-foto{ width: 56px; height:56px; border-radius: var(--radio); object-fit:cover; flex-shrink:0; }
      .carrito-item-info{ flex:1; display:flex; flex-direction:column; gap:4px; }
      .carrito-item-info strong{ font-size: 13.5px; }
      .stepper{ display:flex; align-items:center; gap:8px; }
      .stepper button{ background: var(--beige); border:none; border-radius: 2px; width:22px; height:22px; display:flex; align-items:center; justify-content:center; }
      .boton-quitar{ background:none; border:none; color: var(--rojo); }
      .carrito-resumen{ border-top: 1px solid #e2d8c3; padding: 16px 20px 22px; display:flex; flex-direction:column; gap:10px; }
      .carrito-total-fila{ display:flex; justify-content:space-between; font-size: 14px; color:#5c5040; }
      .carrito-total-grande{ font-size: 18px; font-weight:700; color: var(--negro); font-family:'JetBrains Mono', monospace; }

      /* ---- Pie ---- */
      .pie{ background: var(--negro); color: var(--beige); padding: 50px 20px 20px; display:grid; grid-template-columns:1fr; gap: 30px; }
      @media (min-width:700px){ .pie{ grid-template-columns: 2fr 1fr 1fr; max-width:1180px; margin:0 auto; padding: 60px 20px 20px; } }
      .marca-pie{ display:flex; align-items:center; gap:10px; font-family:'Fraunces', serif; font-size: 19px; color: var(--crema); margin-bottom: 8px; }
      .pie-columna h5{ color: var(--oro-suave); font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:0.1em; text-transform:uppercase; margin-bottom: 10px; }
      .pie-columna button{ display:block; background:none; border:none; color: var(--beige); padding: 4px 0; text-align:left; font-size: 14px; }
      .pie-columna p{ font-size: 13.5px; margin: 4px 0; }
      .pie-linea{ grid-column: 1/-1; border-top: 1px solid var(--cafe-claro); margin-top: 20px; padding-top: 16px; font-size: 12px; color:#8a7e68; text-align:center; }

      /* ---- WhatsApp flotante ---- */
      .whatsapp-flotante{ position:fixed; bottom: 22px; right: 22px; background: var(--verde); color:white; width: 56px; height:56px; border-radius: 50%; display:flex; align-items:center; justify-content:center; box-shadow: 0 10px 26px rgba(0,0,0,0.3); z-index: 50; }

      /* ---- Admin ---- */
      .admin-encabezado{ display:flex; align-items:flex-start; justify-content:space-between; gap: 12px; flex-wrap:wrap; }
      .admin-tabs{ display:flex; gap:8px; border-bottom:1px solid #e2d8c3; margin: 20px 0 24px; }
      .admin-tabs button{ background:none; border:none; padding: 10px 14px; font-size: 14px; color:#5c5040; border-bottom: 2px solid transparent; }
      .admin-tabs button.activo{ color: var(--negro); border-color: var(--oro); font-weight:600; }
      .admin-tabla{ display:flex; flex-direction:column; gap: 10px; margin-top: 18px; }
      .admin-fila{ display:flex; align-items:center; gap: 12px; background:white; border:1px solid #e2d8c3; border-radius: var(--radio); padding: 10px; }
      .admin-fila-foto{ width: 48px; height:48px; border-radius: var(--radio); object-fit:cover; flex-shrink:0; }
      .admin-fila-info{ flex:1; display:flex; flex-direction:column; }
      .admin-fila-info strong{ font-size: 13.5px; }
      .admin-fila-info span{ font-size: 12px; color:#5c5040; font-family:'JetBrains Mono', monospace; }
      .switch{ display:flex; align-items:center; gap:6px; font-size: 11px; color:#5c5040; }
      .boton-icono{ background: var(--beige); border:none; padding: 8px; border-radius: var(--radio); }
      .boton-icono.peligro{ color: var(--rojo); }

      .form-admin, .form-login{ display:flex; flex-direction:column; gap: 14px; max-width: 520px; margin-top: 20px; }
      .form-admin label, .form-login label{ display:flex; flex-direction:column; gap:6px; font-size: 13px; font-weight:600; color:#4a4030; }
      .form-admin input, .form-admin select, .form-admin textarea, .form-login input{
        font-size: 14px; padding: 10px 12px; border: 1px solid #d9cead; border-radius: var(--radio); background:white; font-weight:400; color: var(--negro);
      }
      .form-admin .fila-check{ flex-direction:row; align-items:center; }
      .form-botones{ display:flex; align-items:center; gap: 14px; margin-top: 4px; }
      .texto-error{ color: var(--rojo); font-size: 13px; }
      .texto-exito{ display:flex; align-items:center; gap:6px; color: var(--verde); font-size: 13px; font-weight:600; }
      .nota-admin{ font-size: 12px; color:#8a7e68; font-weight:400; line-height:1.5; margin-top: 6px; }
    `}</style>
  );
}
