import Footer from '@/components/Footer/Footer'
import { getFooterGlobal } from '@/lib/utils/payload/globals'

export default async function SiteFooter() {
  const data = await getFooterGlobal()
  return <Footer data={data} />
}
