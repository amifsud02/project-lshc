'use client'

import { useEffect } from 'react'
import { useCart } from '@/lib/shop/cart'

export default function ClearCartOnMount() {
  const clear = useCart((s) => s.clear)
  useEffect(() => {
    clear()
  }, [clear])
  return null
}
