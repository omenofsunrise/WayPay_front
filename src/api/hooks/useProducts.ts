import { useState, useCallback } from 'react';
import productService from '../services/productService';
import type { Product, ProductParams } from '../types/product';
import type { PaginatedResponse } from '../types/common';

const useProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<Product> | null>(null);

  const getProducts = useCallback(async (params?: ProductParams): Promise<PaginatedResponse<Product> | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await productService.getProducts(params);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProduct = async (product: Omit<Product, 'id'>): Promise<Product | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const createdProduct = await productService.createProduct(product);
      return createdProduct;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    data,
    getProducts,
    createProduct,
  };
};

export default useProducts;