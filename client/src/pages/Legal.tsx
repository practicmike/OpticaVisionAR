import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { BUSINESS } from '@shared/business';

/**
 * Terms of Use and Privacy Policy (Spanish, the governing text for a
 * Mexican business). Content from the client's legal brief, 27 May 2025.
 */
type Block = { heading: string; text?: string; list?: string[]; intro?: string };

const TERMS: Block[] = [
  { heading: 'Uso del Sitio', text: 'Este sitio está destinado exclusivamente para fines informativos y de contacto. Puedes agendar citas, consultar nuestros productos y servicios, leer artículos educativos y enviarnos mensajes a través de formularios.' },
  { heading: 'Propiedad Intelectual', text: 'Todos los contenidos del sitio (textos, imágenes, logotipos, marcas y diseños) son propiedad de Ópticas Cardani o sus respectivos titulares. No está permitido copiar, distribuir o reproducir sin autorización previa por escrito.' },
  { heading: 'Modificaciones', text: 'Ópticas Cardani se reserva el derecho de actualizar, modificar o eliminar contenidos y funcionalidades del sitio sin previo aviso.' },
  { heading: 'Citas y Reservas', text: 'Las citas agendadas a través del sitio están sujetas a confirmación por WhatsApp o teléfono. Nos reservamos el derecho de reprogramar o cancelar en caso de fuerza mayor o disponibilidad.' },
  { heading: 'Enlaces a Terceros', text: 'Podemos incluir enlaces a otros sitios externos. No nos responsabilizamos por sus contenidos ni políticas de privacidad.' },
  { heading: 'Responsabilidad', text: 'El uso de la información publicada en este sitio es responsabilidad del usuario. Ópticas Cardani no se hace responsable por errores u omisiones involuntarias.' },
];

const PRIVACY: Block[] = [
  { heading: 'Información que Recopilamos', intro: 'Cuando usas nuestro sitio, podemos recopilar los siguientes datos mediante formularios:', list: ['Nombre completo', 'Edad', 'Número de teléfono', 'Correo electrónico', 'Comentarios o necesidades especiales', 'Preferencias de cita (fecha y hora)'] },
  { heading: 'Finalidad del Tratamiento', intro: 'Utilizamos esta información para:', list: ['Confirmar y gestionar tus citas', 'Enviarte recordatorios vía WhatsApp', 'Atender tus solicitudes o comentarios', 'Mejorar nuestros servicios y experiencia de usuario'] },
  { heading: 'Compartición de Datos', text: 'No compartimos tu información con terceros, salvo que sea estrictamente necesario para el cumplimiento de los servicios solicitados (por ejemplo, para contactarte vía WhatsApp).' },
  { heading: 'Seguridad', text: 'Aplicamos medidas técnicas y organizativas para proteger tu información personal contra accesos no autorizados, pérdida o alteración.' },
  { heading: 'Derechos ARCO', text: `Tienes derecho a acceder, rectificar, cancelar u oponerte al tratamiento de tus datos personales. Puedes ejercer estos derechos escribiéndonos a: ${BUSINESS.email}` },
  { heading: 'Consentimiento', text: 'Al enviar tus datos a través de este sitio, aceptas esta Política de Privacidad y autorizas el uso de tu información para los fines descritos.' },
  { heading: 'Modificaciones', text: 'Podemos actualizar esta política en cualquier momento. Te recomendamos revisarla periódicamente.' },
];

const LegalCard = ({ id, title, intro, blocks }: { id: string; title: string; intro: string; blocks: Block[] }) => (
  <section id={id} className="card-elevated scroll-mt-28 p-6 md:p-10">
    <h2 className="mb-1 text-2xl font-bold uppercase tracking-wide">{title}</h2>
    <p className="mb-6 text-sm text-muted-foreground">Última actualización: 27 de mayo de 2025</p>
    <p className="mb-6 leading-relaxed">{intro}</p>
    <div className="space-y-6">
      {blocks.map((b) => (
        <div key={b.heading}>
          <h3 className="mb-2 text-lg font-semibold">{b.heading}</h3>
          {b.text && <p className="leading-relaxed text-foreground/90">{b.text}</p>}
          {b.intro && <p className="mb-2 leading-relaxed text-foreground/90">{b.intro}</p>}
          {b.list && (
            <ul className="ml-5 list-disc space-y-1 text-foreground/90">
              {b.list.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
        </div>
      ))}
    </div>
  </section>
);

const Legal = () => {
  const { t } = useTranslation();
  const [location] = useLocation();

  // /privacy-policy and /terms land on their section of this page.
  useEffect(() => {
    const target = location.includes('privacy') ? 'privacidad' : location.includes('terms') ? 'terminos' : null;
    if (target) document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
  }, [location]);

  return (
    <div className="bg-muted py-12 md:py-16">
      <div className="container mx-auto max-w-4xl space-y-8 px-4">
        <header className="text-center">
          <h1 className="section-title">{t('legal.title')}</h1>
          <p className="section-description">{t('legal.subtitle')}</p>
          <div className="section-divider" aria-hidden="true" />
        </header>
        <LegalCard
          id="terminos"
          title="Términos de Uso"
          intro="Al acceder y utilizar este sitio web de Ópticas Cardani, aceptas cumplir con los siguientes términos y condiciones. Si no estás de acuerdo con alguno de estos términos, por favor no utilices este sitio."
          blocks={TERMS}
        />
        <LegalCard
          id="privacidad"
          title="Política de Privacidad"
          intro="Ópticas Cardani se compromete a proteger tu privacidad. Esta política explica cómo recopilamos, usamos y protegemos tu información personal."
          blocks={PRIVACY}
        />
      </div>
    </div>
  );
};

export default Legal;
