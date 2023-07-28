import Footer from "@/components/Footer/Footer";
import PageHeader from "@/components/PageHeader/PageHeader";
import { Partners } from "@/components/Partners/Partners";

const History = () => {
  return (
    <>
      <PageHeader pageName="Our History" />
      <section className="parent">
        <p className='information'>
          Alan Grima had been working as a Physical Education teacher at De La
          Salle College for a year and had seen the big opportunity which
          existed. Originally one of the founders of the Malta Handball
          Association and co-founder of Birzebbugia Handball Club (that won the
          first men&apos;s senior national league, but withdrew from all competitions
          the following season), Alan started working hard on fulfilling his
          dream - founding the La Salle Handball Club.
        </p>
        <p className='information'>
          This came about following a lot of hard work which culminated after
          guiding the Maltese Under 17 boys in the FISEC handball competition
          held in Gran Canaria in July 1998. His dream would not have come true
          without the support of Christian Bonett, Alistair Vella, Renzo Kerr
          Cumbo and Keith Monaco who helped him in his venture. A call for
          interested players, a players&apos; meeting was set up in August 1998 where
          full details were given.
        </p>
        <p className='information'>
          Alan Grima was backed by John Taylor, the then Head of the Physical
          Education Department at De La Salle who gave his impeccable assistance
          and went out of his way many times, as did Joe Mallia, Gino Mallia and
          Daniel Buhagiar who helped the club obtain a three year sponsorship
          deal with the Grech brothers of Mirechem Ltd.
        </p>
        <p className='information'>
          It was also important for Alan Grima to set up the club&apos;s handball
          nursery something which was done immediately in the first year. It was
          the first handball nursery in Malta with a group of around 15 Form 1
          and Form 2 students attending training regularly after school, making
          it an immediate success. Throughout the years the Club has always
          sought to give the youngsters of De La Salle College, not only the
          possibility to learn the basics of the game in a disciplined and
          enjoyable way, but also the opportunity to get into senior handball,
          and indeed beyond, actually forming part of national teams at various
          age levels.
        </p>
        <p className='information'>
          Since its foundation, the LSHC always aimed to promote and develop the
          game of Handball at De La Salle College and in Malta by:
        </p>
        <span>
          <li>
            Fostering interest in, and knowledge about Handball at De La Salle
            College.
          </li>
          <li>
            Developing a solid and permanent youth nursery for the benefit of De
            La Salle College students.
          </li>
          <li>
            Preparing teams for participation in friendly and competitive
            Handball matches, leagues and tournaments organised both locally and
            abroad.
          </li>
          <li>
            Organising any other activity that is conducive to the development
            and promotion of the game of Handball.
          </li>
        </span>
      </section>
      <Partners/>
      <Footer/>
    </>
  );
};

export default History;
