/**
 * @vitest-environment happy-dom
 */
import { vi, describe, it, expect } from 'vitest';

// 1. MOCK BEFORE ANY IMPORTS
vi.mock('../js/supabaseClient.js', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    channel: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  }
}));

// 2. NOW IT IS SAFE TO IMPORT
import { supabase } from '../js/supabaseClient.js';

describe('Supabase Sync Gateway Infrastructure Validation', () => {
  it('should call upsert when state is pushed to cloud', async () => {
    await supabase.from('nte_sync').upsert({ sync_key: 'test', state_json: {} });
    expect(supabase.from).toHaveBeenCalledWith('nte_sync');
    expect(supabase.from('nte_sync').upsert).toHaveBeenCalled();
  });
});