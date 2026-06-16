export default function FormSection({ title, description, children }) {
  return (
    <section className="rounded-xl border border-[#E8E6FF] bg-white p-5 sm:p-6">
      <div className="mb-5 border-b border-[#E8E6FF] pb-4">
        <h2 className="text-lg font-semibold text-[#10026B]">{title}</h2>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-[#6b63a3]">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
