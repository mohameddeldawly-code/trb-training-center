import type { ReactNode } from 'react';

/** ترويسة موحّدة لصفحات لوحة الإدارة */
export function AdminPage({ title, description, action, children }: {
  title: string; description?: string; action?: ReactNode; children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px]">{title}</h1>
          {description && <p className="mt-1.5 max-w-3xl text-[14px] leading-7 text-steel-600">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </div>
  );
}
