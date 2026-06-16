import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RequiredMark() {
  return <span className="text-red-500"> *</span>;
}

export function FieldHint({ children }) {
  return <p className="mt-1 text-xs text-[#6b63a3]">{children}</p>;
}

export function FormField({
  label,
  required,
  hint,
  children,
  className = "",
}) {
  return (
    <div className={className}>
      {label && (
        <Label className="text-[#10026B]">
          {label}
          {required && <RequiredMark />}
        </Label>
      )}
      {hint && <FieldHint>{hint}</FieldHint>}
      <div className={label || hint ? "mt-2" : ""}>{children}</div>
    </div>
  );
}

export function TextField({ label, required, hint, className, ...props }) {
  return (
    <FormField label={label} required={required} hint={hint} className={className}>
      <Input {...props} />
    </FormField>
  );
}

export function TextAreaField({ label, required, hint, className, ...props }) {
  return (
    <FormField label={label} required={required} hint={hint} className={className}>
      <Textarea {...props} />
    </FormField>
  );
}
