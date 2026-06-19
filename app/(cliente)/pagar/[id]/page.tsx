import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { etiquetaPlataforma } from "@/lib/constantes";
import FormularioPago from "./formulario-pago";
import ContadorOferta from "@/app/components/contador-oferta";

type Metodo = {
  id: number;
  tipo: string;
  detalles: Record<string, string>;
};

export default async function PagarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const presupuestoId = Number(id);
  if (!Number.isInteger(presupuestoId)) notFound();

  const supabase = await createClient();

  // RLS garantiza que el cliente solo obtenga sus propios presupuestos.
  const { data: presupuesto } = await supabase
    .from("presupuestos")
    .select(
      "id, plataforma, url_producto, variante, precio_venta, estado, expira_en",
    )
    .eq("id", presupuestoId)
    .single();

  if (!presupuesto) notFound();

  const vencida =
    presupuesto.expira_en != null &&
    new Date(presupuesto.expira_en).getTime() < Date.now();

  // Si no está cotizada, ya está pagada, o venció la oferta: no se puede pagar.
  if (
    presupuesto.estado !== "cotizado" ||
    presupuesto.precio_venta == null ||
    vencida
  ) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="font-display text-2xl text-tinta">
          {presupuesto.estado === "pagado"
            ? "Esta solicitud ya tiene un pago registrado"
            : vencida
              ? "El precio de esta oferta venció"
              : "Esta solicitud todavía no se puede pagar"}
        </h1>
        <p className="mt-3 text-sm text-tinta-soft">
          {presupuesto.estado === "pagado"
            ? "Estamos verificando tu pago."
            : vencida
              ? "La oferta tenía 12 horas de validez. Pediremos un precio nuevo y te avisaremos."
              : "Aún no tiene un precio. Te avisaremos cuando esté cotizada."}
        </p>
        <Link href="/mis-solicitudes" className="btn-linea mt-6 px-5 py-3">
          Volver a mis solicitudes
        </Link>
      </div>
    );
  }

  // Teléfono del admin (para los enlaces de WhatsApp de Pago Móvil / Divisas).
  // Se obtiene con una función segura (SECURITY DEFINER) porque el cliente no
  // tiene permiso de RLS para leer la fila del admin; la función devuelve SOLO
  // el número, no el resto de los datos del admin.
  const { data: telefonoAdmin } = await supabase.rpc("telefono_admin");

  // Solo los métodos de pago ACTIVOS (RLS permite al cliente verlos).
  const { data: metodos } = await supabase
    .from("metodos_pago")
    .select("id, tipo, detalles")
    .eq("activo", true)
    .order("created_at", { ascending: true })
    .returns<Metodo[]>();

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <header className="mb-6">
        <Link
          href="/mis-solicitudes"
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-medium text-tinta-soft transition hover:border-white/25 hover:text-tinta"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Mis solicitudes
        </Link>
        <h1 className="mt-2 font-display text-3xl text-tinta">Pagar pedido</h1>
        <p className="mt-1 text-sm text-tinta-soft">
          {etiquetaPlataforma(presupuesto.plataforma)}
          {presupuesto.variante ? ` · ${presupuesto.variante}` : ""}
        </p>
      </header>

      {presupuesto.expira_en && (
        <div className="mb-5">
          <ContadorOferta expiraEn={presupuesto.expira_en} />
        </div>
      )}

      <FormularioPago
        presupuestoId={presupuesto.id}
        precio={Number(presupuesto.precio_venta)}
        metodos={metodos ?? []}
        adminTelefono={telefonoAdmin ?? null}
        productoUrl={presupuesto.url_producto}
      />
    </div>
  );
}
