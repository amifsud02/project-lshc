import PageHeader from "@/components/PageHeader/PageHeader";

export const revalidate = 60

// Nothing is pre-built; each page renders on its first visit and is then cached (see `revalidate`).
export function generateStaticParams() {
  return []
}

const Fixtures = () => {
    return (
        <>
            <PageHeader pageName='Current Season'/>
            <section className="parent"></section>
        </>
    )
}

export default Fixtures;