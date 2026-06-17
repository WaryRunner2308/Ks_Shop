import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { etiquetaPlataforma } from "@/lib/constantes";
import FormularioPago from "./formulario-pago";

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
    .select("id, plataforma, url_producto, variante, precio_venta, estado")
    .eq("id", presupuestoId)
    .single();

  if (!presupuesto) notFound();

  // Si no está cotizada (o ya está pagada) no se puede pagar aquí.
  if (presupuesto.estado !== "cotizado" || presupuesto.precio_venta == null) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="font-display text-2xl text-tinta">
          {presupuesto.estado === "pagado"
            ? "Esta solicitud ya tiene un pago registrado"
            : "Esta solicitud todavía no se puede pagar"}
        </h1>
        <p className="mt-3 text-sm text-tinta-soft">
          {presupuesto.estado === "pagado"
            ? "Estamos verificando tu pago."
            : "Aún no tiene un precio. Te avisaremos cuando esté cotizada."}
        </p>
        <Link
          href="/mis-solicitudes"
          className="mt-6 inline-block rounded-xl border border-linea px-5 py-3 font-medium text-tinta transition hover:bg-crema-2"
        >
          Volver a mis solicitudes
        </Link>
      </div>
    );
  }

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
          className="text-sm text-coral-dark hover:underline"
        >
          ← Mis solicitudes
        </Link>
        <h1 className="mt-2 font-display text-3xl text-tinta">Pagar pedido</h1>
        <p className="mt-1 text-sm text-tinta-soft">
          {etiquetaPlataforma(presupuesto.plataforma)}
          {presupuesto.variante ? ` · ${presupuesto.variante}` : ""}
        </p>
      </header>

      <FormularioPago
        presupuestoId={presupuesto.id}
        precio={Number(presupuesto.precio_venta)}
        metodos={metodos ?? []}
      />
    </div>
  );
}
