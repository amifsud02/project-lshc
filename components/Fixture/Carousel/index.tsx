'use client'

import { CSSProperties } from 'react'
import { Carousel } from "react-responsive-carousel"
import { ChevronRight, ChevronLeft } from 'lucide-react'
import "react-responsive-carousel/lib/styles/carousel.min.css"
import UpcomingFixture from './UpcomingFixture/UpcomingFixture'
import { IFixture } from '@/lib/types/fixture.type'

const FixtureCarousel = ({ data }: { data: IFixture[] }) => {

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
        justifyContent: 'center',
        background: 'transparent'
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
        <Carousel
            className='mb-50'
            infiniteLoop={true}
            showStatus={false}
            showThumbs={false}
            showIndicators={data.length > 1}


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

            {data.map((fixture: IFixture) => {
                console.log(fixture.startDate);
                return (
                    <div className="carousel-match-container" key={fixture._id}>
                        <div className="carousel-match-content-element">
                            <UpcomingFixture fixture={fixture} />
                        </div>
                    </div>
                )
            })}

        </Carousel>
    )
}

export default FixtureCarousel;