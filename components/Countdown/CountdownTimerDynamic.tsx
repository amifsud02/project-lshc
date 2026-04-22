'use client';

import dynamic from 'next/dynamic';

const CountdownTimer = dynamic(() => import('./CountdownTimer'), {
    ssr: false,
    loading: () => <></>,
});

export default CountdownTimer;
