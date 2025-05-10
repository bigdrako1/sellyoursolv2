
import { supabase } from "@/integrations/supabase/client";
import { UserSettings } from "@/types/database.types";
import { Currency } from "@/store/currencyStore";

// Function to retrieve user settings
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return null;
  }
}

// Function to update user settings
export async function updateUserSettings(settings: Partial<UserSettings & { currency: Currency | string }>, userId: string): Promise<UserSettings | null> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user settings:', error);
    return null;
  }
}

// Function to create default user settings
export async function createDefaultUserSettings(userId: string): Promise<UserSettings | null> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .insert([{ user_id: userId }])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating default user settings:', error);
    return null;
  }
}

// Function to get settings by key
export function getSettingValue(settings: UserSettings | null, key: string, defaultValue: any): any {
  if (!settings) return defaultValue;
  return settings[key as keyof UserSettings] ?? defaultValue;
}

// Function to save specific setting
export async function saveSetting(userId: string, key: string, value: any): Promise<boolean> {
  try {
    const update = { [key]: value };
    const { error } = await supabase
      .from('user_settings')
      .update(update)
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error);
    return false;
  }
}
