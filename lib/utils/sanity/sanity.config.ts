import { createClient } from 'next-sanity';
import { createImageUrlBuilder } from '@sanity/image-url';

export const client = createClient({
    projectId: '1sbbeli5',
    dataset: 'production',
    apiVersion: '2022-03-25',
    useCdn: true
})

export const clientV2 = createClient({ 
    projectId: 'mde7gom4', 
    dataset: 'production',
    apiVersion: '2022-03-25',
    useCdn: false 
})


export const imageBuilder = createImageUrlBuilder(client);
export const imageBuilderV2 = createImageUrlBuilder(clientV2);

