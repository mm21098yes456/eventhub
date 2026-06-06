import { obtenerEventos, guardarEventos, obtenerModo, guardarModo, inicializarSesion } from './storage.js';

const formulario = document.getElementById("eventoForm");

const listaEventos = document.getElementById("listaEventos");

const totalEventos = document.getElementById("totalEventos");

const eventosProximos = document.getElementById("eventosProximos");

const eventosFinalizados = document.getElementById("eventosFinalizados");

const busqueda = document.getElementById("busqueda");

const filtroCategoria = document.getElementById("filtroCategoria");

const btnModoOscuro = document.getElementById("modoOscuro");

let eventos = obtenerEventos();

let editando = false;

let eventoEditandoId = null;

let grafico;



// SESSION STORAGE
inicializarSesion();



// PEDIR PERMISO NOTIFICACIONES
Notification.requestPermission();



// MOSTRAR EVENTOS AL CARGAR
document.addEventListener("DOMContentLoaded", () => {

    mostrarEventos();

    actualizarGrafico();

});



// EVENTOS
formulario.addEventListener("submit", guardarEvento);

busqueda.addEventListener("input", buscarEventos);

filtroCategoria.addEventListener("change", filtrarCategoria);

btnModoOscuro.addEventListener("click", cambiarModo);

// ESCUCHADOR PARA EDITAR Y ELIMINAR 
listaEventos.addEventListener("click", (e) => {
    
    const id = Number(e.target.dataset.id);
    
    if (!id) return;

    if (e.target.classList.contains("btn-editar")) {
        editarEvento(id);
    } 

    else if (e.target.classList.contains("btn-eliminar")) {
        eliminarEvento(id);
    }
});



// GEOLOCALIZACIÓN
obtenerUbicacion();



// GUARDAR EVENTO
function guardarEvento(e){

    e.preventDefault();

    try{

        const nombre = document.getElementById("nombre").value;

        const fecha = document.getElementById("fecha").value;

        const lugar = document.getElementById("lugar").value;

        const categoria = document.getElementById("categoria").value;



        // VALIDACIONES
        if(

            nombre.trim() === "" ||

            fecha.trim() === "" ||

            lugar.trim() === ""

        ){

            Swal.fire({

                title: "Campos vacíos",

                text: "Completa todos los campos",

                icon: "warning"

            });

            return;

        }



        const evento = {

            id: editando ? eventoEditandoId : Date.now(),

            nombre,

            fecha,

            lugar,

            categoria

        };



        // EDITAR
        if(editando){

            eventos = eventos.map(eventoActual =>

                eventoActual.id === eventoEditandoId
                    ? evento
                    : eventoActual

            );

            editando = false;

            eventoEditandoId = null;

        }

        // CREAR
        else{

            eventos.push(evento);

        }



        // LOCAL STORAGE
        guardarEventos(eventos);

        mostrarEventos();
        actualizarGrafico();
        formulario.reset();



        // ALERTA
        Swal.fire({

            title: "Éxito",

            text: editando
                ? "Evento actualizado correctamente"
                : "Evento guardado correctamente",

            icon: "success",

            confirmButtonColor: "#0d6efd"

        });



        // NOTIFICACIÓN
        if(Notification.permission === "granted"){

            new Notification(

                "🎉 Evento guardado",

                {

                    body: `${nombre} fue agregado correctamente`

                }

            );

        }

    }catch(error){

        console.error(

            "Error al guardar evento",

            error

        );

    }

}



// MOSTRAR EVENTOS
function mostrarEventos(){

    listaEventos.innerHTML = "";



    if(eventos.length === 0){

        listaEventos.innerHTML = `

            <div class="alert alert-secondary text-center">

                No hay eventos registrados

            </div>

        `;

    }



    eventos.forEach(evento => {

        listaEventos.innerHTML += `

            <div class="card shadow p-4 mb-4 event-card animate__animated animate__fadeInUp">

                <div class="d-flex justify-content-between align-items-start flex-wrap">

                    <div>

                        <h4 class="fw-bold">

                            ${evento.nombre}

                        </h4>

                        <p>

                            📅 ${evento.fecha}

                        </p>

                        <p>

                            📍 ${evento.lugar}

                        </p>

                        <span class="badge bg-primary">

                            ${evento.categoria}

                        </span>

                    </div>



                    <div class="mt-3">

                        <button

                            class="btn btn-warning me-2 btn-editar" data-id="${evento.id}"

                        >

                            ✏️ Editar

                        </button>



                        <button

                            class="btn btn-danger btn-eliminar" data-id="${evento.id}"

                        >

                            🗑️ Eliminar

                        </button>

                    </div>

                </div>

            </div>

        `;

    });



    actualizarDashboard();

}



// EDITAR
function editarEvento(id){

    const evento = eventos.find(

        evento => evento.id === id

    );



    document.getElementById("nombre").value = evento.nombre;

    document.getElementById("fecha").value = evento.fecha;

    document.getElementById("lugar").value = evento.lugar;

    document.getElementById("categoria").value = evento.categoria;



    editando = true;

    eventoEditandoId = id;



    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });



    Swal.fire({

        title: "Modo edición",

        text: "Puedes modificar el evento",

        icon: "info",

        confirmButtonColor: "#ffc107"

    });

}



// ELIMINAR
function eliminarEvento(id){

    Swal.fire({

        title: "¿Eliminar evento?",

        text: "No podrás recuperarlo",

        icon: "warning",

        showCancelButton: true,

        confirmButtonColor: "#dc3545",

        cancelButtonColor: "#6c757d",

        confirmButtonText: "Sí, eliminar",

        cancelButtonText: "Cancelar"

    }).then((result) => {

        if(result.isConfirmed){

            eventos = eventos.filter(

                evento => evento.id !== id

            );



            localStorage.setItem(

                "eventos",

                JSON.stringify(eventos)

            );



            mostrarEventos();

            actualizarGrafico();



            Swal.fire({

                title: "Eliminado",

                text: "Evento eliminado correctamente",

                icon: "success"

            });

        }

    });

}



// DASHBOARD
function actualizarDashboard(){

    const worker = new Worker("js/worker.js");



    worker.postMessage(eventos);



    worker.onmessage = function(e){

        const datos = e.data;



        totalEventos.textContent = datos.total;

        eventosProximos.textContent = datos.proximos;

        eventosFinalizados.textContent = datos.finalizados;

    };

}



// BUSCADOR
function buscarEventos(){

    const texto = busqueda.value.toLowerCase();



    const filtrados = eventos.filter(evento => {

        return evento.nombre
            .toLowerCase()
            .includes(texto);

    });



    renderizarFiltrados(filtrados);

}



// FILTRO CATEGORÍA
function filtrarCategoria(){

    const categoria = filtroCategoria.value;



    if(categoria === ""){

        mostrarEventos();

        return;

    }



    const filtrados = eventos.filter(evento => {

        return evento.categoria === categoria;

    });



    renderizarFiltrados(filtrados);

}



// RENDER FILTRADOS
function renderizarFiltrados(lista){

    listaEventos.innerHTML = "";



    if(lista.length === 0){

        listaEventos.innerHTML = `

            <div class="alert alert-danger text-center">

                No se encontraron eventos

            </div>

        `;

        return;

    }



    lista.forEach(evento => {

        listaEventos.innerHTML += `

            <div class="card shadow p-4 mb-4">

                <h4>${evento.nombre}</h4>

                <p>📅 ${evento.fecha}</p>

                <p>📍 ${evento.lugar}</p>

                <span class="badge bg-primary">

                    ${evento.categoria}

                </span>

            </div>

        `;

    });

}



// MODO OSCURO
function cambiarModo(){

    document.body.classList.toggle("dark-mode");



    if(document.body.classList.contains("dark-mode")){

        localStorage.setItem("modo", "oscuro");

    }else{

        localStorage.setItem("modo", "claro");

    }

}



// CARGAR MODO
if(obtenerModo() === "oscuro"){
    document.body.classList.add("dark-mode");
}



// CLIMA
function obtenerUbicacion(){

    if(navigator.geolocation){

        navigator.geolocation.getCurrentPosition(

            obtenerClima,

            mostrarError

        );

    }

}



// OBTENER CLIMA
async function obtenerClima(position){

    const lat = position.coords.latitude;

    const lon = position.coords.longitude;



    try{

        const respuesta = await fetch(

            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`

        );



        const datos = await respuesta.json();



        const temperatura = datos.current_weather.temperature;

        const viento = datos.current_weather.windspeed;



        document.getElementById("clima").innerHTML = `

            🌤️ Temperatura: ${temperatura}°C |
            💨 Viento: ${viento} km/h

        `;

    }catch(error){

        console.log(error);

    }

}



// ERROR GEOLOCALIZACIÓN
function mostrarError(){

    document.getElementById("clima").innerHTML = `

        ❌ No se pudo obtener ubicación

    `;

}



// GRÁFICO
function actualizarGrafico(){

    const categorias = {};



    eventos.forEach(evento => {

        categorias[evento.categoria] =

            (categorias[evento.categoria] || 0) + 1;

    });



    const etiquetas = Object.keys(categorias);

    const datos = Object.values(categorias);



    const colores = [

        "#0d6efd",
        "#198754",
        "#dc3545",
        "#ffc107",
        "#6f42c1",
        "#20c997",
        "#fd7e14",
        "#6610f2",
        "#d63384",
        "#0dcaf0"

    ];



    const ctx = document
        .getElementById("graficoEventos")
        .getContext("2d");



    if(grafico){

        grafico.destroy();

    }



    grafico = new Chart(ctx, {

        type: "doughnut",

        data: {

            labels: etiquetas,

            datasets: [{

                label: "Eventos por categoría",

                data: datos,

                backgroundColor: colores,

                borderWidth: 3,

                hoverOffset: 15

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {

                    position: "bottom"

                }

            }

        }

    });

}



// EXPORTAR PDF
function exportarPDF(){

    window.print();

}



// CERRAR SESIÓN
function cerrarSesion(){

    sessionStorage.clear();



    Swal.fire({

        title: "Sesión cerrada",

        icon: "success"

    });

}