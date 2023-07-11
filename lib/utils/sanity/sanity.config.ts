import { createClient } from 'next-sanity';
import ImageUrlBuilder from '@sanity/image-url';

export const client = createClient({
    projectId: '1sbbeli5',
    dataset: 'production',
    apiVersion: '2022-03-25',
    useCdn: true
})

export const imageBuilder = ImageUrlBuilder(client);
