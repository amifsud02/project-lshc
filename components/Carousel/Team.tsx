"use client"

import { CSSProperties } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { Carousel } from 'react-responsive-carousel'
import "react-responsive-carousel/lib/styles/carousel.min.css"
import Image from 'next/image'
import Link from 'next/link'

export type CarouselItem = {
    src: string
    alt?: string
    title: string
    description?: string | null
    ctaLabel?: string | null
    ctaLink: string
}

const TeamCarousel = ({ items }: { items: CarouselItem[] }) => {
    if (!items.length) return null


    const arrowStyles: CSSProperties = {
        position: 'absolute',
        zIndex: 2,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 30,
        height: 30,
        cursor: 'pointer',
        borderRadius: '50%',
        alignItems: 'center',
        justifyContent: 'center'
    };

    const indicatorStyles: CSSProperties = {
        background: 'rgba(255, 255, 255, 0.2)',
        width: 10,
        height: 10,
        display: 'inline-block',
        margin: '0 4px',
        borderRadius: '50%'
    };

    return (
        <section className='parent'>
            <Carousel
                infiniteLoop={true}
                showStatus={false}
                showThumbs={false}
                showIndicators={false}

                width={'100%'}

                renderArrowPrev={(onClickHandler, hasPrev, label) =>
                    hasPrev && (
                        <button type="button" onClick={onClickHandler} title={label} style={{ ...arrowStyles, left: 50 }} className="arrow-navigation">
                            <ChevronLeft color='white' style={{ marginLeft: '-2px' }} />
                        </button>
                    )
                }
                renderArrowNext={(onClickHandler, hasNext, label) =>
                    hasNext && (
                        <button type="button" onClick={onClickHandler} title={label} style={{ ...arrowStyles, right: 50 }} className="arrow-navigation">
                            <ChevronRight color='white' style={{ marginLeft: '2px' }} />
                        </button>
                    )
                }

                renderIndicator={(onClickHandler, isSelected, index, label) => {
                    if (isSelected) {
                        return (
                            <li
                                style={{ ...indicatorStyles, background: '#fff' }}
                                aria-label={`Selected: ${label} ${index + 1}`}
                                title={`Selected: ${label} ${index + 1}`}
                            />
                        );
                    }
                    return (
                        <li
                            style={indicatorStyles}
                            onClick={onClickHandler}
                            onKeyDown={onClickHandler}
                            value={index}
                            key={index}
                            role="button"
                            tabIndex={0}
                            title={`${label} ${index + 1}`}
                            aria-label={`${label} ${index + 1}`}
                        />
                    );
                }}
            >
                {items.map((item, i) => (
                    <div key={i} className="carousel-image-container">
                        {/* `fill` images take their size from the wrapper, so it needs a height */}
                        <div className="image-wrapper" style={{ height: 'clamp(260px, 45vw, 520px)' }}>
                            <Image src={item.src} alt={item.alt ?? item.title} fill className="object-cover" />
                        </div>
                        <div className="carousel-content-element">
                            <h2 className='title' style={{ color: "#fff", marginBottom: '0px', fontSize: '20px' }}>{item.title}</h2>
                            {item.description ? <p style={{ color: 'rgba(255, 255, 255, 0.85)', maxWidth: '32rem', padding: '0 16px' }}>{item.description}</p> : null}
                            <Link href={item.ctaLink} className="button-link">{item.ctaLabel || 'View'}</Link>
                        </div>
                    </div>
                ))}
            </Carousel>
        </section>
    )
}

export default TeamCarousel