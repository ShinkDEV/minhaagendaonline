import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Product {
  id: string;
  salon_id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  cost_price: number | null;
  quantity: number;
  min_quantity: number | null;
  category: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductMovement {
  id: string;
  salon_id: string;
  product_id: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string | null;
  related_appointment_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  product?: Product;
}

export function useProducts() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["products", profile?.salon_id],
    queryFn: async () => {
      if (!profile?.salon_id) return [];

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("salon_id", profile.salon_id)
        .order("name");

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!profile?.salon_id,
  });
}

export function useActiveProducts() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["products", "active", profile?.salon_id],
    queryFn: async () => {
      if (!profile?.salon_id) return [];

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("salon_id", profile.salon_id)
        .eq("active", true)
        .order("name");

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!profile?.salon_id,
  });
}

export function useLowStockProducts() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["products", "low-stock", profile?.salon_id],
    queryFn: async () => {
      if (!profile?.salon_id) return [];

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("salon_id", profile.salon_id)
        .eq("active", true);

      if (error) throw error;
      
      // Filter products where quantity <= min_quantity
      return (data as Product[]).filter(p => p.quantity <= (p.min_quantity || 5));
    },
    enabled: !!profile?.salon_id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'salon_id' | 'created_at' | 'updated_at'>) => {
      if (!profile?.salon_id) throw new Error("Salão não encontrado");

      const { data, error } = await supabase
        .from("products")
        .insert({
          ...product,
          salon_id: profile.salon_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar produto: " + error.message);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(product)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar produto: " + error.message);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir produto: " + error.message);
    },
  });
}

export function useProductMovements(productId?: string) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["product-movements", productId, profile?.salon_id],
    queryFn: async () => {
      if (!profile?.salon_id) return [];

      let query = supabase
        .from("product_movements")
        .select("*, product:products(*)")
        .eq("salon_id", profile.salon_id)
        .order("created_at", { ascending: false });

      if (productId) {
        query = query.eq("product_id", productId);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data as ProductMovement[];
    },
    enabled: !!profile?.salon_id,
  });
}

export function useCreateProductMovement() {
  const queryClient = useQueryClient();
  const { profile, user } = useAuth();

  return useMutation({
    mutationFn: async (movement: {
      product_id: string;
      type: 'in' | 'out';
      quantity: number;
      reason?: string;
      notes?: string;
      related_appointment_id?: string;
    }) => {
      if (!profile?.salon_id) throw new Error("Salão não encontrado");

      const { data, error } = await supabase
        .from("product_movements")
        .insert({
          ...movement,
          salon_id: profile.salon_id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-movements"] });
      toast.success("Movimentação registrada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar movimentação: " + error.message);
    },
  });
}
