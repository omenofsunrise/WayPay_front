interface CatalogLayoutProps {
  title: string;
  headerButtons?: React.ReactNode;
  filters: React.ReactNode;
  table: React.ReactNode;
  totalItems: number;
  pagination: React.ReactNode;
}

const CatalogLayout = ({
  title,
  headerButtons,
  filters,
  table,
  totalItems,
  pagination,
}: CatalogLayoutProps) => {
  return (
    <div className="catalog-layout">
      <div className="header-section">
        <h1>{title}</h1>
        {headerButtons && <div className="header-buttons">{headerButtons}</div>}
      </div>
      
      <div className="filters-section">
        {filters}
      </div>
      
      <div className="table-section">
        {table}
      </div>
      
      <div className="footer-section">
        <div className="total-items">Всего: {totalItems}</div>
        <div className="pagination">{pagination}</div>
      </div>
    </div>
  );
};

export default CatalogLayout;