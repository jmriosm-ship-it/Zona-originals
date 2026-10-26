import { PageHead } from './Pages'

const UPDATED = '24 de octubre de 2026'

function Section({ title, children }) {
  return (
    <section className="legal-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

// Datos del titular de la tienda, tomados de Ajustes. Si faltan, se omiten sin romper el texto.
function useHolder(settings) {
  const name = settings.legalName?.trim() || 'Zona Originals'
  const nit = settings.nit?.trim()
  const email = settings.contactEmail?.trim()
  const address = [settings.address?.trim(), settings.city?.trim()].filter(Boolean).join(', ')
  const phone = settings.whatsapp ? `+${settings.whatsapp}` : ''
  return { name, nit, email, address, phone }
}

function Contact({ h }) {
  return (
    <ul>
      <li>Titular: {h.name}{h.nit ? ` (NIT/C.C. ${h.nit})` : ''}</li>
      {h.address && <li>Dirección: {h.address}</li>}
      {h.phone && <li>WhatsApp: {h.phone}</li>}
      {h.email && <li>Correo: {h.email}</li>}
    </ul>
  )
}

export function PrivacyPage({ settings }) {
  const h = useHolder(settings)
  return (
    <>
      <PageHead eyebrow="Legal" title="Política de privacidad." subtitle={`Última actualización: ${UPDATED}`} />
      <section className="section">
        <div className="wrap">
          <article className="panel legal">
            <p>
              Esta política explica cómo {h.name} (en adelante, "la tienda") trata los datos personales de quienes visitan este sitio, de acuerdo con la
              Ley 1581 de 2012, el Decreto 1377 de 2013 (incorporado en el Decreto 1074 de 2015) y las demás normas colombianas sobre protección de datos
              personales.
            </p>

            <Section title="1. Responsable del tratamiento">
              <Contact h={h} />
            </Section>

            <Section title="2. Qué datos recogemos">
              <ul>
                <li>
                  <strong>Reseñas:</strong> el nombre y el comentario que escribas voluntariamente. Solo se publican después de que la tienda los revisa.
                </li>
                <li>
                  <strong>WhatsApp:</strong> cuando nos escribes, tu número y tus mensajes quedan en WhatsApp y se tratan también según las políticas de
                  WhatsApp y Meta. Usamos esos datos para atenderte.
                </li>
                <li>
                  <strong>Datos en tu navegador:</strong> el sitio guarda en tu dispositivo el carrito de compras y una copia de los productos para cargar más
                  rápido. No usamos cookies de publicidad ni herramientas de seguimiento.
                </li>
              </ul>
              <p>No pedimos datos sensibles ni de menores de edad. Si crees que un menor nos dejó datos, escríbenos y los eliminamos.</p>
            </Section>

            <Section title="3. Para qué los usamos">
              <ul>
                <li>Responder tus consultas y atender pedidos o solicitudes de crédito.</li>
                <li>Publicar las reseñas aprobadas.</li>
                <li>Mejorar el servicio y el funcionamiento del sitio.</li>
              </ul>
            </Section>

            <Section title="4. Servicios de terceros">
              <p>Para funcionar, el sitio usa proveedores que pueden procesar datos técnicos (como tu dirección IP) o los datos que envías:</p>
              <ul>
                <li>Supabase: base de datos y almacenamiento de fotos.</li>
                <li>Netlify y Cloudflare: alojamiento de la página y del dominio.</li>
                <li>Google Maps: mapa de la ubicación del local.</li>
                <li>WhatsApp (Meta): atención y pedidos.</li>
                <li>TikTok e Instagram: solo si abres sus enlaces o ves un video incrustado.</li>
              </ul>
              <p>Cada proveedor trata los datos según sus propias políticas. Algunos pueden estar ubicados fuera de Colombia.</p>
            </Section>

            <Section title="5. Tus derechos">
              <p>Como titular de los datos puedes:</p>
              <ul>
                <li>Conocer, actualizar y rectificar tus datos.</li>
                <li>Solicitar prueba de la autorización que diste.</li>
                <li>Pedir información sobre el uso que se ha dado a tus datos.</li>
                <li>Revocar la autorización y solicitar la supresión de tus datos, cuando la ley lo permita.</li>
                <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
              </ul>
            </Section>

            <Section title="6. Cómo ejercer tus derechos">
              <p>
                Escríbenos por los medios de contacto de arriba. Atendemos las consultas en máximo 10 días hábiles (prorrogables por 5 días hábiles más,
                informándote el motivo) y los reclamos en máximo 15 días hábiles (prorrogables por 8 días hábiles más).
              </p>
            </Section>

            <Section title="7. Autorización">
              <p>
                Al enviar una reseña o escribirnos por WhatsApp, autorizas el tratamiento de tus datos para las finalidades descritas. Puedes revocar esta
                autorización cuando quieras.
              </p>
            </Section>

            <Section title="8. Seguridad y conservación">
              <p>
                Aplicamos medidas razonables para proteger los datos, como acceso restringido al panel de administración. Conservamos los datos el tiempo
                necesario para cumplir las finalidades descritas y las obligaciones legales.
              </p>
            </Section>

            <Section title="9. Cambios en esta política">
              <p>Podemos actualizar esta política. La fecha de la parte de arriba indica la última versión vigente.</p>
            </Section>
          </article>
        </div>
      </section>
    </>
  )
}

export function TermsPage({ settings }) {
  const h = useHolder(settings)
  const warranty = (settings.warranty || '').split(/\n{2,}/).filter((p) => p.trim())
  return (
    <>
      <PageHead eyebrow="Legal" title="Términos y condiciones." subtitle={`Última actualización: ${UPDATED}`} />
      <section className="section">
        <div className="wrap">
          <article className="panel legal">
            <p>
              Al usar este sitio aceptas estos términos. Si no estás de acuerdo, por favor no lo uses. El sitio es operado por {h.name}
              {h.nit ? ` (NIT/C.C. ${h.nit})` : ''}.
            </p>

            <Section title="1. Qué es este sitio">
              <p>
                Es un catálogo en línea de la tienda. Aquí puedes ver productos, precios y disponibilidad, simular un crédito y contactarnos. El sitio no
                procesa pagos.
              </p>
            </Section>

            <Section title="2. Productos, fotos y precios">
              <ul>
                <li>Las fotos y los modelos en 3D son ilustrativos. El producto entregado puede tener pequeñas diferencias de color o presentación.</li>
                <li>Los precios están en pesos colombianos (COP). Pueden cambiar sin previo aviso.</li>
                <li>La disponibilidad depende del inventario. Un producto que aparece disponible puede agotarse antes de confirmar la compra.</li>
                <li>Si hay un error evidente de precio o de información, la tienda puede corregirlo y confirmar contigo antes de cerrar la venta.</li>
              </ul>
            </Section>

            <Section title="3. Cómo se hace una compra">
              <p>
                El carrito no es un pago ni una orden de compra: solo prepara un mensaje de WhatsApp con tu pedido. La venta se confirma cuando la tienda
                responde y se acuerdan el precio final, la forma de pago y la entrega. Los medios de pago y la entrega se acuerdan directamente con el
                local.
              </p>
            </Section>

            <Section title="4. Simulador de crédito">
              <p>
                El simulador es solo informativo. No constituye una oferta ni una aprobación de crédito. La tasa, la cuota inicial, el plazo y los
                requisitos finales los define la tienda y dependen de un estudio de cada caso.
              </p>
            </Section>

            <Section title="5. Garantía">
              {warranty.length > 0 ? (
                warranty.map((p, i) => (
                  <p key={i} className="legal-pre">
                    {p}
                  </p>
                ))
              ) : (
                <p>Las condiciones de garantía se informan al momento de la compra.</p>
              )}
              <p>Lo anterior se entiende sin perjuicio de los derechos que la ley reconoce a los consumidores (Ley 1480 de 2011).</p>
            </Section>

            <Section title="6. Derecho de retracto">
              <p>
                En las ventas a distancia, el consumidor puede ejercer el derecho de retracto dentro de los cinco (5) días hábiles siguientes a la entrega
                del producto, en las condiciones y con las excepciones que establece la Ley 1480 de 2011. Para ejercerlo, escríbenos por los medios de
                contacto de esta página.
              </p>
            </Section>

            <Section title="7. Reseñas">
              <p>
                Puedes dejar una reseña con tu nombre y comentario. Se publica solo después de que la tienda la revisa. La tienda puede no publicar o
                eliminar reseñas ofensivas, falsas o que no tengan relación con el producto.
              </p>
            </Section>

            <Section title="8. Propiedad intelectual y marcas">
              <p>
                Apple, iPhone, MacBook y Apple Watch son marcas de Apple Inc. Los nombres de los perfumes y demás marcas pertenecen a sus respectivos
                dueños. Se mencionan solo para identificar los productos que vendemos. Este sitio es independiente y no está afiliado, patrocinado ni
                respaldado por esas marcas. El diseño y los contenidos propios del sitio pertenecen a la tienda.
              </p>
            </Section>

            <Section title="9. Enlaces y servicios de terceros">
              <p>
                El sitio puede enlazar a servicios de terceros (WhatsApp, TikTok, Instagram, Google Maps). La tienda no controla su contenido ni sus
                políticas.
              </p>
            </Section>

            <Section title="10. Responsabilidad">
              <p>
                Hacemos lo posible por mantener la información correcta y el sitio disponible, pero no garantizamos que esté libre de errores o
                interrupciones. En lo permitido por la ley, la tienda no responde por daños derivados del uso del sitio.
              </p>
            </Section>

            <Section title="11. Datos personales">
              <p>
                El tratamiento de tus datos se explica en la <a href="#/privacidad">política de privacidad</a>.
              </p>
            </Section>

            <Section title="12. Ley aplicable y contacto">
              <p>
                Estos términos se rigen por las leyes de la República de Colombia. Para preguntas, peticiones, quejas o reclamos, usa estos datos de
                contacto:
              </p>
              <Contact h={h} />
              <p>También puedes acudir a la Superintendencia de Industria y Comercio (SIC), autoridad de protección al consumidor.</p>
            </Section>
          </article>
        </div>
      </section>
    </>
  )
}
