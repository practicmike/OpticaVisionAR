import { Eye, Glasses, Baby, CircleDot, ScanEye } from 'lucide-react';

/** Icon for a service's `icon` field (seeded in server/seed-data.ts). */
export const ServiceIcon = ({ name, className = 'h-7 w-7' }: { name: string; className?: string }) => {
  const props = { className, strokeWidth: 1.75, 'aria-hidden': true } as const;
  switch (name) {
    case 'child':
      return <Baby {...props} />;
    case 'contact':
      return <CircleDot {...props} />;
    case 'glasses':
      return <Glasses {...props} />;
    case 'scan':
      return <ScanEye {...props} />;
    default:
      return <Eye {...props} />;
  }
};
