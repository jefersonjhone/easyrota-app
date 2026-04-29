type ColumnProps = {
  title: string
  children?: React.ReactNode
}

const FooterColumn: React.FC<ColumnProps> = ({ title, children }) => {
  return (
    <div>
      <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.35em] text-foreground">
        {title}
      </h3>
      <div className="flex flex-col gap-3 text-sm text-muted-foreground">
        {children}
      </div>
    </div>
  )
}

export default FooterColumn
