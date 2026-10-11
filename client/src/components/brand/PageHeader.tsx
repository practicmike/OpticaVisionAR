interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

/** Navy gradient band at the top of inner pages (same look as the home hero). */
const PageHeader = ({ title, subtitle, children }: PageHeaderProps) => (
  <section className="relative overflow-hidden bg-gradient-to-br from-[#1A365D] via-primary to-[#2B6CB0] text-white">
    <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" aria-hidden="true" />
    <div className="container relative mx-auto max-w-3xl px-4 py-12 text-center md:py-16">
      <h1 className="mb-3 text-3xl font-bold !text-white md:text-5xl">{title}</h1>
      {subtitle && <p className="text-lg text-white/85 md:text-xl">{subtitle}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  </section>
);

export default PageHeader;
