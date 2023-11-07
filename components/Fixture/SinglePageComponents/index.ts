"use client";

import styled from "styled-components";

export const Divider = styled.hr`
    width: 100%;
    height: 2px;
    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(0, 13, 36, 0.5) 50%, rgba(255,255,255,0) 100%);
    margin-bottom: 60px;
`;

export const FixtureHeader = styled.header`
    width: 100%;
    height: 600px;
    z-index: -1;
    display: flex;
    flex-flow: column;
    justify-content: space-evenly;
    background: linear-gradient(125deg, rgba(1, 41, 111, 1) 0%, rgba(0, 13, 36, 0.95) 100%), url('/template.svg') no-repeat center;
    background-size: cover;
    color: white;

    @media (min-width: 768px) {
        justify-content: flex-end;
    }
`;

export const HeaderContent = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 300px;

    @media (min-width: 768px) {
        gap: 0px;
    }
`

export const Top = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 0.75em;
    font-weight: 600;
    opacity: 0.8;
    flex-basis: 0;
    flex-grow: 1;
    gap: 10px;
`;

export const Middle = styled.div`    
    flex-grow: 6;
    flex-basis: 0;
    display: grid;
    grid-template-columns: 1fr 100px 1fr;
    place-items: center;
    -webkit-box-align: center;
`;

export const Bottom = styled.div`
    // margin-top: 20px;
    gap: 15px;
    display: flex;
    justify-content: center;
    text-align: center;
    flex-flow: column;
    flex-grow: 1;
    flex-basis: 0;
    font-size: 0.75em;
    font-weight: 600;
    opacity: 1;
`;

export const Countdown = styled.div`
    display: none;
`

export const Team = styled.div<{ isSecond: boolean }>`
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
    gap: 15px;
    height: 50px;
    max-height: 50px;
    justify-content: center;

    text-align: ${props => (props.isSecond ? 'left' : 'right')};

    @media (min-width: 700px) {
        gap: 30px;
        flex-direction: ${props => (props.isSecond ? 'row-reverse' : 'row')};
    }
`;

export const TeamStats = styled.div<{ isSecond: boolean }>`
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
    gap: 15px;
    height: 50px;
    max-height: 50px;
    justify-content: center;

    text-align: ${props => (props.isSecond ? 'left' : 'right')};

    @media (min-width: 700px) {
        gap: 30px;
        flex-direction: ${props => (props.isSecond ? 'row-reverse' : 'row')};
    }

    @media screen and (max-width: 600px) {
        flex-direction: row-reverse;
        height: 75px;
        max-height: 75px;
    }
`;

export const TeamLogo = styled.img`

    width: 60px;
    height: 60px;

    @media (min-width: 768px) {
        width: 75px;
        height: 75px;
    }
    
`;


export const TeamName = styled.h4`
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 700;
    text-transform: uppercase;

    @media (min-width: 768px) {
        font-size: 2rem;
        line-height: 2rem;
    }

`;

export const TeamNameStats = styled.h4`
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 700;
    text-transform: uppercase;

    @media (min-width: 768px) {
        font-size: 2rem;
        line-height: 2rem;
    }

    @media screen and (max-width: 600px) {
        font-size: 1.5rem;
    }
`;

export const TimeScore = styled.div`
    margin: 0 20px;
    text-align: center;
    
    margin: 15px 0;
    font-weight: 700;
    font-size: 18px;
    font-family: "Montserrat", sans-serif !important; 
    padding: 10px 15px; 
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.2)
`;

export const TimeScoreV2 = styled.div`
    text-align: center;
    font-weight: 700;
    padding: 7.5px 10px;
    border-radius: 6px;
    color: white;
    background: rgba(1, 41, 111, 0.8)
`;

export const LineUpWrapper = styled.article`
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    
`

export const LineUpContainer = styled.section`
    display: flex;
    gap: 50px;

    @media screen and (max-width: 600px) {
        flex-direction: column;
    }
`

export const LineUpHeader = styled.div`
    display: flex;
    width: 100%;
    gap: 20px;
    margin: 10px 0;
`

export const Goals = styled.div<{ isRight: boolean }>`
    text-align: ${props => (props.isRight ? 'right' : 'left')};

    @media screen and (max-width: 600px) {
        text-align: right;
    }
`

export const LineUpTitle = styled.h6`
    text-align: center;
    font-size: 1.5rem;
    text-transform: uppercase;
    margin-bottom: 50px;
`

export const LineUpColumn = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    width: 50%;

    @media screen and (max-width: 600px) {
        width: 100%;
    }
`
export const PlayerContent = styled.div<{ isRight: boolean }>`
    display: flex;
    flex-direction: ${props => (props.isRight ? 'row-reverse' : 'row')};
    width: 100%;
    gap: 20px;
    align-items: center;
    padding-bottom: 0.5rem;
    margin-bottom: 0.5rem;
    border-bottom: 0.5px solid rgba(0,0,0, 0.08);

    @media screen and (max-width: 600px) {
        flex-direction: row;
    }
`
export const PlayerImage = styled.div`
    position: relative; 
    border-radius: 50%;
    overflow: hidden;
    width: 40px;
    height: 40px;
`

export const PlayerName = styled.p<{ isRight: boolean }>`
font-size: 0.85rem;
    font-weight: 600;
    flex-grow: 5;
    text-align: ${props => (props.isRight ? 'right' : 'left')};

    @media screen and (max-width: 600px) {
        text-align: left;
    }
`

export const PlayerStats = styled.p<{ isRight: boolean }>`
    font-size: 0.85rem;
    font-weight: 600;
    flex-grow: 1;
    text-align: ${props => (props.isRight ? 'left' : 'right')};

    @media screen and (max-width: 600px) {
        text-align: right;
    }
`