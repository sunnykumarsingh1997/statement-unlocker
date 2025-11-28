import { supabase } from '../supabaseClient';

export const addToHistory = async (type, details) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('history')
            .insert([
                {
                    user_id: user.id,
                    action_type: type,
                    details: details
                }
            ]);

        if (error) throw error;
    } catch (error) {
        console.error('Error adding to history:', error.message);
    }
};
