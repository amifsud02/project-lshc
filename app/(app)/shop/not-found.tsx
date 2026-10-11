import Link from 'next/link'
import PageHeader from '@/components/PageHeader/PageHeader'
import ShopPreviewHint from '@/components/Shop/ShopPreviewHint'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function ShopNotFound() {
  return (
    <>
      <PageHeader pageName="Shop" />
      <section className="parent">
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <h2 className="text-xl font-semibold">Page not found</h2>
            <p className="text-muted-foreground">This page isn&apos;t available right now.</p>
            <Button render={<Link href="/" />} variant="outline" className="mt-2">
              Back to home
            </Button>
            <ShopPreviewHint />
          </CardContent>
        </Card>
      </section>
    </>
  )
}
