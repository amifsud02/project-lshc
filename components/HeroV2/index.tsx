"use client"

import Slider from "react-slick"
import Navbar from "../Hero/Navbar";

export const HeroV2 = () => {
    const settings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
    };

    return (
        <div className="relative min-h-screen flex flex-col overflow-hidden">
            <Navbar />
            {/* Top content */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-100 z-10 flex flex-col items-center h-100">
                <h1 style={{
                    fontSize: "100px",
                    fontWeight: 900,
                    color: "white",
                    fontOpticalSizing: "auto",
                    textTransform: "uppercase",
                    lineHeight: "52%",
                    letterSpacing: "2px",
                    WebkitTextStrokeWidth: "1px",
                    WebkitTextStrokeColor: "white",
                    textAlign: "center",
                }}>
                    La Salle <br />
                    <span style={{
                        lineHeight: "0.8",
                        fontSize: "2.5rem",
                        letterSpacing: "2px",
                        WebkitTextStrokeWidth: "0px",
                        WebkitTextStrokeColor: "white",
                    }}>Handball Club</span>
                </h1>
                <p style={{
                    textTransform: "uppercase",
                    lineHeight: "0.8",
                    fontSize: "1.5rem",
                    letterSpacing: "2px",
                    fontWeight: 700,
                    textAlign: "center",
                    marginTop: "25px",
                    color: "white",
                }}>
                    EST. <span style={{
                        fontFamily: "monospace",
                    }}>1998</span>
                </p>
            </div>
            {/* Slider */}
            <div className="flex-1">
                <Slider {...settings}>
                    <div>
                        <div className="h-screen bg-blue-500 flex items-center justify-center text-white text-3xl">
                            <img src="/la-salle-hero.jpg" alt="La Salle Hero 1" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }} />
                        </div>
                    </div>
                    <div>
                        <div className="h-screen bg-blue-500 flex items-center justify-center text-white text-3xl">
                            <img src="/la-salle-hero.jpg" alt="La Salle Hero 1" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }} />
                        </div>
                    </div>
                    <div>
                        <div className="h-screen bg-blue-500 flex items-center justify-center text-white text-3xl">
                            <img src="/la-salle-hero.jpg" alt="La Salle Hero 1" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }} />
                        </div>
                    </div>
                </Slider>
            </div>
        </div>
    )
}