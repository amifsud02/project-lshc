import { createClient } from 'next-sanity';

export const client = createClient({
    projectId: '1sbbeli5',
    dataset: 'production',
    apiVersion: '2022-03-25',
    useCdn: false
})

