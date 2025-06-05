import { useState, useCallback, useEffect } from 'react';
import DarkCyanButton from "../components/ui/Buttons/DarkCyanButton";
import ExportButton from "../components/ui/Buttons/ExportButton";
import CustomInput from "../components/ui/fields/CustomInput";
import Pagination from "../components/ui/fields/CustomPagination";
import CustomTable from "../components/ui/tables/CustomTable";
import FilterField from "../components/ui/Layouts/FilterField";
import PageLayout from "../components/ui/Layouts/PageLayout";
import PaginationLayout from "../components/ui/Layouts/PaginationLayout";
import TitleField from "../components/ui/Layouts/TitleLayout";
import CountInfoTitle from "../components/ui/Text/CountInfoTitle";
import CustomTitle from "../components/ui/Text/CustomTitle";
import { ProductModal } from "../components/modal/CrudInherited/ProductModal";
import useProducts from "../api/hooks/useProducts";
import useExport from '../api/hooks/useExport';
import type { Product, ProductParams } from '../api/types/product';
import productService from '../api/services/productService';

const ProductPage = () => {
    const [nameFilter, setNameFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{
        key: number | null;
        direction: 'asc' | 'desc';
    }>({ key: null, direction: 'asc' });
    const pageSize = 10;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedProduct, setSelectedProduct] = useState<{ id?: number, name: string } | null>(null);
    
    const columnToApiSortMap: Record<number, string> = {
        0: 'id',
        1: 'name'
    };
    
    const { exportData, isExporting, exportProgress } = useExport<Product>();

    const { 
        isLoading, 
        error, 
        data: productsData, 
        getProducts,
        createProduct,
        updateProduct,
        deleteProduct
    } = useProducts();
    
    const loadProducts = useCallback(async () => {
        const params: any = {
            page: currentPage,
            pageSize,
            name: nameFilter || undefined
        };

        if (sortConfig.key !== null) {
            params.sortBy = columnToApiSortMap[sortConfig.key];
            params.sortDirection = sortConfig.direction;
        }

        await getProducts(params);
    }, [currentPage, nameFilter, sortConfig, getProducts]);
    
    useEffect(() => {
        loadProducts();
    }, [currentPage, nameFilter, sortConfig, loadProducts]);

    const handleFilterChange = (value: string) => {
        setNameFilter(value);
        setCurrentPage(1);
    };

    const handleSort = (columnIndex: number) => {
        if (!columnToApiSortMap[columnIndex]) return;
        
        setSortConfig(prev => {
            if (prev.key === columnIndex) {
                return {
                    key: columnIndex,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc'
                };
            }
            return {
                key: columnIndex,
                direction: 'asc'
            };
        });
    };

    const handleExport = async () => {
        try {
            await exportData({
                fetchData: async (page, pageSize) => {
                    const params: ProductParams = {
                        page,
                        pageSize,
                        name: nameFilter || undefined,
                        sortBy: sortConfig.key !== null ? columnToApiSortMap[sortConfig.key] : undefined,
                        sortDirection: sortConfig.direction
                    };
                    
                    const result = await productService.getProducts(params);
                    return {
                        items: Array.isArray(result.items) ? result.items : [],
                        totalCount: result.totalCount || 0
                    };
                },
                fileName: 'products_export',
                transformData: (product) => ({
                    ID: product.id,
                    'Название': product.name
                })
            });
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const handleCreateProduct = () => {
        setModalMode('create');
        setSelectedProduct({ name: '' });
        setIsModalOpen(true);
    };

    const handleEditProduct = (productId: number, productName: string) => {
        setModalMode('edit');
        setSelectedProduct({ id: productId, name: productName });
        setIsModalOpen(true);
    };

    const handleViewProduct = (productId: number, productName: string) => {
        setModalMode('view');
        setSelectedProduct({ id: productId, name: productName });
        setIsModalOpen(true);
    };

    const handleDeleteProduct = async (rowData: any[]) => {
        const [id] = rowData;
        if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
            try {
                await deleteProduct(Number(id));
                loadProducts();
            } catch (err) {
                console.error('Ошибка при удалении товара:', err);
            }
        }
    };

    const handleSubmitProduct = async (productData: { name: string }) => {
        try {
            if (modalMode === 'create') {
                await createProduct(productData);
            } else if (modalMode === 'edit' && selectedProduct?.id) {
                await updateProduct(selectedProduct.id, productData);
            }
            loadProducts();
        } catch (err) {
            console.error('Ошибка при сохранении товара:', err);
        }
    };

    const handleRowDoubleClick = (rowData: any[], rowIndex: number) => {
        const [id, name] = rowData;
        handleEditProduct(Number(id), name);
    };

    const tableData = productsData?.items.map(product => [
        product.id.toString(),
        product.name,
    ]) || [];

    const tableActions = [
        {
            label: 'Удалить',
            action: handleDeleteProduct,
            color: '#EF4444'
        }
    ];

    return (
        <PageLayout>
            <TitleField>
                <CustomTitle>Товары</CustomTitle>
                <ExportButton 
                    onClick={handleExport}
                    isExporting={isExporting}
                    exportProgress={exportProgress}
                />
            </TitleField>
            
            <FilterField>
                <CustomInput 
                    inputType="text"
                    placeholder="Название товара"
                    value={nameFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                />
                <DarkCyanButton 
                    style={{ width: "15vw" }}
                    onClick={handleCreateProduct}
                >
                    + Новый товар
                </DarkCyanButton>
            </FilterField>
            
            {isLoading && <div>Загрузка...</div>}
            {error && <div>Ошибка: {error}</div>}
            
            {!isLoading && !error && (
                <>
                    <CustomTable 
                        columns={[
                            { name: "ID", isSortable: true },
                            { name: "Название", isSortable: true, align: "left" },
                        ]} 
                        data={tableData}
                        onRowDoubleClick={handleRowDoubleClick}
                        contextMenuActions={tableActions}
                        onSort={handleSort}
                        sortConfig={sortConfig}
                    />
                    
                    <PaginationLayout>
                        <CountInfoTitle 
                            total={productsData?.totalCount || 0} 
                        />
                        
                        <Pagination
                            total={productsData?.totalCount || 0}
                            current={currentPage}
                            onChange={setCurrentPage}
                            itemsPerPage={pageSize}
                        />
                    </PaginationLayout>
                </>
            )}
            
            <ProductModal
                mode={modalMode}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitProduct}
                initialData={selectedProduct || { name: '' }}
            />
        </PageLayout>
    );
};

export default ProductPage;