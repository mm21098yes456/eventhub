self.onmessage = function(e){

    const eventos = e.data;

    const hoy = new Date();



    const total = eventos.length;



    const proximos = eventos.filter(evento => {

        return new Date(evento.fecha) >= hoy;

    }).length;



    const finalizados = eventos.filter(evento => {

        return new Date(evento.fecha) < hoy;

    }).length;



    self.postMessage({

        total,

        proximos,

        finalizados

    });

}