import { describe, it, expect } from 'vitest';

const SUPABASE_URL = "https://zpdvqtmxvkzkycvoqvyp.supabase.co";
// Using your verified client token string
const SUPABASE_ANON_KEY = "sb_publishable_9jyt1HHwYZcvW-nOXl2iMw_LAUSe50Q"; 

describe('Supabase Sync Gateway Infrastructure Validation', () => {

    it('should successfully handshake with the nte_sync rest engine without 401 modifications', async () => {
        const testPayload = {
            sync_key: "#user-test-environment-ci",
            state_json: { dailies: { "Test Task Connection": true } },
            updated_at: new Date().toISOString()
        };

        // Constructing the exact REST request parameters your app sends behind the scenes
        const response = await fetch(`${SUPABASE_URL}/rest/v1/nte_sync?on_conflict=sync_key`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates, return=minimal'
            },
            body: JSON.stringify(testPayload)
        });

        // Log the status code clearly if it fails to give you immediate context
        if (response.status !== 200 && response.status !== 201) {
            const errText = await response.text();
            console.error(`Gateway Failure Details [Status ${response.status}]:`, errText);
        }

        // The assertion ensures no 401 (Unauthorized) or 400 (Bad Schema) blocks occur
        expect([200, 201, 204]).toContain(response.status);
    });
});