
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://maktglceegodkkbgxgdq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ha3RnbGNlZWdvZGtrYmd4Z2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NzY1MjgsImV4cCI6MjA3OTM1MjUyOH0.-vfgmMJ6V7Eq4pEMIxqq824Ql0N1DqFzbvxIVongsuI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listFiles() {
    console.log(`Listing files in root of bucket 'resumes'`);

    const { data, error } = await supabase
        .storage
        .from('resumes')
        .list(); // List root

    if (error) {
        console.error('Error listing files:', error);
        return;
    }

    console.log('Files found:', data);

    if (data && data.length > 0) {
        console.log('First file details:', data[0]);
    }
}

listFiles();
