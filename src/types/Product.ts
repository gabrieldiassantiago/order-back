interface Product {
    name: string;
    price: number;
    stock: number;
    categoryId: string;
    availability: boolean;
    additionIds?: string[];
  }