// ======================================================
// CITZ - SISTEMA UNIVERSAL DE ACTIVIDADES
// ======================================================

const SUPABASE_URL =
    "https://bcfknbpkduiwgqymxkns.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_END5KZ8gA4e9YDpicG-aLw_aRaIzo7E";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ======================================================
// VARIABLES
// ======================================================

const parametros = new URLSearchParams(
    window.location.search
);

const actividadId = parametros.get("actividad");

let alumnoActual = null;


// ======================================================
// OBTENER ALUMNO QUE INICIÓ SESIÓN
// ======================================================

async function obtenerAlumno() {

    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();


    if (error) {

        console.error(
            "Error obteniendo sesión:",
            error
        );

        return null;
    }


    if (!session) {

        console.error(
            "No hay sesión iniciada."
        );

        return null;
    }


    const {
        data: alumno,
        error: alumnoError
    } = await supabaseClient
        .from("alumnos")
        .select("*")
        .eq("auth_id", session.user.id)
        .single();


    if (alumnoError) {

        console.error(
            "Error obteniendo alumno:",
            alumnoError
        );

        return null;
    }


    alumnoActual = alumno;

    return alumno;
}


// ======================================================
// VERIFICAR QUE LA ACTIVIDAD ESTÉ ASIGNADA
// ======================================================

async function verificarActividad() {

    if (!actividadId) {

        console.error(
            "No existe ?actividad=ID en el enlace."
        );

        return null;
    }


    if (!alumnoActual) {

        await obtenerAlumno();

    }


    if (!alumnoActual) {

        return null;

    }


    const {
        data,
        error
    } = await supabaseClient
        .from("actividad_alumnos")
        .select(`
            id,
            actividad_id,
            alumno_id,
            estado,
            calificacion,
            resultado,
            completada_at
        `)
        .eq("actividad_id", actividadId)
        .eq("alumno_id", alumnoActual.id)
        .maybeSingle();


    if (error) {

        console.error(
            "Error verificando actividad:",
            error
        );

        return null;
    }


    if (!data) {

        console.error(
            "La actividad no está asignada a este alumno."
        );

        return null;
    }


    return data;
}


// ======================================================
// ENVIAR RESULTADO DE CUALQUIER ACTIVIDAD
// ======================================================

async function enviarResultadoActividad({

    calificacion,
    resultado = {}

}) {

    // ----------------------------------------------
    // Verificar alumno
    // ----------------------------------------------

    if (!alumnoActual) {

        await obtenerAlumno();

    }


    if (!alumnoActual) {

        alert(
            "No se pudo identificar al alumno."
        );

        return false;
    }


    // ----------------------------------------------
    // Verificar actividad
    // ----------------------------------------------

    if (!actividadId) {

        alert(
            "Esta actividad no tiene un ID válido."
        );

        return false;
    }


    // ----------------------------------------------
    // Buscar actividad asignada
    // ----------------------------------------------

    const {
        data: asignacion,
        error: buscarError
    } = await supabaseClient
        .from("actividad_alumnos")
        .select("id, estado")
        .eq("actividad_id", actividadId)
        .eq("alumno_id", alumnoActual.id)
        .maybeSingle();


    if (buscarError) {

        console.error(
            "Error buscando actividad:",
            buscarError
        );

        alert(
            "No se pudo comprobar la actividad."
        );

        return false;
    }


    if (!asignacion) {

        alert(
            "Esta actividad no está asignada a tu usuario."
        );

        return false;
    }


    // ----------------------------------------------
    // Actualizar resultado
    // ----------------------------------------------

    const {
        error: updateError
    } = await supabaseClient
        .from("actividad_alumnos")
        .update({

            estado: "completada",

            calificacion:
                Number(calificacion),

            completada_at:
                new Date().toISOString(),

            resultado:
                resultado

        })
        .eq("id", asignacion.id);


    if (updateError) {

        console.error(
            "Error guardando resultado:",
            updateError
        );

        alert(
            "No se pudo guardar el resultado."
        );

        return false;
    }


    console.log(
        "✅ Resultado guardado correctamente."
    );


    return true;
}


// ======================================================
// INICIALIZAR ACTIVIDAD
// ======================================================

async function iniciarActividad() {

    const alumno = await obtenerAlumno();


    if (!alumno) {

        alert(
            "Debes iniciar sesión para realizar esta actividad."
        );

        return;
    }


    const actividad =
        await verificarActividad();


    if (!actividad) {

        alert(
            "Esta actividad no está asignada a tu usuario."
        );

        return;
    }


    console.log(
        "Alumno:",
        alumno.nombre
    );

    console.log(
        "Actividad:",
        actividadId
    );

    console.log(
        "Estado:",
        actividad.estado
    );


    // Si ya está terminada
    if (
        actividad.estado === "completada"
    ) {

        console.log(
            "Esta actividad ya fue completada."
        );

    }

}


// ======================================================
// INICIAR AUTOMÁTICAMENTE
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    iniciarActividad
);
