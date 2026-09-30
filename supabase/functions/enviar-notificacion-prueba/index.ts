// Tipos y herramientas del entorno de Supabase Edge Functions.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";
import { sendPushNotification } from "npm:@mmmike/web-push/send";

export default {
  fetch: withSupabase({ auth: "user" }, async (_peticion, ctx) => {
    try {
      const usuarioId = ctx.userClaims?.id;

      if (!usuarioId) {
        return Response.json(
          { error: "La sesión no es válida." },
          { status: 401 },
        );
      }

      // ctx.supabase respeta las políticas RLS del usuario conectado.
      const { data: dispositivos, error: errorDispositivos } =
        await ctx.supabase
          .from("dispositivos_notificaciones")
          .select("id, endpoint, clave_p256dh, clave_auth")
          .eq("usuario_id", usuarioId)
          .eq("activo", true);

      if (errorDispositivos) {
        throw errorDispositivos;
      }

      if (!dispositivos || dispositivos.length === 0) {
        return Response.json(
          { error: "No hay dispositivos activos para esta cuenta." },
          { status: 400 },
        );
      }

      const vapid = {
        publicKey: obtenerSecreto("VAPID_PUBLIC_KEY"),
        privateKey: obtenerSecreto("VAPID_PRIVATE_KEY"),
        subject: obtenerSecreto("VAPID_SUBJECT"),
      };

      let enviadas = 0;
      let caducadas = 0;
      let fallidas = 0;

      for (const dispositivo of dispositivos) {
        try {
          const entregada = await sendPushNotification(
            {
              endpoint: dispositivo.endpoint,
              keys: {
                p256dh: dispositivo.clave_p256dh,
                auth: dispositivo.clave_auth,
              },
            },
            {
              title: "Atempo",
              body: "Tu primera notificación push ha llegado 💛",
              url: "./",
              tag: "prueba-push-atempo",
            },
            vapid,
          );

          if (entregada) {
            enviadas++;
          } else {
            caducadas++;

            await ctx.supabase
              .from("dispositivos_notificaciones")
              .update({ activo: false })
              .eq("id", dispositivo.id);
          }
        } catch (error) {
          fallidas++;
          console.log("No se pudo enviar a un dispositivo:", error);
        }
      }

      return Response.json({ enviadas, caducadas, fallidas });
    } catch (error) {
      console.log("Error al enviar la notificación de prueba:", error);

      return Response.json(
        { error: "No se pudo enviar la notificación de prueba." },
        { status: 500 },
      );
    }
  }),
};

function obtenerSecreto(nombre: string) {
  const valor = Deno.env.get(nombre);

  if (!valor) {
    throw new Error(`Falta el secreto ${nombre}.`);
  }

  return valor;
}
