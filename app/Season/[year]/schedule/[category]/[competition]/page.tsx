'use client'

import PageHeader from "@/components/PageHeader/PageHeader";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface CompetitionDropdownItem {
    [key: string]: {
        [key: string]: {
            key: string;
            value: string;
        };
    };
}

const competitionDropdown: CompetitionDropdownItem = {
    "men": {
        "all": {
            "key": "All",
            "value": "all"
        },
        "national-league": {
            "key": "National League",
            "value": "Men's National League"
        },
        "knockout": {
            "key": "Knockout",
            "value": "Men's Knock Out"
        },
        "louis-borg-cup": {
            "key": "Louis Borg Cup",
            "value": "Men's Louis Borg Cup"
        }
    },
    "women": {
        "all": {
            "key": "All",
            "value": "all"
        },
        "national-league": {
            "key": "National League",
            "value": "Women's National League"
        },
        "knockout": {
            "key": "Knockout",
            "value": "Women's Knock Out"
        },
        "louis-borg-cup": {
            "key": "Louis Borg Cup",
            "value": "Women's Louis Borg Cup"
        }
    },
    "u21-men": {
        "all": {
            "key": "All",
            "value": "all"
        },
        "national-league": {
            "key": "National League",
            "value": "U21 Men's National League"
        },
        "knockout": {
            "key": "Knockout",
            "value": "U21 Men's Knock Out"
        }
    },
    "u21-women": {
        "all": {
            "key": "All",
            "value": "all"
        },
        "national-league": {
            "key": "National League",
            "value": "U21 Women's National League"
        },
        "knockout": {
            "key": "Knockout",
            "value": "U21 Women's Knock Out"
        }
    }
}


const Fixtures = () => {
    const router = useRouter();
    const params = useParams(); // [category]/[competition]

    const { category, competition } = params;

    const [selectedCompetition, setSelectedCompetition] = useState<{ key: string; value: string }>({
        key: '',
        value: ''
    });

    const [loading, setLoading] = useState(false);

    const changeURL = (event) => {
        const newCompetition = event.target.value;
        const parentKey = Object.keys(competitionDropdown[category]).find((key) => competitionDropdown[category][key].value === newCompetition);
        setSelectedCompetition({ parentKey, newCompetition })
        router.push(`http://localhost:3000/season/2023/schedule/${category}/${parentKey}`)
    }

    useEffect(() => {
        setLoading(true);

        // Fetch Data API

        setSelectedCompetition(competitionDropdown[category][competition]);

        setTimeout(() => {
            setLoading(false);
        }, 2500)
    }, [category, competition]);
    return (
        <>
            <PageHeader pageName='Fixtures & Results' />

            <section className="parent">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {/* Display Sub Nav |       | Display Drop Down with different competition | Display Dropdown with different season */}

                    {/* On Page Enter, by default its MEN, and the dropdown are populated accordingly. So there would be a dictionary 
                    of the Category be it men, and the dropdowns are populated with the competitions of the men. Obviously the value would be "Men's National League" 
                    for instance and then displayed as National League */}

                    <div className="tabs__wrapper">
                        <div className="nav__tab">
                            <ul className="category">
                                <li className="tablinks">
                                    <Link href="http://localhost:3000/season/2023/schedule/men/national-league">
                                        Men
                                    </Link>
                                </li>
                                <li className="tablinks">
                                    <Link href="http://localhost:3000/season/2023/schedule/women/national-league">
                                        Women
                                    </Link></li>
                                <li className="tablinks">
                                    <Link href="http://localhost:3000/season/2023/schedule/u21-men/national-league">
                                        U21 Men
                                    </Link></li>
                                <li className="tablinks">
                                    <Link href="http://localhost:3000/season/2023/schedule/u21-women/national-league">
                                        U21 Women
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                        <select name="competitions" id="competitions" onChange={changeURL} value={selectedCompetition.value}>
                            {Object.keys(competitionDropdown[category]).map((competitionKey) => {
                                const competition = competitionDropdown[category][competitionKey];
                                return (
                                    <option value={competition.value} key={competition.key}>{competition.key}</option>
                                )
                            })}
                        </select>

                        <select name="seasons" id="seasons">
                            <option value="2023">2022/23</option>
                            <option value="2024">2023/24</option>
                        </select>
                    </div>

                </div>


                {loading ? (
                    <div className="lds-ring"><div></div><div></div><div></div><div></div></div>
                ) : (
                    <>
                        <div>
                            Upcoming Match
                            Display One Upcoming Match with Countdown
                        </div>

                        <div>
                            Display All Matches of Competition

                            Separate with Month
                        </div>
                    </>
                )


                }


            </section>
        </>
    )
}

export default Fixtures;