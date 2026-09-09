// ============================================
// CITZ - SISTEMA UNIVERSAL DE ACTIVIDADES
// ============================================

const SUPABASE_URL =
    "https://bcfknbpkduiwgqymxkns.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_END5KZ8gA4e9YDpicG-aLw_aRaIzo7E";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ============================================
// OBTENER ID DE LA ACTIVIDAD
// ============================================

const parametros = new URLSearchParams(
    window.location.search
);

const actividadId = parametros.get("actividad");

let alumnoActual = null;


// ============================================
// CARGAR ALUMNO
// ============================================

async function cargarAlumnoActividad() {

    const {
        data: { session },
        error: sessionError
    } = await supabaseClient.auth.getSession();

    if (sessionError || !session) {

        console.error("No hay sesión");

        alert("Debes iniciar sesión para realizar esta actividad.");

        window.location.href = "login.html";

        return null;
    }


    const { data: alumno, error } =
        await supabaseClient
            .from("alumnos")
            .select("*")
            .eq("auth_id", session.user.id)
            .single();


    if (error || !alumno) {

        console.error(error);

        alert("No se encontró tu perfil de alumno.");

        return null;
    }


    alumnoActual = alumno;

    return alumno;
}


// ============================================
// COMPROBAR QUE EL ALUMNO TENGA ASIGNADA
// LA ACTIVIDAD
// ============================================

async function verificarActividad() {

    if (!actividadId) {

        console.error(
            "No se encontró ?actividad=ID en el enlace."
        );

        return null;
    }


    if (!alumnoActual) {

        await cargarAlumnoActividad();

    }


    const { data, error } =
        await supabaseClient
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

        console.warn(
            "Esta actividad no está asignada al alumno."
        );

        return null;
    }


    return data;
}


// ============================================
// ENVIAR RESULTADO
// ============================================

async function enviarResultadoActividad(datos) {

    try {

        // ----------------------------------------
        // Cargar alumno si todavía no existe
        // ----------------------------------------

        if (!alumnoActual) {

            await cargarAlumnoActividad();

        }


        // ----------------------------------------
        // Validaciones
        // ----------------------------------------

        if (!alumnoActual) {

            throw new Error(
                "No se pudo identificar al alumno."
            );

        }


        if (!actividadId) {

            throw new Error(
                "No se encontró el ID de la actividad."
            );

        }


        // ----------------------------------------
        // Buscar asignación
        // ----------------------------------------

        const { data: asignacion, error: buscarError } =
            await supabaseClient
                .from("actividad_alumnos")
                .select("id, estado")
                .eq("actividad_id", actividadId)
                .eq("alumno_id", alumnoActual.id)
                .maybeSingle();


        if (buscarError) {

            throw buscarError;

        }


        if (!asignacion) {

            throw new Error(
                "Esta actividad no está asignada a tu usuario."
            );

        }


        // ----------------------------------------
        // Calificación
        // ----------------------------------------

        let calificacion =
            Number(datos.calificacion);


        if (isNaN(calificacion)) {

            calificacion = null;

        }


        // ----------------------------------------
        // Actualizar actividad
        // ----------------------------------------

        const { data, error } =
            await supabaseClient
                .from("actividad_alumnos")
                .update({

                    estado: "completada",

                    calificacion: calificacion,

                    completada_at:
                        new Date().toISOString(),

                    resultado:
                        datos.resultado || {}

                })
                .eq("id", asignacion.id)
                .select()
                .single();


        if (error) {

            throw error;

        }


        console.log(
            "Resultado enviado correctamente:",
            data
        );


        return {

            success: true,

            data: data

        };


    } catch (error) {

        console.error(
            "Error enviando resultado:",
            error
        );


        return {

            success: false,

            error: error

        };

    }

}
