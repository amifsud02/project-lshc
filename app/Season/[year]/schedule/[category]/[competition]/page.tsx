'use client'

import Fixtures from "@/components/Fixture/Fixture";
import Footer from "@/components/Footer/Footer";
import PageHeader from "@/components/PageHeader/PageHeader";
import { Partners }from "@/components/Partners/Partners";
import { IFixture } from "@/lib/types/fixture.type";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ICompetitionDropdownItem = {
    [key: string]: {
        [key: string]: {
            key: string;
            value: string;
        };
    };
}

const competitionDropdown: ICompetitionDropdownItem = {
    "men": {
        "all": {
            "key": "All",
            "value": "All",
        },
        "national-league": {
            "key": "National League",
            "value": "Men's National League"
        },
        "1st-division-league": {
            "key": "1st Division League",
            "value": "Men's 1st Division League"
        },
        "premier-league": {
            "key": "Premier League",
            "value": "Men's Premier League"
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
            "value": "All",
        },
        "premier-league": {
            "key": "Premier League",
            "value": "Women's Premier League"
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
            "value": "All",
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
            "value": "All",
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


const Schedule = () => {
    const pathname = usePathname();
    const router = useRouter();
    const params = useParams(); // [category]/[competition]
    
    const { year, category, competition } = params;

    const [selectedCompetition, setSelectedCompetition] = useState<{ key: string; value: string }>({
        key: '',
        value: ''
    });

    const [selectedYear, setSelectedYear] = useState(year);

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<IFixture[]>([]); // To store the fetched data in the state.
    const [error, setError] = useState(null);

    const changeURL = (event: any) => {
        const newCompetition = event.target.value;
        const parentKey = Object.keys(competitionDropdown[category as string]).find((key) => competitionDropdown[category as string][key].value === newCompetition);
        
        if(parentKey) {
            setSelectedCompetition({ key: parentKey, value: newCompetition })
            router.push(`${process.env.NEXT_PUBLIC_API_URL as string}/season/${year}/schedule/${category}/${parentKey}`)
        }
    }

    useEffect(() => {
        // This effect is only responsible for setting selectedCompetition based on the URL parameters.
        if (category && competition) {
            const competitionItem = competitionDropdown[category as string][competition as string];
            if (competitionItem) {
                setSelectedCompetition({
                    key: competitionItem.key,
                    value: competitionItem.value
                });
            }
        }
    }, [category, competition]);
    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            
            try {
                if (selectedCompetition.value) {
                    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v2/fixtures/season/${year}/${category}/${competition}`;

                    const response = await fetch(url);
                    
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    const fixtures: IFixture[] = await response.json();
                    setData(fixtures);
                }
            } catch (err: any) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };
    
        // Fetch data only when selectedCompetition.value or selectedYear changes
        if (selectedCompetition.value && selectedYear) {
            fetchData();
        }
    }, [year, selectedCompetition.value, selectedYear]);

    return (
        <>
            <PageHeader pageName='Fixtures & Results' />

            <section className="parent">
                <div className="fixtureHeader">
                    <div className="tabs__wrapper " >
                        <div className="nav__tab">
                            <ul className="category">
                                <li className={`tablinks ${pathname.startsWith(`/season/${year}/schedule/men`)? 'active' : ''}`}>
                                    <Link href={`${process.env.NEXT_PUBLIC_API_URL}/season/${year}/schedule/men/all`}>
                                        Men
                                    </Link>
                                </li>
                                <li className={`tablinks ${pathname.startsWith(`/season/${year}/schedule/women`) ? 'active' : ''}`}>
                                    <Link href={`${process.env.NEXT_PUBLIC_API_URL}/season/${year}/schedule/women/all`}>
                                        Women
                                    </Link></li>
                                <li className={`tablinks ${pathname.startsWith(`/season/${year}/schedule/u21-men`) ? 'active' : ''}`}>
                                    <Link href={`${process.env.NEXT_PUBLIC_API_URL}/season/${year}/schedule/u21-men/all`}>
                                        U21 Men
                                    </Link></li>
                                <li className={`tablinks ${pathname.startsWith(`/season/${year}/schedule/u21-women`) ? 'active' : ''}`}>
                                    <Link href={`${process.env.NEXT_PUBLIC_API_URL}/season/${year}/schedule/u21-women/all`}>
                                        U21 Women
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                        <select name="competitions" id="competitions" onChange={changeURL} value={selectedCompetition.value}>
                            {Object.keys(competitionDropdown[category as string]).map((competitionKey) => {
                                const competition = competitionDropdown[category as string][competitionKey];
                                return (
                                    <option value={competition.value} key={competition.key}>{competition.key}</option>
                                )
                            })}
                        </select>

                        <select name="seasons" className='numbers' id="seasons">
                            <option value="2024">2023/24</option>
                        </select>
                    </div> */}
                </div>


                {loading ? (
                    <div className="fr-page-section">
                        <div className="lds-ring">
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* <div>
                            Upcoming Match
                            Display One Upcoming Match with Countdown
                        </div> */}

                           
                            { data && <Fixtures data={data} showTitle={false}></Fixtures> }
                            {/* Display All Matches of Competition

                            Separate with Month */}
                    </>
                )


                }


            </section>
            <Partners/>
            <Footer/>
        </>
    )
}

export default Schedule;
