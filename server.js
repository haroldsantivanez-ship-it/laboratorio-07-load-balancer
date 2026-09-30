const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
    session({
        secret: 'laboratorio07-secreto',
        resave: false,
        saveUninitialized: false
    })
);

// =============================
// DATOS DEL MONOLITO
// =============================

const usuarioAdministrador = {
    id: 1,
    nombre: 'Administrador',
    correo: 'admin@lab07.com',
    password: bcrypt.hashSync('admin123', 10)
};

let productos = [
    {
        id: 1,
        nombre: 'Laptop Empresarial',
        categoria: 'Tecnología',
        precio: 2500,
        stock: 10
    },
    {
        id: 2,
        nombre: 'Monitor Full HD',
        categoria: 'Tecnología',
        precio: 750,
        stock: 15
    },
    {
        id: 3,
        nombre: 'Teclado Mecánico',
        categoria: 'Accesorios',
        precio: 250,
        stock: 20
    }
];

let siguienteId = 4;

// =============================
// MIDDLEWARE DE AUTENTICACIÓN
// =============================

function requiereLogin(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }

    next();
}

// =============================
// LOGIN
// =============================

app.get('/', (req, res) => {
    if (req.session.usuario) {
        return res.redirect('/dashboard');
    }

    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('login', {
        error: null
    });
});

app.post('/login', (req, res) => {
    const { correo, password } = req.body;

    const correoCorrecto =
        correo === usuarioAdministrador.correo;

    const passwordCorrecto =
        bcrypt.compareSync(
            password || '',
            usuarioAdministrador.password
        );

    if (!correoCorrecto || !passwordCorrecto) {
        return res.status(401).render('login', {
            error: 'Correo o contraseña incorrectos'
        });
    }

    req.session.usuario = {
        id: usuarioAdministrador.id,
        nombre: usuarioAdministrador.nombre,
        correo: usuarioAdministrador.correo
    };

    res.redirect('/dashboard');
});

// =============================
// DASHBOARD
// =============================

app.get('/dashboard', requiereLogin, (req, res) => {
    const totalProductos = productos.length;

    const totalStock = productos.reduce(
        (total, producto) => total + Number(producto.stock),
        0
    );

    res.render('dashboard', {
        usuario: req.session.usuario,
        totalProductos,
        totalStock
    });
});

// =============================
// CRUD PRODUCTOS
// =============================

// LISTAR
app.get('/productos', requiereLogin, (req, res) => {
    res.render('productos', {
        usuario: req.session.usuario,
        productos
    });
});

// CREAR
app.post('/productos', requiereLogin, (req, res) => {
    const { nombre, categoria, precio, stock } = req.body;

    productos.push({
        id: siguienteId++,
        nombre,
        categoria,
        precio: Number(precio),
        stock: Number(stock)
    });

    res.redirect('/productos');
});

// EDITAR
app.post('/productos/:id/editar', requiereLogin, (req, res) => {
    const id = Number(req.params.id);
    const { nombre, categoria, precio, stock } = req.body;

    const producto = productos.find(
        producto => producto.id === id
    );

    if (producto) {
        producto.nombre = nombre;
        producto.categoria = categoria;
        producto.precio = Number(precio);
        producto.stock = Number(stock);
    }

    res.redirect('/productos');
});

// ELIMINAR
app.post('/productos/:id/eliminar', requiereLogin, (req, res) => {
    const id = Number(req.params.id);

    productos = productos.filter(
        producto => producto.id !== id
    );

    res.redirect('/productos');
});

// =============================
// CERRAR SESIÓN
// =============================

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// =============================
// HEALTH CHECK
// =============================

app.get('/health', (req, res) => {
    res.status(200).json({
        estado: 'OK',
        aplicacion: 'Laboratorio 07 Monolito',
        puerto: PORT
    });
});

// =============================
// SERVIDOR
// =============================

app.listen(PORT, '0.0.0.0', () => {
    console.log('====================================');
    console.log(' LABORATORIO 07 - MONOLITO');
    console.log('====================================');
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
    console.log(`http://localhost:${PORT}`);
    console.log('====================================');
});