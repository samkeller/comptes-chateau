

export function PageTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4">
        <h1>Les choco-sous</h1>
      {children}
    </div>
  );
}