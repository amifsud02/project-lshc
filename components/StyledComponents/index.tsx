'use client'

import styled, { keyframes } from "styled-components"

export const ArticleContent = styled.div`
    max-width: 1015px;
    width: 83.33333333%;
    margin: 0 auto;

    > p {
        font-size: 18px;
        max-width: 808px;
        margin: 0 auto;
    }

    > img {
        max-width: 808px;
        margin-left: auto;
        margin-right: auto;
    }
`

export const OtherArticles = styled.div`
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    column-gap: 40px;

    @media (min-width: 768px){
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
`
export const NewsWrapper = styled.div`
    position: relative;
    overflow: hidden;
    margin-bottom: 35px;

    &:hover {        
        .newsCardImage img {
            transform: scale(1.05);
            transition: transform 500ms ease-out;
        }
      }
    
    &:last-child{
        margin-bottom: 0;
    }
`

export const NewsImageWrapper = styled.div`
    box-shadow: 0 0 15px rgba(0,0,0,0.1);
    position: relative;
    width: 100%;
    height: 250px;
    object-fit: cover;
    object-position: center;
    overflow: hidden;

    img {
        transform: scale(1);
        transition: transform 500ms ease-out;
    }
`
export const NewsInfo = styled.div`
    padding: 0 20px;
`

export const NewsDate = styled.p`
    font-size: 11px;
    font-family: 'Montserrat',sans-serif;
    font-weight: 600;
    text-transform: uppercase;
    margin: 10px 0;
    margin-top: 20px;
    line-height: 1em;
    opacity: 0.6;
`

export const NewsTitle = styled.h3`
    font-size: 16px;
    font-family: 'Montserrat', sans-serif;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--secondary-color);
`