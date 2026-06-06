// EVENTOS
export function obtenerEventos() {
    return JSON.parse(localStorage.getItem("eventos")) || [];
}

export function guardarEventos(eventos) {
    localStorage.setItem("eventos", JSON.stringify(eventos));
}

// MODO OSCURO
export function obtenerModo() {
    return localStorage.getItem("modo");
}

export function guardarModo(modo) {
    localStorage.setItem("modo", modo);
}

// SESIÓN DE USUARIO
export function inicializarSesion() {
    sessionStorage.setItem("usuario", "Administrador");
}