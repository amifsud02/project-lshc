"use client"

import { CSSProperties } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { Carousel } from 'react-responsive-carousel'
import "react-responsive-carousel/lib/styles/carousel.min.css"
import Image from 'next/image'
import Link from 'next/link'

const TeamCarousel = () => {

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
                <div className="carousel-image-container">
                    <div className="image-wrapper">
                        <img src='/la-salle-hero.jpg' alt="" />
                    </div>
                    <div className="carousel-content-element">
                        <h2 className='title' style={{ color: "#fff", marginBottom: '0px', fontSize: '20px' }}>Men First Team</h2>
                        {/* <p style={{ color: "#fff", marginBottom: '25px' }}>The squad coached by Kenneth Hili</p> */}
                        <Link href={'/teams/men-first-team/all'} className="button-link">View Team</Link>
                    </div>
                </div>
                <div className="carousel-image-container">
                    <div className="image-wrapper">
                        <img src='https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/arxdxfehrefwzdvaxvu7' alt="" />
                    </div>
                    <div className="carousel-content-element">
                        <h2 className='title' style={{ color: "#fff", marginBottom: '0px', fontSize: '20px' }}>Women First Team</h2>
                        {/* <p style={{ color: "#fff", marginBottom: '25px' }}>The squad coached by Kenneth Hili</p> */}
                        <Link href={'/teams/men-first-team/all'} className="button-link">View Team</Link>
                    </div>
                </div>
                <div className="carousel-image-container">
                <div className="image-wrapper">
                        <img src='https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/kqd1a1rljelowgtoztuo' alt="" />
                    </div>
                    <div className="carousel-content-element">
                        <h2 className='title' style={{ color: "#fff", marginBottom: '0px', fontSize: '20px' }}>U21 Men Team</h2>
                        {/* <p style={{ color: "#fff", marginBottom: '25px' }}>The squad coached by Kenneth Hili</p> */}
                        <Link href={'/teams/men-first-team/all'} className="button-link">View Team</Link>
                    </div>
                </div>
                <div className="carousel-image-container">
                    <div className="image-wrapper">
                        <img src='https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/lynuchzl53oqdgq5blpv' alt="" />
                    </div>
                    <div className="carousel-content-element">
                        <h2 className='title' style={{ color: "#fff", marginBottom: '0px', fontSize: '20px' }}>U21 Women Team</h2>
                        {/* <p style={{ color: "#fff", marginBottom: '25px' }}>The squad coached by Kenneth Hili</p> */}
                        <Link href={'/teams/men-first-team/all'} className="button-link">View Team</Link>
                    </div>
                </div>
            </Carousel>
        </section>
    )
}

export default TeamCarousel