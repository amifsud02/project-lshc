'use client'

import PageHeader from "@/components/PageHeader/PageHeader";
import Link from "next/link";
import { useState } from "react";

const Fixtures = () => {

    const [ selectedCompetition, setSelectedCompetition] = useState('Men National League');
    
    return (
        <>
            <PageHeader pageName='Fixtures & Results' />

            <section className="parent">
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    {/* Display Sub Nav |       | Display Drop Down with different competition | Display Dropdown with different season */}

                    {/* On Page Enter, by default its MEN, and the dropdown are populated accordingly. So there would be a dictionary 
                    of the Category be it men, and the dropdowns are populated with the competitions of the men. Obviously the value would be "Men's National League" 
                    for instance and then displayed as National League */}
                    
                    <div className="tabs__wrapper">
                        <div className="nav__tab">
                            <ul className="category">
                                <li className="tablinks">
                                    <Link href="#">
                                        Men
                                    </Link>
                                </li>
                                <li className="tablinks">
                                    <Link href="#">
                                        Women
                                    </Link></li>
                                <li className="tablinks">
                                    <Link href="#">
                                        U21 Men
                                    </Link></li>
                                <li className="tablinks">
                                    <Link href="#">
                                        U21 Women
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div style={{display: 'flex', justifyContent: 'space-between', gap: '20px'}}>
                        <select name="competitions" id="competitions">
                            <option value="National League">National League</option>
                            <option value="Premier League">Premiere League</option>
                            <option value="Louis Borg Cup">Louis Borg Cup</option>
                            <option value="Knock-Out">Knock Out</option>
                        </select>

                        <select name="seasons" id="seasons">
                            <option value="2023">2022/23</option>
                            <option value="2024">2023/23</option>
                        </select>
                    </div>

                </div>

                <div>
                    Upcoming Match
                    Display One Upcoming Match with Countdown
                </div>

                <div>
                    Display All Matches of Competition

                    Separate with Month
                </div>


            </section>
        </>
    )
}

export default Fixtures;