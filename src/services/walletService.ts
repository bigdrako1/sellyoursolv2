
import { supabase } from "@/integrations/supabase/client";
import { Wallet } from "@/types/database.types";

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching wallets:', error);
    return [];
  }
}

export async function addWallet(userId: string, address: string, name?: string): Promise<Wallet | null> {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .insert([{
        user_id: userId,
        address,
        name: name || null,
        is_primary: false
      }])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding wallet:', error);
    return null;
  }
}

export async function setPrimaryWallet(walletId: string, userId: string): Promise<boolean> {
  try {
    // First reset all wallets to not primary
    await supabase
      .from('wallets')
      .update({ is_primary: false })
      .eq('user_id', userId);

    // Then set the selected one as primary
    const { error } = await supabase
      .from('wallets')
      .update({ is_primary: true })
      .eq('id', walletId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error setting primary wallet:', error);
    return false;
  }
}

export async function removeWallet(walletId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wallets')
      .delete()
      .eq('id', walletId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing wallet:', error);
    return false;
  }
}
